import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Bitta instansiya uchun ulanishlar soni cheklangan bo'lishi shart:
// Prisma Postgres (remote) ulanish limiti kichik, `next build` esa bir
// nechta worker ishga tushiradi. Cheklanmagan pool "too many connections
// for role prisma_migration" (P2037) xatosiga olib keladi.
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 3);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number.isFinite(POOL_MAX) && POOL_MAX > 0 ? POOL_MAX : 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
  return new PrismaClient({ adapter });
}

// Dev'da HMR va prod'da instansiya qayta ishlatilishi uchun global cache.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
