// Ogohlantirishlarni qayta hisoblash (test ma'lumotlari to'g'rilgandan keyin).
// Ishlatish: npx tsx scripts/refresh-alerts.ts
import "dotenv/config";
import { refreshAlerts } from "../src/lib/alerts";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await refreshAlerts();
  console.log("refresh:", JSON.stringify(result));
  const alerts = await prisma.alert.findMany({
    select: { severity: true, type: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`jami alert: ${alerts.length}`);
  for (const a of alerts) console.log(` - ${a.severity} ${a.type} | ${a.title}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERR", err instanceof Error ? err.message : err);
  process.exit(1);
});
