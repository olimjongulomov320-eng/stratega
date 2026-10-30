import "dotenv/config";
import { processTelegramUpdate, type TelegramUpdatePayload } from "../src/lib/telegram";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN in .env first.");

const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;
const info = await fetch(api("getWebhookInfo")).then((r) => r.json()) as { ok?: boolean; result?: { url?: string } };
if (info.result?.url) throw new Error("This bot already uses a webhook. Run this poller only after removing the webhook with Telegram deleteWebhook.");

console.log("Telegram bot polling is running. Press Ctrl+C to stop.");
let offset = 0;
while (true) {
  const response = await fetch(api("getUpdates"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ offset, timeout: 50, allowed_updates: ["message", "callback_query"] }),
    signal: AbortSignal.timeout(65_000),
  });
  const result = await response.json() as { ok?: boolean; description?: string; result?: TelegramUpdatePayload[] };
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram returned ${response.status}.`);
  for (const update of result.result ?? []) {
    try {
      await processTelegramUpdate(update);
      offset = update.update_id + 1;
    } catch (error) {
      console.error("Telegram update failed; it will be retried.", error instanceof Error ? error.message : "unknown error");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      break;
    }
  }
}
