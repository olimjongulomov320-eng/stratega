import { timingSafeEqual } from "node:crypto";
import { sendDailyReport } from "@/lib/telegram-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Evening report to the sales Telegram chat. Called by Vercel Cron (vercel.json) with "Authorization: Bearer CRON_SECRET". */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const received = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  await sendDailyReport();
  return Response.json({ ok: true });
}
