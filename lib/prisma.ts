// Force Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn("⚠️ DATABASE_URL not set — falling back to local SQLite");
    return new PrismaClient();
  }

  if (databaseUrl.startsWith("postgresql://")) {
    console.log("🔗 Connecting to PostgreSQL database...");
  } else {
    console.warn("⚠️ DATABASE_URL not PostgreSQL — using Prisma defaults");
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
