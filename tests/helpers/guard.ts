// DB'ga tegadigan testlar uchun himoya.
//
// Testlar REAL (production) bazada ishlaydi. Tasodifiy ravishda ishga
// tushsa, admin panelda `__test__` yozuvlar paydo bo'ladi (shuning uchun
// sweep.ts mavjud). Lekin yana ham xavfsizroq: DB testlari ataylab
// yoqilishi kerak.
//
//   npm test        → faqat sof logika testlari (DB'ga tegmaydi)
//   npm run test:db → DB testlari (RUN_DB_TESTS=1 bilan)

export const dbTestsEnabled = process.env.RUN_DB_TESTS === "1";

if (!dbTestsEnabled) {
  console.log(
    "[guard] DB testlari o'chirilgan (RUN_DB_TESTS=1 kerak). " +
      "Bazani tegmaslik uchun `npm test` ishlating, to'liq test uchun `npm run test:db`."
  );
}
