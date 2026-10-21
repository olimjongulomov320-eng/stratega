"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, normalizePhone, createSession, clearSession } from "@/lib/auth";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getIntSetting, SETTING_KEYS } from "@/lib/settings";

const MAX_VERIFY_ATTEMPTS = 5;
const OTP_RESEND_LIMIT = 3; // oyna ichida qayta yuborish
const OTP_IP_RESEND_LIMIT = 15; // oyna ichida IP bo'yicha
const OTP_VERIFY_LIMIT = 10; // oyna ichida IP bo'yicha

// Eslatma: `rateLimit` hozircha instansiyada (in-memory) hisoblaydi — bitta
// server uchun yetarli. Ko'p instansiyali prod uchun oynani o'zgartirmasdan
// rate-limit backend'ini Redis/Upstash bilan almashtirish kifoya
// (SETTING_KEYS.OTP_* oynalari DB orqali sozlanadi).

export type SendOtpResult =
  | { ok: true; devCode?: string }
  | { ok: false; errorCode: "invalidPhone" }
  | { ok: false; error: string };

export async function sendOtp(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (phone.length < 9) {
    return { ok: false, errorCode: "invalidPhone" };
  }

  // Rate limit: telefon bo'yicha qayta yuborish va IP bo'yicha flood.
  // Oynalar /admin/settings orqali sozlanadi (auth.otp*WindowMinutes).
  const resendWindowMs =
    Math.max(1, await getIntSetting(SETTING_KEYS.OTP_RESEND_WINDOW_MINUTES)) * 60 * 1000;
  const perPhone = rateLimit(`otp-send:${phone}`, OTP_RESEND_LIMIT, resendWindowMs);
  if (!perPhone.ok) {
    return { ok: false, error: "Juda ko'p so'rov. Birozdan so'ng qayta urinib ko'ring." };
  }
  const headerStore = await headers();
  const perIp = rateLimit(`otp-send-ip:${clientIp(headerStore)}`, OTP_IP_RESEND_LIMIT, resendWindowMs);
  if (!perIp.ok) {
    return { ok: false, error: "Juda ko'p so'rov. Birozdan so'ng qayta urinib ko'ring." };
  }

  const ttlMinutes = Math.max(1, await getIntSetting(SETTING_KEYS.OTP_TTL_MINUTES));
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  });

  if (!isSmsConfigured()) {
    // Demo rejimi: SMS ulanmagan, kod javobda qaytariladi.
    return { ok: true, devCode: code };
  }

  const smsResult = await sendSms(
    phone,
    `Stratega tasdiqlash kodi: ${code}`
  );
  if (!smsResult.ok) {
    return { ok: false, error: smsResult.error };
  }

  return { ok: true };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; errorCode: "invalidCode" | "codeExpired" };

export async function verifyOtp(
  rawPhone: string,
  code: string
): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);

  const headerStore = await headers();
  const verifyWindowMs =
    Math.max(1, await getIntSetting(SETTING_KEYS.OTP_VERIFY_WINDOW_MINUTES)) * 60 * 1000;
  const perIp = rateLimit(`otp-verify:${clientIp(headerStore)}`, OTP_VERIFY_LIMIT, verifyWindowMs);
  if (!perIp.ok) {
    return { ok: false, errorCode: "invalidCode" };
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { ok: false, errorCode: "invalidCode" };
  }
  if (otp.expiresAt < new Date()) {
    return { ok: false, errorCode: "codeExpired" };
  }

  // Brute-force himoyasi: noto'g'ri urinishlar hisoblanadi, chegaradan
  // so'ng kod yaroqsiz bo'ladi.
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
    return { ok: false, errorCode: "codeExpired" };
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, errorCode: "invalidCode" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  await createSession(user.id);

  return { ok: true };
}

export async function logout() {
  await clearSession();
}
