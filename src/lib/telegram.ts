import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { nextNumber } from "@/lib/admin";
import { normalizePhone } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/storage";
import { api, sendMessage, notifySeller, token, siteUrl, html, webAppUrl, telegramApiBase, itemLines } from "@/lib/telegram-api";
import { handleStaffCommand, handleStaffCallback, staffFor, staffMenuRows, rfqButtons, requestText } from "@/lib/telegram-admin";

type Locale = "uz" | "ru" | "en";
type CartLine = { productId: string; quantity: number };
type Session = {
  locale: Locale;
  stage?: "search" | "name" | "phone" | "confirm";
  cart: CartLine[];
  name?: string;
  phone?: string;
};
type TelegramUser = { id: number; username?: string; first_name?: string; language_code?: string };
type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: TelegramUser;
  text?: string;
  contact?: { phone_number: string; user_id?: number };
};
type TelegramCallback = { id: string; from: TelegramUser; data?: string; message?: TelegramMessage };
export type TelegramUpdatePayload = { update_id: number; message?: TelegramMessage; callback_query?: TelegramCallback };

/** Price in the customer's language: "so'm" / "сум" / "UZS"; staff messages keep Uzbek. */
const money = (n: number, locale: Locale = "uz") =>
  `${new Intl.NumberFormat("uz-UZ").format(n)} ${locale === "ru" ? "сум" : locale === "en" ? "UZS" : "so'm"}`;
const tr = (locale: Locale, uz: string, ru: string, en: string) => locale === "ru" ? ru : locale === "en" ? en : uz;
/** Unconfirmed ("price on request") products count as 0 until a manager quotes them. */
const linePrice = (p: { price: number; priceOnRequest: boolean }) => (p.priceOnRequest ? 0 : p.price);
const priceText = (p: { price: number; priceOnRequest: boolean }, locale: Locale) =>
  p.priceOnRequest ? tr(locale, "Narxi so'rov bo'yicha", "Цена по запросу", "Price on request") : money(p.price, locale);

function localeFor(user?: TelegramUser): Locale {
  const lang = user?.language_code?.toLowerCase() ?? "uz";
  return lang.startsWith("ru") ? "ru" : lang.startsWith("en") ? "en" : "uz";
}



async function sendLocalPhoto(chatId: number, imageUrl: string, caption: string, replyMarkup: Record<string, unknown>) {
  const filename = path.basename(imageUrl.slice("/uploads/".length));
  if (!filename || filename === "." || filename === "..") throw new Error("Invalid local product photo path.");
  const extension = path.extname(filename).toLowerCase();
  const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : extension === ".avif" ? "image/avif" : "image/jpeg";
  const bytes = await readFile(path.join(UPLOAD_DIR, filename));
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Product photo is too large for Telegram.");
  const body = new FormData();
  body.set("chat_id", String(chatId));
  body.set("photo", new Blob([new Uint8Array(bytes)], { type: mime }), filename);
  body.set("caption", caption.slice(0, 1024));
  body.set("parse_mode", "HTML");
  body.set("reply_markup", JSON.stringify(replyMarkup));
  const botToken = token();
  if (!botToken) throw new Error("Telegram bot is not configured.");
  const response = await fetch(`${telegramApiBase()}/bot${botToken}/sendPhoto`, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(12_000) });
  const result = await response.json() as { ok?: boolean; description?: string };
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram returned ${response.status}.`);
}

async function loadSession(chatId: string, user?: TelegramUser): Promise<Session> {
  const row = await prisma.telegramSession.findUnique({ where: { chatId } });
  if (row) {
    const parsed = row.state as unknown as Session;
    return { ...parsed, locale: parsed.locale ?? localeFor(user), cart: Array.isArray(parsed.cart) ? parsed.cart : [] };
  }
  return { locale: localeFor(user), cart: [] };
}

async function saveSession(chatId: string, state: Session) {
  await prisma.telegramSession.upsert({
    where: { chatId },
    create: { chatId, state: state as unknown as Prisma.InputJsonValue },
    update: { state: state as unknown as Prisma.InputJsonValue },
  });
}

async function showHome(chatId: number, session: Session, name?: string, telegramUserId?: number) {
  const shop = webAppUrl("/tg/shop");
  const staff = telegramUserId ? await staffFor(telegramUserId) : null;
  await sendMessage(chatId,
    tr(session.locale, `Assalomu alaykum${name ? `, ${name}` : ""}! Stratega katalogidan mahsulot tanlang yoki qidiruvdan foydalaning.`,
      `Здравствуйте${name ? `, ${name}` : ""}! Выберите товар в каталоге Stratega или воспользуйтесь поиском.`,
      `Hello${name ? `, ${name}` : ""}! Browse the Stratega catalog or search for a product.`),
    { reply_markup: { inline_keyboard: [
      ...(shop ? [[{ text: tr(session.locale, "🛒 Do'konni ochish", "🛒 Открыть магазин", "🛒 Open the shop"), web_app: { url: shop } }]] : []),
      [{ text: tr(session.locale, "🗂 Katalog", "🗂 Каталог", "🗂 Browse catalog"), callback_data: "catalog:0" }],
      [{ text: tr(session.locale, "🔎 Qidirish", "🔎 Поиск", "🔎 Search"), callback_data: "search" }, { text: tr(session.locale, "🧺 Savat", "🧺 Корзина", "🧺 Cart"), callback_data: "cart" }],
      ...(staff ? staffMenuRows() : []),
    ] } });
}

async function showCategories(chatId: number, session: Session, page = 0) {
  const take = 12;
  const categories = await prisma.category.findMany({
    where: { isActive: true, products: { some: { isActive: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    skip: page * take,
    take: take + 1,
  });
  const hasNext = categories.length > take;
  const shown = categories.slice(0, take);
  const keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < shown.length; i += 2) {
    keyboard.push(shown.slice(i, i + 2).map((c) => ({
      text: (session.locale === "ru" ? c.nameRu : session.locale === "en" ? c.nameEn : c.name) || c.name,
      callback_data: `category:${c.id}:0`,
    })));
  }
  const nav = [];
  if (page > 0) nav.push({ text: "‹", callback_data: `catalog:${page - 1}` });
  if (hasNext) nav.push({ text: "›", callback_data: `catalog:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: tr(session.locale, "🏠 Bosh menyu", "🏠 Главное меню", "🏠 Main menu"), callback_data: "home" }]);
  await sendMessage(chatId, tr(session.locale, "Kategoriyani tanlang:", "Выберите категорию:", "Choose a category:"), { reply_markup: { inline_keyboard: keyboard } });
}

async function showProducts(chatId: number, session: Session, categoryId: string, page = 0) {
  const take = 8;
  const products = await prisma.product.findMany({
    where: { isActive: true, categoryId },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    skip: page * take,
    take: take + 1,
    select: { id: true, name: true, nameRu: true, nameEn: true, price: true, priceOnRequest: true, stock: true },
  });
  const hasNext = products.length > take;
  const keyboard = products.slice(0, take).map((p) => {
    const name = (session.locale === "ru" ? p.nameRu : session.locale === "en" ? p.nameEn : p.name) || p.name;
    const label = `${name.slice(0, 40)} · ${priceText(p, session.locale)}`;
    return [{ text: label.slice(0, 62), callback_data: `product:${p.id}` }];
  });
  const nav = [];
  if (page > 0) nav.push({ text: "‹", callback_data: `category:${categoryId}:${page - 1}` });
  if (hasNext) nav.push({ text: "›", callback_data: `category:${categoryId}:${page + 1}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: tr(session.locale, "🛒 Savat", "🛒 Корзина", "🛒 Cart"), callback_data: "cart" }, { text: tr(session.locale, "← Kategoriyalar", "← Категории", "← Categories"), callback_data: "catalog:0" }]);
  await sendMessage(chatId, tr(session.locale, "Mahsulotni tanlang:", "Выберите товар:", "Choose a product:"), { reply_markup: { inline_keyboard: keyboard } });
}

async function showProduct(chatId: number, session: Session, productId: string) {
  const p = await prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true, slug: true, name: true, nameRu: true, nameEn: true, description: true, descriptionRu: true, descriptionEn: true, brand: true, sku: true, price: true, priceOnRequest: true, stock: true, imageUrl: true } });
  if (!p) return sendMessage(chatId, tr(session.locale, "Mahsulot topilmadi.", "Товар не найден.", "Product not found."));
  const name = (session.locale === "ru" ? p.nameRu : session.locale === "en" ? p.nameEn : p.name) || p.name;
  const description = (session.locale === "ru" ? p.descriptionRu : session.locale === "en" ? p.descriptionEn : p.description) || "";
  const text = `<b>${html(name)}</b>\n${p.sku ? `${tr(session.locale, "Artikul", "Артикул", "SKU")}: ${html(p.sku)}\n` : ""}${p.brand ? `${tr(session.locale, "Brend", "Бренд", "Brand")}: ${html(p.brand)}\n` : ""}<b>${priceText(p, session.locale)}</b>\n${tr(session.locale, "Omborda", "На складе", "In stock")}: ${p.stock}\n\n${html(description.slice(0, 1800))}`;
  const reply_markup = { inline_keyboard: [
    [{ text: tr(session.locale, "➕ Savatga qo'shish", "➕ Добавить в корзину", "➕ Add to cart"), callback_data: `add:${p.id}` }],
    [{ text: tr(session.locale, "🛒 Savatni ko'rish", "🛒 Открыть корзину", "🛒 View cart"), callback_data: "cart" }, { text: tr(session.locale, "← Katalog", "← Каталог", "← Catalog"), callback_data: "catalog:0" }],
    [{ text: tr(session.locale, "Saytda ochish", "Открыть на сайте", "Open on website"), url: `${siteUrl()}/product/${p.slug}` }],
  ] };
  const image = p.imageUrl?.startsWith("https://") ? p.imageUrl : null;
  if (image) {
    try { await api("sendPhoto", { chat_id: chatId, photo: image, caption: text.slice(0, 1024), parse_mode: "HTML", reply_markup }); return; }
    catch { /* Some development/local images are not reachable from Telegram; retain the product details. */ }
  }
  if (p.imageUrl?.startsWith("/uploads/")) {
    try { await sendLocalPhoto(chatId, p.imageUrl, text, reply_markup); return; }
    catch { /* The photo is optional; keep product browsing available if local storage is unavailable. */ }
  }
  await sendMessage(chatId, text, { parse_mode: "HTML", reply_markup });
}

async function showCart(chatId: number, session: Session) {
  const ids = session.cart.map((l) => l.productId);
  const products = ids.length ? await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true, name: true, nameRu: true, nameEn: true, price: true, priceOnRequest: true } }) : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const valid = session.cart.filter((l) => byId.has(l.productId));
  session.cart = valid;
  await saveSession(String(chatId), session);
  if (!valid.length) return sendMessage(chatId, tr(session.locale, "Savatingiz bo'sh.", "Корзина пуста.", "Your cart is empty."), { reply_markup: { inline_keyboard: [[{ text: tr(session.locale, "Katalogni ochish", "Открыть каталог", "Open catalog"), callback_data: "catalog:0" }]] } });
  let total = 0;
  const lines = valid.map((line) => {
    const p = byId.get(line.productId)!;
    total += linePrice(p) * line.quantity;
    const name = (session.locale === "ru" ? p.nameRu : session.locale === "en" ? p.nameEn : p.name) || p.name;
    return `• ${html(name)} × ${line.quantity} — ${p.priceOnRequest ? priceText(p, session.locale) : money(p.price * line.quantity, session.locale)}`;
  });
  const shortName = (id: string) => { const p = byId.get(id)!; return ((session.locale === "ru" ? p.nameRu : session.locale === "en" ? p.nameEn : p.name) || p.name).slice(0, 24); };
  const keyboard: { text: string; callback_data: string }[][] = valid.map((l) => [{ text: `− ${shortName(l.productId)}`, callback_data: `remove:${l.productId}` }, { text: `+ ${shortName(l.productId)}`, callback_data: `add:${l.productId}` }]);
  keyboard.push([{ text: tr(session.locale, "✅ Buyurtma berish", "✅ Оформить заказ", "✅ Place order"), callback_data: "checkout" }]);
  keyboard.push([{ text: tr(session.locale, "Katalogni davom ettirish", "Продолжить покупки", "Continue shopping"), callback_data: "catalog:0" }]);
  await sendMessage(chatId, `<b>${tr(session.locale, "Savat", "Корзина", "Your cart")}</b>\n${lines.join("\n")}\n\n<b>${tr(session.locale, "Jami", "Итого", "Total")}: ${money(total, session.locale)}</b>`, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}


export async function notifyRfqCreated(requestId: string) {
  try {
    const request = await prisma.rfqRequest.findUnique({ where: { id: requestId }, include: { items: { include: { product: { select: { name: true, sku: true } } } } } });
    if (!request) return;
    await notifySeller(`🆕 <b>Yangi so'rov</b>\n${requestText(request)}`, { reply_markup: rfqButtons(request.id) });
  } catch (error) { console.error("Could not prepare Telegram RFQ notification", error instanceof Error ? error.message : "unknown error"); }
}

export async function notifyOrderCreated(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: { include: { product: { select: { name: true, sku: true } } } } } });
    if (!order) return;
    const items = itemLines(order.lines.map((i) => `• ${html(i.product.name)}${i.product.sku ? ` (${html(i.product.sku)})` : ""} × ${i.quantity}`));
    await notifySeller(`<b>Yangi buyurtma ${html(order.number)}</b>\n${items}\n<b>Jami: ${money(order.total)}</b>\n<a href="${siteUrl()}/admin/orders/${order.id}">Admin panelda ochish</a>`);
  } catch (error) { console.error("Could not prepare Telegram order notification", error instanceof Error ? error.message : "unknown error"); }
}

async function createBotOrder(chatId: number, from: TelegramUser, session: Session) {
  const lines = session.cart.filter((line) => line.quantity > 0 && line.quantity <= 1000);
  if (!lines.length || !session.name || !session.phone) throw new Error("Missing checkout details.");
  const warehouse = (await prisma.warehouse.findFirst({ where: { isActive: true, isDefault: true } })) ?? (await prisma.warehouse.findFirst({ where: { isActive: true } }));
  if (!warehouse) throw new Error("No active warehouse is configured.");
  const products = await prisma.product.findMany({ where: { id: { in: lines.map((l) => l.productId) }, isActive: true }, include: { stockLevels: { where: { warehouseId: warehouse.id } } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const validLines = lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error("One of the products is no longer available.");
    const level = product.stockLevels[0];
    const available = Math.max(0, (level?.quantity ?? 0) - (level?.reserved ?? 0));
    if (product.sourcing === "OWN_STOCK" && line.quantity > available) throw new Error(`${product.name}: only ${available} available.`);
    return { product, quantity: line.quantity };
  });
  const total = validLines.reduce((sum, line) => sum + linePrice(line.product) * line.quantity, 0);
  const phone = normalizePhone(session.phone);
  const customerName = session.name.trim().slice(0, 160);
  const username = from.username ? `@${from.username}` : `Telegram ID ${from.id}`;
  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findFirst({ where: { phone } });
    const customer = existing ?? await tx.customer.create({ data: { companyName: customerName, contactName: customerName, phone, note: `Telegram: ${username}` } });
    return tx.order.create({
      data: {
        number: await nextNumber("ORD", tx),
        customerId: customer.id,
        warehouseId: warehouse.id,
        total,
        note: `Telegram bot order (${username}; chat ${chatId})`,
        createdBy: "Telegram bot",
        lines: { create: validLines.map(({ product, quantity }) => ({ productId: product.id, quantity, price: linePrice(product), costPrice: product.costPrice })) },
      },
      select: { id: true, number: true, total: true },
    });
  });
  await notifyOrderCreated(order.id);
  session.cart = [];
  session.stage = undefined;
  session.name = undefined;
  session.phone = undefined;
  await saveSession(String(chatId), session);
  await sendMessage(chatId, tr(session.locale, `Buyurtmangiz qabul qilindi: <b>${html(order.number)}</b>. Jami: <b>${money(order.total, "uz")}</b>. Menejerimiz siz bilan bog'lanadi.`, `Ваш заказ принят: <b>${html(order.number)}</b>. Итого: <b>${money(order.total, "ru")}</b>. Наш менеджер свяжется с вами.`, `Your order <b>${html(order.number)}</b> has been received. Total: <b>${money(order.total, "en")}</b>. Our team will contact you.`), { parse_mode: "HTML", reply_markup: { remove_keyboard: true, inline_keyboard: [[{ text: tr(session.locale, "Katalogga qaytish", "Вернуться в каталог", "Back to catalog"), callback_data: "catalog:0" }]] } });
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;
  if (message.text?.trim().split(/\s+/)[0] === "/chatid") {
    return sendMessage(chatId, `Chat ID: <code>${chatId}</code>`, { parse_mode: "HTML" });
  }
  // Staff commands (/admin, /hisobot, /narx, /qoldiq, /sorovlar, /id) work in private chats and in the sales group.
  if (message.from && message.text?.startsWith("/") && await handleStaffCommand(chatId, message.from, message.text)) return;
  if (message.chat.type !== "private" || !message.from) {
    return sendMessage(chatId, "Buyurtma berish uchun bot bilan shaxsiy chatda yozishing.");
  }
  const key = String(chatId);
  const session = await loadSession(key, message.from);
  const text = message.text?.trim() ?? "";
  if (text.startsWith("/start") || text === "/menu") {
    session.stage = undefined;
    await saveSession(key, session);
    return showHome(chatId, session, message.from.first_name, message.from.id);
  }
  if (text === "/catalog" || text === "/products") return showCategories(chatId, session);
  if (text === "/cart") return showCart(chatId, session);
  // Typed text outside checkout is treated as a search, so customers don't need to press "Search" first.
  if (text && !text.startsWith("/") && (session.stage === "search" || !session.stage)) {
    session.stage = undefined;
    await saveSession(key, session);
    const products = await prisma.product.findMany({
      where: { isActive: true, OR: [ { name: { contains: text.slice(0, 80), mode: "insensitive" } }, { nameRu: { contains: text.slice(0, 80), mode: "insensitive" } }, { sku: { contains: text.slice(0, 80), mode: "insensitive" } }, { brand: { contains: text.slice(0, 80), mode: "insensitive" } } ] },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }], take: 12,
      select: { id: true, name: true, nameRu: true, nameEn: true, price: true, priceOnRequest: true },
    });
    if (!products.length) return sendMessage(chatId, tr(session.locale, "Hech narsa topilmadi. Boshqa so'z bilan qidiring.", "Ничего не найдено. Попробуйте другой запрос.", "No products found. Try a different search."));
    return sendMessage(chatId, tr(session.locale, "Natijani tanlang:", "Выберите результат:", "Choose a result:"), { reply_markup: { inline_keyboard: products.map((p) => [{ text: `${((session.locale === "ru" ? p.nameRu : session.locale === "en" ? p.nameEn : p.name) || p.name).slice(0, 40)} · ${priceText(p, session.locale)}`.slice(0, 62), callback_data: `product:${p.id}` }]) } });
  }
  if (session.stage === "name" && text) {
    session.name = text.slice(0, 160);
    session.stage = "phone";
    await saveSession(key, session);
    return sendMessage(chatId, tr(session.locale, "Telefon raqamingizni yuboring yoki quyidagi tugma orqali ulashing:", "Отправьте номер телефона или поделитесь им кнопкой ниже:", "Send your phone number or share it with the button below:"), { reply_markup: { keyboard: [[{ text: tr(session.locale, "📱 Telefonimni ulashish", "📱 Поделиться телефоном", "📱 Share my phone"), request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
  }
  if (session.stage === "phone" && (message.contact || text)) {
    if (message.contact?.user_id && message.contact.user_id !== message.from.id) return sendMessage(chatId, tr(session.locale, "Iltimos, o'zingizning telefon raqamingizni ulashing.", "Пожалуйста, поделитесь своим номером телефона.", "Please share your own phone number."));
    const phone = normalizePhone(message.contact?.phone_number ?? text);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) return sendMessage(chatId, tr(session.locale, "Telefon raqamini to'g'ri kiriting.", "Введите корректный номер телефона.", "Enter a valid phone number."));
    session.phone = phone;
    session.stage = "confirm";
    await saveSession(key, session);
    return sendMessage(chatId, tr(session.locale, `Buyurtmani tasdiqlaysizmi? Ism: <b>${html(session.name ?? "")}</b>. Telefon: <b>${html(phone)}</b>.`, `Подтвердить заказ? Имя: <b>${html(session.name ?? "")}</b>. Телефон: <b>${html(phone)}</b>.`, `Confirm this order? Name: <b>${html(session.name ?? "")}</b>. Phone: <b>${html(phone)}</b>.`), { parse_mode: "HTML", reply_markup: { remove_keyboard: true, inline_keyboard: [[{ text: tr(session.locale, "✅ Tasdiqlash", "✅ Подтвердить", "✅ Confirm"), callback_data: "confirm" }, { text: tr(session.locale, "Bekor qilish", "Отмена", "Cancel"), callback_data: "cancel" }]] } });
  }
  if (session.stage === "confirm" && text) return sendMessage(chatId, tr(session.locale, "Buyurtmani tugatish uchun Tasdiqlash tugmasini bosing.", "Нажмите «Подтвердить», чтобы завершить заказ.", "Tap Confirm to finish your order."));
  return showHome(chatId, session, message.from.first_name, message.from.id);
}

async function handleCallback(callback: TelegramCallback) {
  if (await handleStaffCallback(callback)) return;
  const chatId = callback.message?.chat.id;
  if (!chatId) return;
  await api("answerCallbackQuery", { callback_query_id: callback.id });
  const key = String(chatId);
  const session = await loadSession(key, callback.from);
  const [action, first = "", second = "0"] = (callback.data ?? "").split(":");
  switch (action) {
    case "home": return showHome(chatId, session, callback.from.first_name, callback.from.id);
    case "catalog": return showCategories(chatId, session, Math.max(0, Number(first) || 0));
    case "category": return showProducts(chatId, session, first, Math.max(0, Number(second) || 0));
    case "product": return showProduct(chatId, session, first);
    case "search":
      session.stage = "search";
      await saveSession(key, session);
      return sendMessage(chatId, tr(session.locale, "Mahsulot nomi, artikul yoki brendini yozing:", "Напишите название товара, артикул или бренд:", "Send a product name, SKU, or brand:"));
    case "add": {
      const p = await prisma.product.findFirst({ where: { id: first, isActive: true }, select: { id: true } });
      if (!p) return sendMessage(chatId, tr(session.locale, "Mahsulot endi mavjud emas.", "Товар больше недоступен.", "This product is no longer available."));
      const line = session.cart.find((l) => l.productId === p.id);
      if (line) line.quantity = Math.min(1000, line.quantity + 1); else session.cart.push({ productId: p.id, quantity: 1 });
      await saveSession(key, session);
      return sendMessage(chatId, tr(session.locale, "Savatga qo'shildi.", "Добавлено в корзину.", "Added to your cart."), { reply_markup: { inline_keyboard: [[{ text: tr(session.locale, "Savatni ochish", "Открыть корзину", "View cart"), callback_data: "cart" }, { text: tr(session.locale, "Katalog", "Каталог", "Catalog"), callback_data: "catalog:0" }]] } });
    }
    case "remove": {
      const line = session.cart.find((l) => l.productId === first);
      if (line) { line.quantity -= 1; if (line.quantity <= 0) session.cart = session.cart.filter((l) => l.productId !== first); }
      await saveSession(key, session);
      return showCart(chatId, session);
    }
    case "cart": return showCart(chatId, session);
    case "checkout":
      if (!session.cart.length) return showCart(chatId, session);
      session.stage = "name";
      await saveSession(key, session);
      return sendMessage(chatId, tr(session.locale, "Buyurtma uchun ismingizni kiriting:", "Введите ваше имя для заказа:", "Enter your name for the order:"));
    case "confirm":
      if (session.stage !== "confirm") return sendMessage(chatId, tr(session.locale, "Avval savatdan buyurtma berishni boshlang.", "Сначала начните оформление заказа из корзины.", "Start checkout from your cart first."));
      try { return await createBotOrder(chatId, callback.from, session); }
      catch (error) { return sendMessage(chatId, tr(session.locale, `Buyurtma yuborilmadi: ${error instanceof Error ? error.message : "xatolik"}. Savat saqlanib qoldi.`, `Заказ не отправлен: ${error instanceof Error ? error.message : "ошибка"}. Корзина сохранена.`, `Order not submitted: ${error instanceof Error ? error.message : "error"}. Your cart was saved.`)); }
    case "cancel":
      session.stage = undefined; session.name = undefined; session.phone = undefined;
      await saveSession(key, session);
      return sendMessage(chatId, tr(session.locale, "Buyurtma bekor qilindi. Savatingiz saqlanib qoldi.", "Оформление отменено. Корзина сохранена.", "Checkout cancelled. Your cart is still saved."), { reply_markup: { inline_keyboard: [[{ text: tr(session.locale, "Savat", "Корзина", "Cart"), callback_data: "cart" }]] } });
    default: return showHome(chatId, session, callback.from.first_name, callback.from.id);
  }
}

export async function processTelegramUpdate(update: TelegramUpdatePayload) {
  try {
    await prisma.telegramUpdate.create({ data: { updateId: update.update_id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleMessage(update.message);
  } catch (error) {
    await prisma.telegramUpdate.deleteMany({ where: { updateId: update.update_id } }).catch(() => undefined);
    throw error;
  }
}

