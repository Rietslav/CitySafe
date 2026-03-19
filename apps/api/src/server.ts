import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { metaRouter } from "./routes/meta.js";
import { reportsRouter } from "./routes/reports.js";

dotenv.config();

const app = express();

app.use(express.json());

const explicitCorsOrigins = process.env.CORS_ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);
const allowLocalRegex = /^https?:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (explicitCorsOrigins?.includes(origin)) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV !== "production" && allowLocalRegex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} nu este permis prin CORS`), false);
    }
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
