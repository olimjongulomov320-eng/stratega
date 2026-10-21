import { prisma } from "@/lib/prisma";

// Tizim sozlamalari — kalit-qiymat ko'rinishida Setting jadvalida saqlanadi.
// Muhim holat hech qachon faqat clientda yoki hardcoded holda saqlanmaydi.
// O'qishlar qisqa muddat (TTL) bilan keshlanadi, shuning uchun har bir
// so'rovda DB'ga murojaat qilinmaydi, lekin o'zgarishlar tez tarqaladi.

const CACHE_TTL_MS = 30_000;

export const SETTING_KEYS = {
  ALLOW_NEGATIVE_STOCK: "stock.allowNegative",
  ALLOW_OVER_RESERVE: "stock.allowOverReserve",
  LOW_STOCK_THRESHOLD: "stock.lowStockThreshold",
  FORECAST_LOOKBACK_DAYS: "forecast.lookbackDays",
  OVERSTOCK_MULTIPLIER: "stock.overstockMultiplier",
  PAYMENT_OVERDUE_DAYS: "finance.paymentOverdueDays",
  COMPANY_NAME: "company.name",
  OTP_RESEND_WINDOW_MINUTES: "auth.otpResendWindowMinutes",
  OTP_VERIFY_WINDOW_MINUTES: "auth.otpVerifyWindowMinutes",
  OTP_TTL_MINUTES: "auth.otpTtlMinutes",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.ALLOW_NEGATIVE_STOCK]: "false",
  [SETTING_KEYS.ALLOW_OVER_RESERVE]: "false",
  [SETTING_KEYS.LOW_STOCK_THRESHOLD]: "5",
  [SETTING_KEYS.FORECAST_LOOKBACK_DAYS]: "30",
  [SETTING_KEYS.OVERSTOCK_MULTIPLIER]: "5",
  [SETTING_KEYS.PAYMENT_OVERDUE_DAYS]: "30",
  [SETTING_KEYS.COMPANY_NAME]: "STRATEGA",
  [SETTING_KEYS.OTP_RESEND_WINDOW_MINUTES]: "60",
  [SETTING_KEYS.OTP_VERIFY_WINDOW_MINUTES]: "15",
  [SETTING_KEYS.OTP_TTL_MINUTES]: "5",
};

const cache = new Map<string, { value: string; expiresAt: number }>();

export async function getSetting(key: SettingKey): Promise<string> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const row = await prisma.setting.findUnique({ where: { key } });
  const value = row?.value ?? DEFAULTS[key] ?? "";

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function getBoolSetting(key: SettingKey): Promise<boolean> {
  return (await getSetting(key)) === "true";
}

export async function getIntSetting(key: SettingKey): Promise<number> {
  const raw = Number(await getSetting(key));
  return Number.isFinite(raw) ? raw : Number(DEFAULTS[key] ?? 0);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  cache.delete(key);
}

export function allSettingsSchema(): Array<{
  key: string;
  label: string;
  description: string;
  type: "bool" | "int" | "text";
}> {
  return [
    {
      key: SETTING_KEYS.ALLOW_NEGATIVE_STOCK,
      label: "Manfiy qoldiqka ruxsat",
      description:
        "Yoqilsa, ombor operatsiyalari manfiy qoldiqqa tushishi mumkin (faqat zarur holatlar uchun).",
      type: "bool",
    },
    {
      key: SETTING_KEYS.ALLOW_OVER_RESERVE,
      label: "Ortiqcha zaxiraga ruxsat",
      description:
        "Yoqilsa, buyurtma mavjud qoldiqdan ko'proq miqdorda zaxiralanishi mumkin.",
      type: "bool",
    },
    {
      key: SETTING_KEYS.LOW_STOCK_THRESHOLD,
      label: "Kam qoldiq chegarasi",
      description: "Shu son dan kam bo'lsa mahsulot \"kam qolgan\" hisoblanadi.",
      type: "int",
    },
    {
      key: SETTING_KEYS.FORECAST_LOOKBACK_DAYS,
      label: "Prognoz davri (kun)",
      description: "Sotuv sur'ati hisoblanadigan orqaga nazar davri.",
      type: "int",
    },
    {
      key: SETTING_KEYS.OVERSTOCK_MULTIPLIER,
      label: "Ortiqcha ombor koeffitsienti",
      description:
        "Qoldiq kam qoldiq chegarasidan shu martaba oshsa — ortiqcha ombor.",
      type: "int",
    },
    {
      key: SETTING_KEYS.PAYMENT_OVERDUE_DAYS,
      label: "To'lov kechikish chegarasi (kun)",
      description: "Tasdiqlangan buyurtmada to'lov shu kundan kechsa — kechikkan hisoblanadi.",
      type: "int",
    },
    {
      key: SETTING_KEYS.COMPANY_NAME,
      label: "Kompaniya nomi",
      description: "Hujjatlarda ko'rsatiladigan nom.",
      type: "text",
    },
    {
      key: SETTING_KEYS.OTP_TTL_MINUTES,
      label: "OTP amal qilish muddati (daq.)",
      description: "Tasdiqlash kodi shu daqiqagacha yaroqli.",
      type: "int",
    },
    {
      key: SETTING_KEYS.OTP_RESEND_WINDOW_MINUTES,
      label: "OTP qayta yuborish oynasi (daq.)",
      description:
        "Bir telefon raqamiga shu oyna ichida 3 ta kod so'rovi.",
      type: "int",
    },
    {
      key: SETTING_KEYS.OTP_VERIFY_WINDOW_MINUTES,
      label: "OTP tekshirish oynasi (daq.)",
      description:
        "Bir IP manzilga shu oyna ichida 10 ta kod tekshirish urinishi.",
      type: "int",
    },
  ];
}
