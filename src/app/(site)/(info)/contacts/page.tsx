import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "Kontaktlar — Stratega",
};

export default function ContactsPage() {
  return (
    <div>
      <InfoPageHeader title="Kontaktlar" />

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Aloqa ma&apos;lumotlari
          </h2>
          <ul className="flex flex-col gap-2.5 text-slate-600">
            <li>
              <span className="text-slate-400">Telefon: </span>
              <a href="tel:+998993011170" className="text-indigo-600 hover:underline">
                +998 99 301 11 70
              </a>
            </li>
            <li>
              <span className="text-slate-400">Email: </span>
              <a href="mailto:info@stratega.uz" className="text-indigo-600 hover:underline">
                info@stratega.uz
              </a>
            </li>
            <li>
              <span className="text-slate-400">Manzil: </span>
              Toshkent sh., O&apos;zbekiston
            </li>
            <li>
              <span className="text-slate-400">Ish vaqti: </span>
              Dushanba–Shanba, 09:00–21:00
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Rekvizitlar
          </h2>
          <dl className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">Tashkilot nomi</dt>
              <dd className="text-right font-medium text-slate-800">
                &quot;Stratega Trade&quot; MChJ
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">STIR</dt>
              <dd className="text-right font-medium text-slate-800">
                123456789
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-400">Hisob raqami</dt>
              <dd className="text-right font-medium text-slate-800">
                2020 8000 XXXX XXXX
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Yuridik manzil</dt>
              <dd className="text-right font-medium text-slate-800">
                Toshkent sh., O&apos;zbekiston
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
        Yuridik shaxslar uchun shartnoma va hisob-fakturalar operator orqali
        rasmiylashtiriladi — buyurtma berishda yoki yuqoridagi telefon
        raqami orqali murojaat qiling.
      </p>
    </div>
  );
}
