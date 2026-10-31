import "server-only";

import { prisma } from "@/lib/prisma";
import { moveStock } from "@/lib/inventory";
import { can, type Permission } from "@/lib/permissions";
import { RFQ_STATUS } from "@/lib/labels";
import { parseNumber } from "@/lib/csv";
import { api, sendMessage, notifySeller, siteUrl, html, money, webAppUrl } from "@/lib/telegram-api";
import type { Employee, RfqStatus } from "@/generated/prisma/client";

// Staff tools in the Telegram bot: who is staff, quick commands, request-status buttons, the daily report.
// Everything goes through the same database and is written to the same audit log as the web admin.

type From = { id: number; first_name?: string };

/** The active employee linked to this Telegram account (Admin → Xodimlar → Telegram ID), or null. */
export async function staffFor(telegramUserId: number): Promise<Employee | null> {
  const e = await prisma.employee.findUnique({ where: { telegramId: String(telegramUserId) } });
  return e?.isActive ? e : null;
}

const allowed = (e: Employee, p: Permission) => can(e.role, p);
const audit = (e: Employee, action: string, entityType: string, entityId: string, details: object) =>
  prisma.auditLog.create({ data: { action, actor: `${e.name} (Telegram)`, actorId: e.id, entityType, entityId, details } });

const RFQ_ACTIONS: { status: RfqStatus; label: string }[] = [
  { status: "IN_REVIEW", label: "👀 Ko'rib chiqilmoqda" },
  { status: "QUOTED", label: "💬 Narx berildi" },
  { status: "CONFIRMED", label: "✅ Tasdiqlandi" },
  { status: "CANCELLED", label: "✖ Bekor" },
];

/** Status buttons under a request notification (work in the sales group and in private chats). */
export function rfqButtons(requestId: string) {
  return {
    inline_keyboard: [
      RFQ_ACTIONS.slice(0, 2).map((a) => ({ text: a.label, callback_data: `rq:${requestId}:${a.status}` })),
      RFQ_ACTIONS.slice(2).map((a) => ({ text: a.label, callback_data: `rq:${requestId}:${a.status}` })),
      [{ text: "Admin panelda ochish ↗", url: `${siteUrl()}/admin/requests` }],
    ],
  };
}

/** Bot menu rows for staff; web_app buttons only in private chats and only with an https site. */
export function staffMenuRows() {
  const admin = webAppUrl("/tg/admin");
  return [
    ...(admin ? [[{ text: "⚙️ Admin panel", web_app: { url: admin } }]] : []),
    [
      { text: "📊 Hisobot", callback_data: "adm:report" },
      { text: "📥 Yangi so'rovlar", callback_data: "adm:requests" },
    ],
  ];
}

const HELP =
  "<b>Xodim buyruqlari</b>\n" +
  "/admin — admin panelni ochish\n" +
  "/hisobot — bugungi va 7 kunlik hisobot\n" +
  "/sorovlar — yangi so'rovlar (holat tugmalari bilan)\n" +
  "/narx SKU NARX — narxni o'zgartirish, masalan: <code>/narx NL-CBY-AC 2250000</code>\n" +
  "/qoldiq SKU SONI — asosiy ombordagi qoldiqni belgilash, masalan: <code>/qoldiq NL-CBY-AC 12</code>\n" +
  "/id — Telegram ID ingiz";

/** Handles staff commands. Returns true when the message was a staff command (handled or refused). */
export async function handleStaffCommand(chatId: number, from: From, text: string): Promise<boolean> {
  const [cmdRaw, ...args] = text.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, "");
  if (cmd === "/id") {
    await sendMessage(chatId, `Telegram ID: <code>${from.id}</code>\nAdmin → Xodimlar → xodim kartasiga shu raqamni yozing.`, { parse_mode: "HTML" });
    return true;
  }
  if (!["/admin", "/hisobot", "/sorovlar", "/narx", "/qoldiq", "/yordam"].includes(cmd)) return false;

  const staff = await staffFor(from.id);
  if (!staff) {
    await sendMessage(chatId, `Bu buyruq faqat xodimlar uchun. Telegram ID: <code>${from.id}</code> — uni admin panelda xodimga ulang.`, { parse_mode: "HTML" });
    return true;
  }
  switch (cmd) {
    case "/yordam":
      await sendMessage(chatId, HELP, { parse_mode: "HTML" });
      return true;
    case "/admin": {
      const url = webAppUrl("/tg/admin");
      await sendMessage(chatId, url ? "Admin panel Telegram ichida ochiladi:" : `Admin panel: ${siteUrl()}/admin`, url ? { reply_markup: { inline_keyboard: [[{ text: "⚙️ Admin panelni ochish", web_app: { url } }]] } } : {});
      return true;
    }
    case "/hisobot":
      await sendMessage(chatId, await buildReport(), { parse_mode: "HTML", disable_web_page_preview: true });
      return true;
    case "/sorovlar":
      if (!allowed(staff, "orders.read")) return refuse(chatId);
      await sendNewRequests(chatId);
      return true;
    case "/narx":
      if (!allowed(staff, "products.write")) return refuse(chatId);
      await setPrice(chatId, staff, args);
      return true;
    case "/qoldiq":
      if (!allowed(staff, "stock.write")) return refuse(chatId);
      await setStock(chatId, staff, args);
      return true;
  }
  return false;
}

async function refuse(chatId: number) {
  await sendMessage(chatId, "Sizning lavozimingizda bu amalga ruxsat yo'q.");
  return true;
}

async function setPrice(chatId: number, staff: Employee, args: string[]) {
  const [sku, raw] = args;
  const price = parseNumber(raw ?? "");
  if (!sku || price === null || price <= 0 || price > 10_000_000_000) {
    await sendMessage(chatId, "Format: <code>/narx SKU NARX</code>, masalan <code>/narx NL-CBY-AC 2250000</code>", { parse_mode: "HTML" });
    return;
  }
  const product = await prisma.product.findUnique({ where: { sku } });
  if (!product) {
    await sendMessage(chatId, `SKU topilmadi: ${html(sku)}`, { parse_mode: "HTML" });
    return;
  }
  const newPrice = Math.round(price);
  await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { price: newPrice, priceOnRequest: false } }),
    prisma.priceChange.create({ data: { productId: product.id, oldPrice: product.price, newPrice, actor: `${staff.name} (Telegram)` } }),
  ]);
  await audit(staff, "Narx o'zgardi", "Product", product.id, { sku, oldPrice: product.price, newPrice });
  await sendMessage(chatId, `✅ <b>${html(product.name)}</b>\n${money(product.price)} → <b>${money(newPrice)}</b>${product.priceOnRequest ? "\n«Narxi so'rov bo'yicha» o'chirildi." : ""}`, { parse_mode: "HTML" });
}

async function setStock(chatId: number, staff: Employee, args: string[]) {
  const [sku, raw] = args;
  const qty = parseNumber(raw ?? "");
  if (!sku || qty === null || qty < 0 || !Number.isInteger(qty) || qty > 1_000_000) {
    await sendMessage(chatId, "Format: <code>/qoldiq SKU SONI</code>, masalan <code>/qoldiq NL-CBY-AC 12</code>", { parse_mode: "HTML" });
    return;
  }
  const [product, warehouse] = await Promise.all([
    prisma.product.findUnique({ where: { sku } }),
    prisma.warehouse.findFirst({ where: { isDefault: true } }).then((w) => w ?? prisma.warehouse.findFirst()),
  ]);
  if (!product || !warehouse) {
    await sendMessage(chatId, product ? "Ombor sozlanmagan." : `SKU topilmadi: ${html(sku)}`, { parse_mode: "HTML" });
    return;
  }
  const level = await prisma.stockLevel.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } } });
  const delta = qty - (level?.quantity ?? 0);
  if (delta !== 0) {
    await prisma.$transaction((tx) =>
      moveStock(tx, { productId: product.id, warehouseId: warehouse.id, delta, reason: "ADJUSTMENT", note: "Telegram /qoldiq", actor: `${staff.name} (Telegram)`, allowNegative: true })
    );
  }
  await audit(staff, "Qoldiq tuzatildi", "Product", product.id, { sku, warehouse: warehouse.name, from: level?.quantity ?? 0, to: qty });
  await sendMessage(chatId, `✅ <b>${html(product.name)}</b>\n${html(warehouse.name)}: ${level?.quantity ?? 0} → <b>${qty}</b>`, { parse_mode: "HTML" });
}

async function sendNewRequests(chatId: number) {
  const requests = await prisma.rfqRequest.findMany({
    where: { status: "NEW" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
  });
  if (!requests.length) {
    await sendMessage(chatId, "Yangi so'rovlar yo'q 👍");
    return;
  }
  for (const r of requests.reverse()) await sendMessage(chatId, requestText(r), { parse_mode: "HTML", reply_markup: rfqButtons(r.id) });
}

type RequestWithItems = {
  id: string; requestType: string; companyName: string; contactName: string; phone: string; comment: string | null; createdAt: Date; status: RfqStatus;
  items: { quantity: number; product: { name: string; sku: string | null } }[];
};

/** Text of a request card (used for new-request notifications and /sorovlar). */
export function requestText(r: RequestWithItems) {
  const who = [r.companyName, r.contactName].filter((x, i, a) => x && x !== "—" && a.indexOf(x) === i).join(", ");
  const items = r.items.map((i) => `• ${html(i.product.name)}${i.product.sku ? ` (${html(i.product.sku)})` : ""} × ${i.quantity}`).join("\n");
  const time = r.createdAt.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    `<b>${html(r.requestType)}</b> · ${time}\n` +
    `${who ? `${html(who)}\n` : ""}📞 <a href="tel:${r.phone.replace(/[^\d+]/g, "")}">${html(r.phone)}</a>` +
    `${items ? `\n${items}` : ""}${r.comment ? `\n💬 ${html(r.comment.slice(0, 500))}` : ""}\n` +
    `Holat: <b>${RFQ_STATUS[r.status].label}</b>`
  );
}

/** Callback buttons from staff messages ("rq:" and "adm:"). Returns true when handled. */
export async function handleStaffCallback(callback: { id: string; from: From; data?: string; message?: { message_id: number; chat: { id: number } } }): Promise<boolean> {
  const data = callback.data ?? "";
  if (!data.startsWith("rq:") && !data.startsWith("adm:")) return false;
  const staff = await staffFor(callback.from.id);
  if (!staff) {
    await api("answerCallbackQuery", { callback_query_id: callback.id, text: "Faqat xodimlar uchun. Botga /id yozing va ID ni admin panelda ulang.", show_alert: true });
    return true;
  }
  const chatId = callback.message?.chat.id;
  if (data.startsWith("adm:")) {
    await api("answerCallbackQuery", { callback_query_id: callback.id });
    if (!chatId) return true;
    if (data === "adm:report") await sendMessage(chatId, await buildReport(), { parse_mode: "HTML", disable_web_page_preview: true });
    if (data === "adm:requests") {
      if (allowed(staff, "orders.read")) await sendNewRequests(chatId);
      else await refuse(chatId);
    }
    return true;
  }

  const [, requestId, status] = data.split(":") as [string, string, RfqStatus];
  if (!allowed(staff, "orders.write") || !RFQ_ACTIONS.some((a) => a.status === status)) {
    await api("answerCallbackQuery", { callback_query_id: callback.id, text: "Ruxsat yo'q.", show_alert: true });
    return true;
  }
  const request = await prisma.rfqRequest.findUnique({ where: { id: requestId }, include: { items: { include: { product: { select: { name: true, sku: true } } } } } });
  if (!request) {
    await api("answerCallbackQuery", { callback_query_id: callback.id, text: "So'rov topilmadi.", show_alert: true });
    return true;
  }
  await prisma.rfqRequest.update({ where: { id: requestId }, data: { status } });
  await audit(staff, "Ariza holati o'zgardi", "RfqRequest", requestId, { status, via: "telegram" });
  await api("answerCallbackQuery", { callback_query_id: callback.id, text: `${RFQ_STATUS[status].label} ✓` });
  if (chatId && callback.message) {
    const text = `${requestText({ ...request, status })}\n<i>${html(staff.name)} · ${new Date().toLocaleTimeString("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" })}</i>`;
    await api("editMessageText", { chat_id: chatId, message_id: callback.message.message_id, text, parse_mode: "HTML", reply_markup: rfqButtons(requestId) }).catch(() => undefined);
  }
  return true;
}

/** Today's and last-7-days figures plus low-stock items (sent by /hisobot and the evening cron). */
export async function buildReport(): Promise<string> {
  const now = new Date();
  // Start of today in Tashkent (UTC+5).
  const tz = 5 * 60 * 60 * 1000;
  const today = new Date(Math.floor((now.getTime() + tz) / 86400000) * 86400000 - tz);
  const week = new Date(today.getTime() - 6 * 86400000);
  const [reqToday, reqWeek, newOpen, ordersToday, ordersWeek, lowStock] = await Promise.all([
    prisma.rfqRequest.count({ where: { createdAt: { gte: today } } }),
    prisma.rfqRequest.count({ where: { createdAt: { gte: week } } }),
    prisma.rfqRequest.count({ where: { status: "NEW" } }),
    prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } }, _count: true, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: week }, status: { not: "CANCELLED" } }, _count: true, _sum: { total: true } }),
    prisma.$queryRaw<{ sku: string | null; name: string; stock: number; minimumStock: number }[]>`
      SELECT sku, name, stock, "minimumStock" FROM "Product"
      WHERE "isActive" AND "minimumStock" > 0 AND stock <= "minimumStock"
      ORDER BY stock ASC LIMIT 10`,
  ]);
  const date = now.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" });
  const low = lowStock.length
    ? `\n\n<b>⚠️ Kam qoldi (${lowStock.length})</b>\n` + lowStock.map((p) => `• ${html(p.name.slice(0, 50))}${p.sku ? ` (${html(p.sku)})` : ""}: ${p.stock} / min ${p.minimumStock}`).join("\n")
    : "";
  return (
    `<b>📊 STRATEGA hisobot · ${date}</b>\n\n` +
    `<b>Bugun</b>\nSo'rovlar: ${reqToday}\nBuyurtmalar: ${ordersToday._count} · ${money(ordersToday._sum.total ?? 0)}\n\n` +
    `<b>7 kun</b>\nSo'rovlar: ${reqWeek}\nBuyurtmalar: ${ordersWeek._count} · ${money(ordersWeek._sum.total ?? 0)}\n\n` +
    `Javob kutayotgan yangi so'rovlar: <b>${newOpen}</b>` +
    low +
    `\n\n<a href="${siteUrl()}/admin">Admin panel ↗</a>`
  );
}

/** Evening report to the sales chat. */
export async function sendDailyReport() {
  await notifySeller(await buildReport());
}
