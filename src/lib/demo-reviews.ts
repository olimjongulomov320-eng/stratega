import type { AppLocale } from "@/i18n/routing";

const NAMES = [
  "Aziz",
  "Malika",
  "Sardor",
  "Dilnoza",
  "Jasur",
  "Nilufar",
  "Otabek",
  "Kamola",
];

const COMMENTS: Record<AppLocale, string[]> = {
  uz: [
    "Sifatli mahsulot, tavsif bilan mos keladi. Tez yetkazib berishdi.",
    "Narxiga yarasha juda yaxshi. Do'stlarimga ham tavsiya qilaman.",
    "Qadoqlash yaxshi, hech qanday shikast yo'q edi. Rozi qoldim.",
    "Kutganimdan ham yaxshi chiqdi, albatta yana buyurtma beraman.",
    "Yetkazib berish biroz kechikdi, lekin mahsulot sifatli.",
  ],
  ru: [
    "Качественный товар, соответствует описанию. Доставили быстро.",
    "Очень хорошо за свою цену. Рекомендую друзьям.",
    "Упаковка отличная, без повреждений. Остался доволен.",
    "Получилось даже лучше, чем ожидал, обязательно куплю ещё раз.",
    "Доставка была немного задержана, но товар качественный.",
  ],
  en: [
    "Quality product, matches the description. Delivered quickly.",
    "Very good for the price. I recommend it to friends.",
    "Packaging was great, no damage at all. Very satisfied.",
    "Turned out even better than expected, will definitely order again.",
    "Delivery was a bit delayed, but the product is high quality.",
  ],
};

export type DemoReview = {
  name: string;
  rating: number;
  comment: string;
  daysAgo: number;
};

// Har bir mahsulot uchun barqaror (deterministik) sharhlar ro'yxatini hosil qiladi.
export function getDemoReviews(
  productId: string,
  count: number,
  locale: AppLocale
): DemoReview[] {
  let seed = 0;
  for (let i = 0; i < productId.length; i++) {
    seed = (seed * 31 + productId.charCodeAt(i)) >>> 0;
  }

  function next() {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0xffffffff;
  }

  const comments = COMMENTS[locale];
  const reviewCount = Math.min(count, 3);
  return Array.from({ length: reviewCount }, () => ({
    name: NAMES[Math.floor(next() * NAMES.length)],
    rating: 4 + Math.round(next()),
    comment: comments[Math.floor(next() * comments.length)],
    daysAgo: 1 + Math.floor(next() * 60),
  }));
}
