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

const COMMENTS = [
  "Sifatli mahsulot, tavsif bilan mos keladi. Tez yetkazib berishdi.",
  "Narxiga yarasha juda yaxshi. Do'stlarimga ham tavsiya qilaman.",
  "Qadoqlash yaxshi, hech qanday shikast yo'q edi. Rozi qoldim.",
  "Kutganimdan ham yaxshi chiqdi, albatta yana buyurtma beraman.",
  "Yetkazib berish biroz kechikdi, lekin mahsulot sifatli.",
];

export type DemoReview = {
  name: string;
  rating: number;
  comment: string;
  daysAgo: number;
};

// Har bir mahsulot uchun barqaror (deterministik) sharhlar ro'yxatini hosil qiladi.
export function getDemoReviews(productId: string, count: number): DemoReview[] {
  let seed = 0;
  for (let i = 0; i < productId.length; i++) {
    seed = (seed * 31 + productId.charCodeAt(i)) >>> 0;
  }

  function next() {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0xffffffff;
  }

  const reviewCount = Math.min(count, 3);
  return Array.from({ length: reviewCount }, () => ({
    name: NAMES[Math.floor(next() * NAMES.length)],
    rating: 4 + Math.round(next()),
    comment: COMMENTS[Math.floor(next() * COMMENTS.length)],
    daysAgo: 1 + Math.floor(next() * 60),
  }));
}
