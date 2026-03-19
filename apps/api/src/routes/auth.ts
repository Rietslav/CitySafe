import { Router } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

// post /auth/register
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body ?? {};

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "email, password, firstName, lastName are required" });
    }

    const requestedRole = normalizeRole(role);
    if (!requestedRole) {
      return res.status(400).json({ error: "Rol invalid" });
    }
    if (requestedRole !== "USER") {
      const creator = decodeTokenFromHeader(req.headers.authorization);
      if (!creator || creator.role !== "ADMIN") {
        return res.status(403).json({ error: "Doar administratorii pot crea conturi elevate" });
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        role: requestedRole
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    });
  } catch (e) {
    next(e);
  }
});

// post /auth/login
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    });
  } catch (e) {
    next(e);
  }
});

function normalizeRole(input: unknown): Role | null {
  const allowed: Role[] = ["USER", "ADMIN", "MODERATOR"];
  if (!input) return "USER";
  const value = String(input).toUpperCase();
  if (allowed.includes(value as Role)) {
    return value as Role;
  }
  return null;
}

function decodeTokenFromHeader(header?: string) {
  if (!header || !header.startsWith("Bearer ")) return null;
  try {
    const token = header.slice("Bearer ".length).trim();
    return jwt.verify(token, process.env.JWT_SECRET ?? "") as { role?: Role };
  } catch (_err) {
    return null;
  }
}

authRouter.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = Number(req.user?.sub);
    if (!userId) return res.status(401).json({ error: "Invalid user" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (e) {
    next(e);
  }
});
