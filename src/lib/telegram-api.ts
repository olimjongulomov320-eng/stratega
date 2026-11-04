import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

// Low-level Telegram Bot API helpers shared by the customer bot (telegram.ts) and the staff tools (telegram-admin.ts).

// Two bots share this code: the customer bot (TELEGRAM_BOT_TOKEN) and the staff bot (TELEGRAM_ADMIN_BOT_TOKEN).
// A webhook runs its handler inside withBot(), so every API call in that request uses the right bot.
const botContext = new AsyncLocalStorage<string>();
export const adminToken = () => process.env.TELEGRAM_ADMIN_BOT_TOKEN?.trim();
export const token = () => botContext.getStore() ?? process.env.TELEGRAM_BOT_TOKEN?.trim();
export const withBot = <T>(botToken: string, fn: () => Promise<T>) => botContext.run(botToken, fn);
/** Bot API address; TELEGRAM_API_URL points it at a local mock server in tests. */
export const telegramApiBase = () => (process.env.TELEGRAM_API_URL?.trim() || "https://api.telegram.org").replace(/\/$/, "");
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.stratega.uz").replace(/\/$/, "");
export const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const money = (n: number) => `${new Intl.NumberFormat("uz-UZ").format(n)} so'm`;
/**
 * Item lines of a request or order for a staff message. Telegram drops messages over 4096 characters, so a big
 * cart would never reach the sales chat; after `max` lines the rest is summarised (the full list is in the admin panel).
 */
export const itemLines = (lines: string[], max = 20) =>
  (lines.length > max ? [...lines.slice(0, max), `… va yana ${lines.length - max} ta pozitsiya`] : lines).join("\n");
/** Mini App (web_app) buttons need an https address, so they are left out in local development. */
export const webAppUrl = (path: string) => (siteUrl().startsWith("https://") ? `${siteUrl()}${path}` : null);

export async function api<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
  const botToken = token();
  if (!botToken) throw new Error("Telegram bot is not configured.");
  const response = await fetch(`${telegramApiBase()}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const result = await response.json() as { ok?: boolean; description?: string; result?: T };
  if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed: ${result.description ?? response.status}`);
  return result.result as T;
}

export async function sendMessage(chatId: number | string, text: string, options: Record<string, unknown> = {}) {
  return api("sendMessage", { chat_id: chatId, text, ...options });
}

/** Message to the sales chat (TELEGRAM_SELLER_CHAT_ID), sent by the staff bot when it is configured; never throws. */
export async function notifySeller(text: string, options: Record<string, unknown> = {}) {
  const chatId = process.env.TELEGRAM_SELLER_CHAT_ID?.trim();
  const sender = adminToken() ?? token();
  if (!chatId || !sender) return;
  try { await withBot(sender, () => sendMessage(chatId, text, { parse_mode: "HTML", disable_web_page_preview: true, ...options })); }
  catch (error) { console.error("Telegram seller notification failed", error instanceof Error ? error.message : "unknown error"); }
}
