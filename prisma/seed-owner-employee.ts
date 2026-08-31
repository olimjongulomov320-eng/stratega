// Bir martalik skript: birinchi OWNER xodimini yaratadi, shunda yangi
// Employee-asosidagi kirish tizimidan ham foydalanish mumkin bo'ladi
// (eski umumiy parol orqali kirish ham parallel ishlashda davom etadi).
//
// Ishga tushirish: npx tsx prisma/seed-owner-employee.ts <email> <parol> [ism]

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      "Foydalanish: npx tsx prisma/seed-owner-employee.ts <email> <parol> [ism]"
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const employee = await prisma.employee.upsert({
    where: { email },
    create: {
      email,
      name: name ?? "Owner",
      role: "OWNER",
      passwordHash,
      isActive: true,
    },
    update: {
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  console.log(`OWNER xodimi tayyor: ${employee.email} (${employee.id})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
