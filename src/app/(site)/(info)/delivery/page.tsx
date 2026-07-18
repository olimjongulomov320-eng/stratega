import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "Yetkazib berish va kafolat — Stratega",
};

const ZONES = [
  { city: "Toshkent shahri", time: "1–2 kun", price: "Bepul (150 000 so'mdan yuqori)" },
  { city: "Toshkent viloyati", time: "2–3 kun", price: "20 000 so'm" },
  { city: "Boshqa viloyatlar", time: "3–5 kun", price: "35 000 so'm" },
];

export default function DeliveryPage() {
  return (
    <div>
      <InfoPageHeader
        title="Yetkazib berish va kafolat"
        subtitle="Buyurtmangiz qanday va qachon yetib boradi"
      />

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Yetkazib berish muddatlari va narxi
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Hudud</th>
                  <th className="px-4 py-2.5 font-medium">Muddat</th>
                  <th className="px-4 py-2.5 font-medium">Narx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ZONES.map((zone) => (
                  <tr key={zone.city}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {zone.city}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{zone.time}</td>
                    <td className="px-4 py-2.5 text-slate-600">{zone.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Yetkazib berish qanday ishlaydi
          </h2>
          <ol className="flex flex-col gap-3">
            {[
              "Buyurtmangizni tasdiqlaysiz — operatorimiz siz bilan bog'lanadi.",
              "Mahsulot qadoqlanadi va kuryer xizmatiga topshiriladi.",
              "Kuryer belgilangan manzilga yetkazib beradi, siz mahsulotni qabul qilib olasiz.",
              "Naqd yoki karta orqali to'lovni amalga oshirasiz.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {i + 1}
                </span>
                <span className="text-slate-600">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Kafolat
          </h2>
          <p className="text-slate-600">
            Barcha mahsulotlar ishlab chiqaruvchi kafolati bilan sotiladi.
            Kafolat muddati mahsulot turiga qarab 6 oydan 24 oygacha
            bo&apos;lishi mumkin va mahsulot sahifasida ko&apos;rsatiladi.
            Kafolat davrida nosozlik aniqlansa, mahsulot bepul
            ta&apos;mirlanadi yoki almashtiriladi.
          </p>
        </section>
      </div>
    </div>
  );
}
