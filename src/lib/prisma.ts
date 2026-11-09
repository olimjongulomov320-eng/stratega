import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// The hosted Postgres role allows few connections and `next build` starts several
// workers, each with its own pool, so cap every process (default 3). Build workers get one
// connection each: they prerender the cached public pages, and there is one worker per CPU.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? (process.env.NEXT_PHASE === "phase-production-build" ? 1 : 3)),
  idleTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
