import { timingSafeEqual } from "node:crypto";
import { processStaffBotUpdate } from "@/lib/telegram-admin";
import { withBot } from "@/lib/telegram-api";

export const runtime = "nodejs";

function validSecret(received: string | null, expected: string) {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Webhook of the staff bot (TELEGRAM_ADMIN_BOT_TOKEN). Separate secret from the customer bot's webhook. */
export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET?.trim();
  if (!botToken || !secret) {
    return Response.json({ error: "Telegram staff webhook is not configured." }, { status: 503 });
  }
  if (!validSecret(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: Parameters<typeof processStaffBotUpdate>[0];
  try {
    update = await request.json();
    if (!Number.isSafeInteger(update.update_id)) throw new Error("Invalid update.");
  } catch {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }

  try {
    await withBot(botToken, () => processStaffBotUpdate(update));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram staff update failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Update could not be processed." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.TELEGRAM_ADMIN_BOT_TOKEN && process.env.TELEGRAM_ADMIN_WEBHOOK_SECRET) });
}
