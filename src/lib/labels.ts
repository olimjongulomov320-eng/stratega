// Uzbek labels + badge tones for admin enums.
type L = Record<string, { label: string; tone: "gray" | "blue" | "green" | "amber" | "red" | "indigo" }>;

export const RFQ_STATUS: L = {
  NEW: { label: "Yangi", tone: "blue" },
  IN_REVIEW: { label: "Ko'rib chiqilmoqda", tone: "amber" },
  QUOTED: { label: "Narx taqdim etildi", tone: "indigo" },
  CONFIRMED: { label: "Tasdiqlandi", tone: "green" },
  CANCELLED: { label: "Bekor qilindi", tone: "gray" },
};

export const QUOTE_STATUS: L = {
  DRAFT: { label: "Qoralama", tone: "gray" },
  SENT: { label: "Yuborildi", tone: "blue" },
  ACCEPTED: { label: "Qabul qilindi", tone: "green" },
  REJECTED: { label: "Rad etildi", tone: "red" },
  EXPIRED: { label: "Muddati o'tdi", tone: "amber" },
};

export const ORDER_STATUS: L = {
  DRAFT: { label: "Qoralama", tone: "gray" },
  CONFIRMED: { label: "Tasdiqlangan (band)", tone: "blue" },
  SHIPPED: { label: "Jo'natilgan", tone: "indigo" },
  COMPLETED: { label: "Yakunlangan", tone: "green" },
  CANCELLED: { label: "Bekor qilingan", tone: "red" },
};

export const PAYMENT_STATUS: L = {
  UNPAID: { label: "To'lanmagan", tone: "red" },
  PARTIAL: { label: "Qisman", tone: "amber" },
  PAID: { label: "To'langan", tone: "green" },
  REFUNDED: { label: "Qaytarilgan", tone: "gray" },
};

export const PAYMENT_RECORD_STATUS: L = {
  PENDING: { label: "Kutilmoqda", tone: "amber" },
  CONFIRMED: { label: "Tasdiqlangan", tone: "green" },
  REFUNDED: { label: "Qaytarilgan", tone: "gray" },
};

export const PAYMENT_METHOD: Record<string, string> = {
  CASH: "Naqd",
  BANK_TRANSFER: "Bank o'tkazmasi",
  CARD: "Karta",
  OTHER: "Boshqa",
};

export const SHIPMENT_STATUS: L = {
  DRAFT: { label: "Qoralama", tone: "gray" },
  READY: { label: "Tayyor", tone: "blue" },
  SHIPPED: { label: "Jo'natilgan", tone: "indigo" },
  DELIVERED: { label: "Yetkazilgan", tone: "green" },
  CANCELLED: { label: "Bekor qilingan", tone: "red" },
};

export const DOC_TYPE: Record<string, string> = {
  RECEIPT: "Kirim",
  ISSUE: "Chiqim",
  TRANSFER: "Ko'chirish",
  WRITE_OFF: "Hisobdan chiqarish",
  INVENTORY: "Inventarizatsiya",
  RETURN: "Qaytarish",
};

export const DOC_STATUS: L = {
  DRAFT: { label: "Qoralama", tone: "gray" },
  POSTED: { label: "O'tkazilgan", tone: "green" },
  CANCELLED: { label: "Bekor qilingan", tone: "red" },
};

export const MOVE_REASON: Record<string, string> = {
  OPENING: "Boshlang'ich qoldiq",
  ADJUSTMENT: "Qo'lda tuzatish",
  CSV_IMPORT: "CSV import",
  RECEIPT: "Kirim",
  ISSUE: "Chiqim",
  RETURN: "Qaytarish",
  TRANSFER_IN: "Ko'chirish (kirim)",
  TRANSFER_OUT: "Ko'chirish (chiqim)",
  WRITE_OFF: "Hisobdan chiqarish",
  INVENTORY: "Inventarizatsiya",
  SHIPMENT: "Jo'natma",
};

export const UNIT_LABEL: Record<string, string> = {
  PIECE: "dona",
  SET: "to'plam",
  KG: "kg",
  METER: "m",
  LITER: "l",
  PALLET: "pallet",
  BOX: "quti",
};
