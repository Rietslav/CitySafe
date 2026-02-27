import { Router } from "express";
import { prisma } from "../prisma.js";

export const metaRouter = Router();

// get /health
metaRouter.get("/health", async (_req, res, next) => {
  try {
    const [cityCount, categoryCount] = await Promise.all([
      prisma.city.count(),
      prisma.category.count()
    ]);

    res.json({
      ok: true,
      env: process.env.NODE_ENV ?? "unknown",
      db: { cityCount, categoryCount }
    });
  } catch (e) {
    next(e);
  }
});

// get /cities
metaRouter.get("/cities", async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" }
    });
    res.json(cities);
  } catch (e) {
    next(e);
  }
});

// get /categories
metaRouter.get("/categories", async (req, res, next) => {
  try {
    const cityIdParam = req.query.cityId;
    const cityId = cityIdParam ? Number(cityIdParam) : undefined;

    if (cityIdParam && Number.isNaN(cityId)) {
      return res.status(400).json({ error: "cityID must be a number" });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });

    res.json(categories);
  } catch (e) {
    next(e);
  }
});
