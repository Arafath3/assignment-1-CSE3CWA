// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

/** Create a PrismaClient with a stable (PrismaClient) type. */
function createClient(): PrismaClient {
  const url = process.env.ACCELERATE_URL ?? process.env.DIRECT_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DB URL. Set ACCELERATE_URL or DIRECT_DATABASE_URL."
    );
  }

  const base = new PrismaClient({ datasources: { db: { url } } });

  // Use Accelerate at runtime if configured, but cast back to PrismaClient
  // so call signatures are stable and not a union.
  return process.env.ACCELERATE_URL
    ? (base.$extends(withAccelerate()) as unknown as PrismaClient)
    : base;
}

// Dev: reuse a single instance (HMR). Prod: new per cold start.
const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") return createClient();
  if (!globalForPrisma._prisma) globalForPrisma._prisma = createClient();
  return globalForPrisma._prisma;
}
