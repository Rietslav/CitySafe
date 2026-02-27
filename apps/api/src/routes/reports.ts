import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

export const reportsRouter = Router();

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
      include: { city: true, category: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(reports);
  } catch (e) {
    next(e);
  }
});

// post /reports
reportsRouter.post("/reports", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, cityId, categoryId } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ error: "title and categoryId are required" });
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

    const report = await prisma.report.create({
      data: {
        title,
        description,
        cityId: resolvedCityId,
        categoryId: Number(categoryId),
        userId: userId,
        status: "NEW",
        statusLogs: {
          create: { status: "NEW", note: "created" }
        }
      }
    });

    res.status(201).json(report);
  } catch (e) {
    next(e);
  }
});
