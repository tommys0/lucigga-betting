import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const libsqlUrl = process.env.LIBSQL_URL;

  // Use LibSQL adapter if URL is provided and valid
  if (libsqlUrl && libsqlUrl !== "undefined" && libsqlUrl.trim() !== "") {
    try {
      console.log("Initializing LibSQL adapter with URL:", libsqlUrl);

      // Create LibSQL client for HTTP connection
      // Try with integrityCheck disabled for HTTP
      const libsqlClient = createClient({
        url: libsqlUrl,
        integrityCheck: false,
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

  // Fallback to regular SQLite
  console.log("Using SQLite database (no LIBSQL_URL found)");
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
