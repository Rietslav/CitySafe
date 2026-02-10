import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./prisma.js";

dotenv.config();

const app = express();

app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOrigin?.length ? corsOrigin : true,
    credentials: true
  })
);

// get /health
app.get("/health", async (_req, res, next) => {
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
app.get("/cities", async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc"}
    });
    res.json(cities);
  } catch (e) {
    next(e);
  }
});

// get /categories
app.get("/categories", async (req, res, next) => {
  try {
    const cityIdParam = req.query.cityId;
    const cityId = cityIdParam ? Number(cityIdParam) : undefined;

    if (cityIdParam && Number.isNaN(cityId)) {
      return res.status(400).json({ error: "cityID must be a number" });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc"}
    });

    res.json(categories);
  } catch (e) {
    next(e);
  }
});

// get /reports
app.get("/reports", async (req, res, next) => {
  try {
    const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const status = req.query.status?.toString();

    const where: any = {};
    if (cityId !== undefined) where.cityId = cityId;
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
app.post("/reports", async (req, res, next) => {
  try {
    const { title, description, cityId, categoryId } = req.body;

    if (!title || !cityId || !categoryId) {
      return res.status(400).json({ error: "title, cityId, categoryId are required" });
    }

    const report = await prisma.report.create({
      data: {
        title,
        description,
        cityId: Number(cityId),
        categoryId: Number(categoryId),
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

// 404 handler 
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? String(err?.message ?? err) : undefined
  });
});

const port = Number(process.env.PORT ?? 4000);

// app.listen
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});



