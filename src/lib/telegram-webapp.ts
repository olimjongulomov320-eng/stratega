import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type WebAppUser = { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };

const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Checks Telegram Mini App `initData` (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 * HMAC-SHA256 of the sorted fields with a key derived from the bot token. Returns the Telegram user, or null.
 */
export function verifyWebAppInitData(initData: string, botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()): WebAppUser | null {
  if (!botToken || !initData || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const received = Buffer.from(hash, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "null") as WebAppUser | null;
    return user && Number.isSafeInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}
