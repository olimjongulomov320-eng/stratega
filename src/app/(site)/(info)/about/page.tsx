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
        subtitle="Stratega — elektr shtabelerlar va gidravlik telejkalar bo'yicha ishonchli yetkazib beruvchi"
      />

      <div className="flex flex-col gap-6 text-slate-700">
        <p>
          Stratega — omborlar, logistika markazlari va ishlab chiqarish
          korxonalari uchun elektr shtabelerlar va gidravlik telejkalarni
          yetkazib beruvchi kompaniya. Maqsadimiz — biznesingizga sifatli va
          ishonchli yuk ko&apos;tarish texnikasini qulay narxlarda, kafolat
          va texnik xizmat ko&apos;rsatish bilan ta&apos;minlash.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">8</p>
            <p className="mt-1 text-sm text-slate-500">Texnika modeli</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">2000+</p>
            <p className="mt-1 text-sm text-slate-500">Sotilgan texnika</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-indigo-600">12 oy</p>
            <p className="mt-1 text-sm text-slate-500">Kafolat</p>
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
