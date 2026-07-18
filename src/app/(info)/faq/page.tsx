import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "Ko'p beriladigan savollar — Stratega",
};

const FAQS = [
  {
    q: "Ariza qanday beriladi?",
    a: "Kerakli mahsulotlarni tanlang, \"Korzinaga qo'shish\" tugmasini bosing, so'ng korzinadan \"Kommertsiya taklifini olish\"ni bosib, kompaniya nomi, kontakt shaxs va telefon raqamini kiriting. Menejerimiz 30 daqiqa ichida siz bilan bog'lanadi.",
  },
  {
    q: "Arizamning holatini qanday bilaman?",
    a: "Ariza yuborilgach, menejerimiz telefon orqali bog'lanib, aniq narx va yetkazib berish shartlarini taqdim etadi.",
  },
  {
    q: "To'lov qanday amalga oshiriladi?",
    a: "To'lov usuli har bir bitim bo'yicha alohida kelishiladi — naqd, bank o'tkazmasi yoki doimiy mijozlar uchun 30 kungacha to'lov muddati bilan.",
  },
  {
    q: "Mahsulotni qaytarish mumkinmi?",
    a: "Ha, kafolat shartlariga muvofiq. Batafsil ma'lumot uchun \"Qaytarish shartlari\" bo'limiga qarang.",
  },
  {
    q: "Yetkazib berish qancha vaqt oladi?",
    a: "Toshkent shahri bo'yicha 1-2 kun, viloyatlarga 2-5 kun. Aniq muddat mahsulot va hududga qarab farq qilishi mumkin.",
  },
  {
    q: "Yuridik shaxslar uchun hujjatlar (schyot-faktura) beriladimi?",
    a: "Ha, yuridik shaxslar uchun barcha kerakli hujjatlar (schyot-faktura, shartnoma) taqdim etiladi. Buning uchun buyurtma berishda operatorga aytishingiz kifoya.",
  },
  {
    q: "Mahsulot sifatiga kafolat bormi?",
    a: "Barcha mahsulotlar ishlab chiqaruvchi kafolati bilan sotiladi. Kafolat muddati mahsulot sahifasida ko'rsatiladi.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <InfoPageHeader
        title="Ko'p beriladigan savollar"
        subtitle="Javobni topa olmadingizmi? Kontaktlar bo'limidan biz bilan bog'laning"
      />

      <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-800">
              {item.q}
              <span className="shrink-0 text-slate-400 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
