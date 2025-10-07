import { PrismaClient } from "@prisma/client";
// LibSQL adapter disabled due to compatibility issues
// See LIBSQL_HTTP_ISSUE.md for details
// import { PrismaLibSQL } from "@prisma/adapter-libsql";
// import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // LibSQL adapter code commented out due to build errors
  // For Vercel deployment, use Turso or PostgreSQL instead
  // See STATUS_SUMMARY.md for setup instructions

  /*
  const libsqlUrl = process.env.LIBSQL_URL;

  if (libsqlUrl && libsqlUrl !== "undefined" && libsqlUrl.trim() !== "") {
    try {
      console.log("Initializing LibSQL adapter with URL:", libsqlUrl);
      const libsqlClient = createClient({
        url: libsqlUrl,
      });
      const adapter = new PrismaLibSQL(libsqlClient);
      console.log("LibSQL adapter created successfully");
      return new PrismaClient({ adapter });
    } catch (error) {
      console.error("Failed to initialize LibSQL adapter:", error);
      console.log("Falling back to regular SQLite database");
      return new PrismaClient();
    }
  }
  */

  // For Vercel: Set DATABASE_URL to Turso or PostgreSQL connection string
  console.log("Using database from DATABASE_URL");
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
