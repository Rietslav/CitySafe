import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { metaRouter } from "./routes/meta.js";
import { reportsRouter } from "./routes/reports.js";

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

app.use("/auth", authRouter);
app.use(metaRouter);
app.use(reportsRouter);

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
