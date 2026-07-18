import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "Kompaniya haqida — Stratega",
};

export default function AboutPage() {
  return (
    <div>
      <InfoPageHeader
        title="Kompaniya haqida"
        subtitle="Stratega — qurilish va sanoat texnikasi bo'yicha ishonchli yetkazib beruvchi"
      />

      <div className="flex flex-col gap-6 text-slate-700">
        <p>
          Stratega — qurilish texnikasi, gidravlik uskunalar, klining va
          bog&apos; texnikasini bitta manzilda jamlagan onlayn savdo
          maydonchasi. Maqsadimiz — quruvchilar, ustaxonalar va uy
          xo&apos;jaliklariga sifatli uskunalarni qulay narxlarda, tez va
          ishonchli tarzda yetkazib berish.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">30+</p>
            <p className="mt-1 text-sm text-slate-500">Uskuna turlari</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">4</p>
            <p className="mt-1 text-sm text-slate-500">Kategoriya</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">4.5+</p>
            <p className="mt-1 text-sm text-slate-500">O&apos;rtacha reyting</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Bizning tamoyillarimiz
          </h2>
          <ul className="flex flex-col gap-2 text-slate-600">
            <li>
              <b className="text-slate-800">Shaffoflik</b> — narxlar va
              mahsulot ma&apos;lumotlari to&apos;liq va aniq ko&apos;rsatiladi.
            </li>
            <li>
              <b className="text-slate-800">Tezkorlik</b> — buyurtmalar
              qisqa muddatda qayta ishlanadi va yetkaziladi.
            </li>
            <li>
              <b className="text-slate-800">Qulaylik</b> — qidiruv, filtr va
              solishtirish vositalari xaridni osonlashtiradi.
            </li>
            <li>
              <b className="text-slate-800">Qo&apos;llab-quvvatlash</b> —
              savollaringiz bo&apos;lsa, operatorlarimiz doim aloqada.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
