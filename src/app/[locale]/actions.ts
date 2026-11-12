"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, generateOtpCode, normalizePhone, createSession, clearSession, otpCodesMatch, getClientIp } from "@/lib/auth";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { rateLimit } from "@/lib/rate-limit";
import { getDictionary, fmt } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { notifyRfqCreated } from "@/lib/telegram";

function loc(l: string): Locale {
  return isLocale(l) ? l : "uz";
}

async function ipKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

const clip = (s: string, n: number) => s.trim().slice(0, n);

// ───────────── Quick RFQ (home page) ─────────────

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function submitQuickRfq(
  input: { companyName: string; phone: string; requestType: string; description: string },
  locale: string
): Promise<SimpleResult> {
  const t = getDictionary(loc(locale));
  if (!rateLimit(await ipKey("rfq"), 5, 10 * 60 * 1000)) return { ok: false, error: t.quickRfq.errorRate };
  const companyName = clip(input.companyName ?? "", 200);
  const phone = clip(input.phone ?? "", 30);
  if (!companyName || phone.replace(/\D/g, "").length < 9) return { ok: false, error: t.quickRfq.errorRequired };

  const request = await prisma.rfqRequest.create({
    data: {
      companyName,
      contactName: companyName,
      phone,
      requestType: clip(input.requestType ?? "", 200) || t.quickRfq.defaultType,
      comment: clip(input.description ?? "", 3000) || null,
      locale: loc(locale),
    },
  });
  await notifyRfqCreated(request.id);
  return { ok: true };
}

// ───────────── Callback / one-click order ─────────────

/** "Request a call" (no product) or "Buy in 1 click" (one product): only a phone number is required. */
export async function submitQuickOrder(
  input: { name: string; phone: string; productId?: string; quantity?: number },
  locale: string
): Promise<SimpleResult> {
  const t = getDictionary(loc(locale));
  if (!rateLimit(await ipKey("rfq"), 5, 10 * 60 * 1000)) return { ok: false, error: t.quickRfq.errorRate };
  const name = clip(input.name ?? "", 160);
  const phone = clip(input.phone ?? "", 30);
  if (phone.replace(/\D/g, "").length < 9) return { ok: false, error: t.quickOrder.errorPhone };

  const product = input.productId
    ? await prisma.product.findFirst({ where: { id: input.productId, isActive: true }, select: { id: true, price: true, priceOnRequest: true } })
    : null;
  if (input.productId && !product) return { ok: false, error: t.cart.errorGone };

  const user = await getCurrentUser();
  const request = await prisma.rfqRequest.create({
    data: {
      companyName: name || "—",
      contactName: name || "—",
      phone,
      requestType: product ? t.quickOrder.typeOneClick : t.quickOrder.typeCallback,
      locale: loc(locale),
      ...(user && { userId: user.id }),
      ...(product && {
        items: {
          create: [{ productId: product.id, quantity: Math.min(10000, Math.max(1, Math.floor(input.quantity ?? 1))), priceAtQuote: product.priceOnRequest ? 0 : product.price }],
        },
      }),
    },
  });
  await notifyRfqCreated(request.id);
  return { ok: true };
}

// ───────────── Cart RFQ ─────────────

export type RfqResult = { ok: true; requestId: string } | { ok: false; error: string };

export async function submitRfq(
  input: {
    companyName: string;
    contactName: string;
    phone: string;
    requestType: string;
    comment?: string;
    items: { productId: string; quantity: number }[];
  },
  locale: string
): Promise<RfqResult> {
  const t = getDictionary(loc(locale));
  if (!rateLimit(await ipKey("rfq"), 5, 10 * 60 * 1000)) return { ok: false, error: t.quickRfq.errorRate };

  // Private buyers have no company: only the name and phone are required.
  const company = clip(input.companyName ?? "", 200);
  const contactName = clip(input.contactName ?? "", 200);
  const companyName = company || contactName;
  const phone = clip(input.phone ?? "", 30);
  const requestType = clip(input.requestType ?? "", 200) || t.quickRfq.defaultType;
  if (!contactName || phone.replace(/\D/g, "").length < 9) {
    return { ok: false, error: t.cart.errorRequired };
  }
  const items = (input.items ?? []).slice(0, 100);
  if (items.length === 0) return { ok: false, error: t.cart.errorEmpty };

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: { productId: string; quantity: number; priceAtQuote: number }[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) return { ok: false, error: t.cart.errorGone };
    lines.push({ productId: product.id, quantity: Math.min(10000, Math.max(1, Math.floor(item.quantity))), priceAtQuote: product.priceOnRequest ? 0 : product.price });
  }

  const user = await getCurrentUser();
  const request = await prisma.rfqRequest.create({
    data: {
      companyName,
      contactName,
      phone,
      requestType,
      comment: clip(input.comment ?? "", 3000) || null,
      locale: loc(locale),
      items: { create: lines },
      ...(user ? { userId: user.id } : {}),
    },
  });
  await notifyRfqCreated(request.id);
  if (user && !user.companyName && company) {
    await prisma.user.update({ where: { id: user.id }, data: { companyName, contactName } });
  }
  return { ok: true, requestId: request.id };
}

// ───────────── OTP login ─────────────

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_PER_PHONE_PER_HOUR = 5;
const OTP_MAX_PER_IP_PER_HOUR = 10;
const OTP_RETENTION_HOURS = 24;

export type SendOtpResult = { ok: true; devCode?: string } | { ok: false; error: string };

export async function sendOtp(rawPhone: string, locale: string): Promise<SendOtpResult> {
  const t = getDictionary(loc(locale));
  const phone = normalizePhone(rawPhone);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return { ok: false, error: t.auth.errPhone };

  const smsConfigured = isSmsConfigured();
  if (!smsConfigured && process.env.NODE_ENV === "production") return { ok: false, error: t.auth.errSms };

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const ip = await getClientIp();
  const [last, phoneCount, ipCount] = await Promise.all([
    prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.otpCode.count({ where: { phone, createdAt: { gte: hourAgo } } }),
    ip ? prisma.otpCode.count({ where: { ip, createdAt: { gte: hourAgo } } }) : Promise.resolve(0),
  ]);
  if (last) {
    const elapsed = (now - last.createdAt.getTime()) / 1000;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      return { ok: false, error: fmt(t.auth.errWait, { n: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed) }) };
    }
  }
  if (phoneCount >= OTP_MAX_PER_PHONE_PER_HOUR || ipCount >= OTP_MAX_PER_IP_PER_HOUR) {
    return { ok: false, error: t.auth.errTooMany };
  }

  const code = generateOtpCode();
  await prisma.$transaction([
    prisma.otpCode.updateMany({ where: { phone, usedAt: null }, data: { usedAt: new Date(now) } }),
    prisma.otpCode.deleteMany({ where: { createdAt: { lt: new Date(now - OTP_RETENTION_HOURS * 3600 * 1000) } } }),
    prisma.otpCode.create({ data: { phone, code, ip, expiresAt: new Date(now + OTP_TTL_MINUTES * 60 * 1000) } }),
  ]);

  if (!smsConfigured) return { ok: true, devCode: code }; // development only
  const sms = await sendSms(phone, fmt(t.auth.smsText, { code }));
  return sms.ok ? { ok: true } : { ok: false, error: t.auth.errSms };
}

export async function verifyOtp(rawPhone: string, rawCode: string, locale: string): Promise<SimpleResult> {
  const t = getDictionary(loc(locale));
  const phone = normalizePhone(rawPhone);
  const code = rawCode.trim();

  const otp = await prisma.otpCode.findFirst({ where: { phone, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) return { ok: false, error: t.auth.errWrong };
  if (otp.expiresAt < new Date()) return { ok: false, error: t.auth.errExpired };

  const { count } = await prisma.otpCode.updateMany({
    where: { id: otp.id, usedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (count === 0) return { ok: false, error: t.auth.errAttempts };

  if (!otpCodesMatch(code, otp.code)) {
    const left = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    return { ok: false, error: left > 0 ? fmt(t.auth.errLeft, { n: left }) : t.auth.errAttempts };
  }
  const consumed = await prisma.otpCode.updateMany({ where: { id: otp.id, usedAt: null }, data: { usedAt: new Date() } });
  if (consumed.count === 0) return { ok: false, error: t.auth.errUsed };

  const user = await prisma.user.upsert({ where: { phone }, update: {}, create: { phone } });
  await createSession(user.id);
  return { ok: true };
}

export async function logout() {
  await clearSession();
}
