import { timingSafeEqual } from "node:crypto";
import { processTelegramUpdate, type TelegramUpdatePayload } from "@/lib/telegram";

export const runtime = "nodejs";

function validSecret(received: string | null, expected: string) {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret) {
    return Response.json({ error: "Telegram webhook is not configured." }, { status: 503 });
  }
  if (!validSecret(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: TelegramUpdatePayload;
  try {
    update = await request.json() as TelegramUpdatePayload;
    if (!Number.isSafeInteger(update.update_id)) throw new Error("Invalid update.");
  } catch {
    return Response.json({ error: "Invalid update." }, { status: 400 });
  }

  try {
    await processTelegramUpdate(update);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram update failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Update could not be processed." }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET) });
}
