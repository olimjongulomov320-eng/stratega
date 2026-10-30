import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  experimental: {
    // Admin CSV/Excel import accepts files up to 5MB (default limit is 1MB).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
