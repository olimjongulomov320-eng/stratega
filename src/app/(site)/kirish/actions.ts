"use server";

import { prisma } from "@/lib/prisma";
import { generateOtpCode, normalizePhone, createSession, clearSession } from "@/lib/auth";
import { sendSms, isSmsConfigured } from "@/lib/sms";

const OTP_TTL_MINUTES = 5;

export type SendOtpResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string };

export async function sendOtp(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (phone.length < 9) {
    return { ok: false, error: "Telefon raqamini to'g'ri kiriting." };
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

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
  | { ok: false; error: string };

export async function verifyOtp(
  rawPhone: string,
  code: string
): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);

  const otp = await prisma.otpCode.findFirst({
    where: { phone, code, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { ok: false, error: "Kod noto'g'ri." };
  }
  if (otp.expiresAt < new Date()) {
    return { ok: false, error: "Kod muddati tugagan. Qayta so'rang." };
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
