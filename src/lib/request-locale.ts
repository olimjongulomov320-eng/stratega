import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

// API route handler'lar next-intl middleware orqali o'tmaydi (proxy.ts'da
// /api yo'llari alohida ishlanadi), shuning uchun getLocale() ular ichida
// har doim standart tilni qaytaradi. Bu yerda NEXT_LOCALE cookie'sini
// to'g'ridan-to'g'ri o'qiymiz — middleware sahifalarda shu cookie'ni
// o'rnatadi.
export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("NEXT_LOCALE")?.value;
  if (value && routing.locales.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  return routing.defaultLocale;
}
