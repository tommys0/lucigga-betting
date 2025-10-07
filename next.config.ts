import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/isomorphic-ws",
    "@libsql/isomorphic-fetch",
    "@libsql/hrana-client",
    "@prisma/adapter-libsql",
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
