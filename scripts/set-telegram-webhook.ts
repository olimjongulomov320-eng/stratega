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

// Menu button next to the message field opens the shop Mini App; public command list.
async function call(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json() as { ok?: boolean; description?: string };
  if (!j.ok) throw new Error(`${method}: ${j.description ?? r.status}`);
}
await call("setChatMenuButton", { menu_button: { type: "web_app", text: "Do'kon", web_app: { url: `${siteUrl}/tg/shop` } } });
await call("setMyCommands", {
  commands: [
    { command: "start", description: "Bosh menyu / Главное меню" },
    { command: "catalog", description: "Katalog / Каталог" },
    { command: "cart", description: "Savat / Корзина" },
  ],
});
// Staff see their commands too (they are checked against Admin → Xodimlar on every use).
await call("setMyCommands", {
  scope: { type: "all_group_chats" },
  commands: [
    { command: "hisobot", description: "Hisobot" },
    { command: "sorovlar", description: "Yangi so'rovlar" },
    { command: "narx", description: "Narx: /narx SKU NARX" },
    { command: "qoldiq", description: "Qoldiq: /qoldiq SKU SONI" },
    { command: "id", description: "Telegram ID" },
  ],
});
console.log(`Menu button: ${siteUrl}/tg/shop · admin Mini App: ${siteUrl}/tg/admin`);

const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json()) as { ok?: boolean; result?: { username?: string } };
console.log(`Webhook enabled for ${siteUrl}/api/telegram/webhook`);
if (me.result?.username) console.log(`Customer bot: https://t.me/${me.result.username}`);
