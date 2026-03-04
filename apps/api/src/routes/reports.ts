import { Router } from "express";
import type { RequestHandler } from "express";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
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

// get /reports
reportsRouter.get("/reports", async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const status = req.query.status?.toString();

    const where: any = {};
    if (categoryId !== undefined) where.categoryId = categoryId;
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      include: { city: true, category: true, attachments: true, coordinate: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(reports);
  } catch (e) {
    next(e);
  }
});

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

    const files = Array.isArray(req.files) ? (req.files as multer.File[]) : [];

    const report = await prisma.report.create({
      data: {
        title,
        description,
        cityId: resolvedCityId,
        categoryId: Number(categoryId),
        userId: userId,
        status: "NEW",
        coordinate: {
          create: {
            latitude: parsedLatitude,
            longitude: parsedLongitude
          }
        },
        statusLogs: {
          create: { status: "NEW", note: "created" }
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
      include: { city: true, category: true, attachments: true, coordinate: true }
    });

    res.status(201).json(reportWithRelations ?? report);
  } catch (e) {
    next(e);
  }
});
