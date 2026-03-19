import { Router } from "express";
import type { Express, RequestHandler } from "express";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import { Prisma, ReportStatus, Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { AuthPayload, AuthRequest } from "../middleware/auth.js";
import { uploadReportPhoto } from "../lib/s3.js";

export const reportsRouter = Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { files: 3, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Doar imaginile sunt permise"));
      return;
    }
    cb(null, true);
  }
});

const uploadPhotos: RequestHandler = (req, res, next) => {
  const contentType = req.headers["content-type"] ?? "";
  if (typeof contentType === "string" && !contentType.startsWith("multipart/form-data")) {
    next();
    return;
  }

  upload.array("photos", 3)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError || err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }
      return next(err);
    }
    next();
  });
};

const publicStatuses: ReportStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];
const allStatuses: ReportStatus[] = ["WAITING", "NEW", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const adminRoles: Role[] = ["ADMIN", "MODERATOR"];

const reportInclude = Prisma.validator<Prisma.ReportInclude>()({
  city: true,
  category: true,
  attachments: true,
  coordinate: true,
  statusLogs: true,
  user: {
    select: { id: true, firstName: true, lastName: true, email: true }
  },
  _count: {
    select: { likes: true }
  }
});

type ReportWithRelations = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;
type ReportResponse = ReportWithRelations & { viewerHasLiked: boolean };

function parseUserId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getOptionalUserId(req: AuthRequest): number | null {
  if (req.user?.sub !== undefined) {
    return parseUserId(req.user.sub);
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = header.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "") as AuthPayload;
    req.user = payload;
    return parseUserId(payload.sub);
  } catch {
    return null;
  }
}

async function attachViewerLikeMetadata(
  reports: ReportWithRelations[],
  userId: number | null
): Promise<ReportResponse[]> {
  if (!reports.length) {
    return [];
  }

  if (!userId) {
    return reports.map((report) => ({ ...report, viewerHasLiked: false }));
  }

  const likedEntries = await prisma.reportLike.findMany({
    where: { userId, reportId: { in: reports.map((report) => report.id) } },
    select: { reportId: true }
  });
  const likedIds = new Set(likedEntries.map((entry) => entry.reportId));

  return reports.map((report) => ({
    ...report,
    viewerHasLiked: likedIds.has(report.id)
  }));
}

// get /reports (public)
reportsRouter.get("/reports", async (req: AuthRequest, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const status = req.query.status?.toString();
    const scope = typeof req.query.scope === "string" ? req.query.scope : "public";

    const where: any = {};
    if (categoryId !== undefined) where.categoryId = categoryId;
    if (scope === "public") {
      where.status = { in: publicStatuses };
    } else if (status) {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      include: reportInclude,
      orderBy: { createdAt: "desc" }
    });

    const enriched = await attachViewerLikeMetadata(reports, getOptionalUserId(req));

    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

// current user reports
reportsRouter.get("/me/reports", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = Number(req.user?.sub);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ error: "Invalid user" });
    }

    const reports = await prisma.report.findMany({
      where: { userId },
      include: reportInclude,
      orderBy: { createdAt: "desc" }
    });

    const enriched = await attachViewerLikeMetadata(reports, userId);

    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

// admin reports listing
reportsRouter.get(
  "/admin/reports",
  requireAuth,
  requireRole(adminRoles),
  async (req: AuthRequest, res, next) => {
    try {
      const reports = await prisma.report.findMany({
        include: reportInclude,
        orderBy: { createdAt: "desc" }
      });

      const userId = Number(req.user?.sub);
      const enriched = await attachViewerLikeMetadata(reports, Number.isFinite(userId) ? userId : null);

      res.json(enriched);
    } catch (e) {
      next(e);
    }
  }
);

// post /reports
reportsRouter.post("/reports", requireAuth, uploadPhotos, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, cityId, categoryId, latitude, longitude } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ error: "title and categoryId are required" });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return res.status(400).json({ error: "latitude and longitude must be numbers" });
    }

    const userId = Number(req.user?.sub);
    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({ error: "Invalid user" });
    }

    let resolvedCityId: number;
    if (cityId !== undefined && cityId !== null && cityId !== "") {
      const parsedCityId = Number(cityId);
      if (Number.isNaN(parsedCityId)) {
        return res.status(400).json({ error: "cityId must be a number" });
      }
      resolvedCityId = parsedCityId;
    } else {
      const defaultCity = await prisma.city.findFirst({
        orderBy: { id: "asc" },
        select: { id: true }
      });
      if (!defaultCity) {
        return res.status(500).json({ error: "No city configured" });
      }
      resolvedCityId = defaultCity.id;
    }

    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

    const report = await prisma.report.create({
      data: {
        title,
        description,
        cityId: resolvedCityId,
        categoryId: Number(categoryId),
        userId: userId,
        status: "WAITING",
        coordinate: {
          create: {
            latitude: parsedLatitude,
            longitude: parsedLongitude
          }
        },
        statusLogs: {
          create: { status: "WAITING", note: "created" }
        }
      }
    });

    if (files.length) {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadReportPhoto({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
            reportId: report.id
          })
        )
      );

      await prisma.reportAttachment.createMany({
        data: uploads.map(({ url }) => ({
          reportId: report.id,
          url
        }))
      });
    }

    const reportWithRelations = await prisma.report.findUnique({
      where: { id: report.id },
      include: reportInclude
    });

    let responseBody = reportWithRelations ?? report;

    if (reportWithRelations) {
      const [enriched] = await attachViewerLikeMetadata(
        [reportWithRelations],
        Number.isFinite(userId) ? userId : null
      );
      responseBody = enriched ?? reportWithRelations;
    }

    res.status(201).json(responseBody);
  } catch (e) {
    next(e);
  }
});

reportsRouter.patch(
  "/reports/:id/status",
  requireAuth,
  requireRole(adminRoles),
  async (req: AuthRequest, res, next) => {
    try {
      const reportId = Number(req.params.id);
      if (!Number.isFinite(reportId)) {
        return res.status(400).json({ error: "Invalid report id" });
      }

      const { status, note } = req.body ?? {};
      if (!status || !allStatuses.includes(status as ReportStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const nextStatus = status as ReportStatus;
      const noteText = typeof note === "string" && note.trim().length ? note.trim() : undefined;

      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: nextStatus,
          statusLogs: {
            create: {
              status: nextStatus,
              note: noteText ?? `Status actualizat de ${req.user?.email ?? req.user?.sub ?? "system"}`
            }
          }
        },
        include: reportInclude
      });

      const [enriched] = await attachViewerLikeMetadata(
        [updated],
        parseUserId(req.user?.sub)
      );

      res.json(enriched ?? updated);
    } catch (e) {
      next(e);
    }
  }
);

reportsRouter.post(
  "/reports/:id/like",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const reportId = Number(req.params.id);
      if (!Number.isFinite(reportId)) {
        return res.status(400).json({ error: "ID raport invalid" });
      }

      const userId = Number(req.user?.sub);
      if (!Number.isFinite(userId)) {
        return res.status(401).json({ error: "Utilizator invalid" });
      }

      const reportExists = await prisma.report.findUnique({
        where: { id: reportId },
        select: { id: true }
      });

      if (!reportExists) {
        return res.status(404).json({ error: "Raportul nu exista" });
      }

      const existingLike = await prisma.reportLike.findUnique({
        where: {
          userId_reportId: {
            userId,
            reportId
          }
        }
      });

      let liked: boolean;

      if (existingLike) {
        await prisma.reportLike.delete({ where: { id: existingLike.id } });
        liked = false;
      } else {
        await prisma.reportLike.create({ data: { userId, reportId } });
        liked = true;
      }

      const count = await prisma.reportLike.count({ where: { reportId } });

      res.json({ liked, count });
    } catch (e) {
      next(e);
    }
  }
);
