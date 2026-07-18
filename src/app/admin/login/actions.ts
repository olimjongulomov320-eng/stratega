"use server";

import { verifyAdminPassword, createAdminSession } from "@/lib/admin-auth";

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLogin(password: string): Promise<AdminLoginResult> {
  if (!verifyAdminPassword(password)) {
    return { ok: false, error: "Parol noto'g'ri." };
  }

  await createAdminSession();
  return { ok: true };
}
