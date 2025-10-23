// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
export const prisma =
  (globalThis as any).prisma || new PrismaClient({ log: ["warn", "error"] });
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;
