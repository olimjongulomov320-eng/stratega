import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

if (!token || !secret || !siteUrl) {
  throw new Error("Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and NEXT_PUBLIC_SITE_URL in .env first.");
}
if (!siteUrl.startsWith("https://")) throw new Error("Telegram production webhooks require an HTTPS site URL.");
if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) throw new Error("TELEGRAM_WEBHOOK_SECRET must use 1–256 letters, numbers, underscores, or hyphens.");

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: `${siteUrl}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
});
const result = await response.json() as { ok?: boolean; description?: string; result?: boolean };
if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram returned ${response.status}.`);

const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json()) as { ok?: boolean; result?: { username?: string } };
console.log(`Webhook enabled for ${siteUrl}/api/telegram/webhook`);
if (me.result?.username) console.log(`Customer bot: https://t.me/${me.result.username}`);
