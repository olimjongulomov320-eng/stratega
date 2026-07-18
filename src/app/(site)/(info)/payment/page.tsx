import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "To'lov usullari — Stratega",
};

const METHODS = [
  {
    name: "Naqd pul orqali",
    description: "Mahsulotni qabul qilib olganingizda kuryerga naqd to'laysiz.",
    status: "Faol",
    active: true,
  },
  {
    name: "Payme",
    description: "Payme ilovasi orqali onlayn to'lov.",
    status: "Tez orada",
    active: false,
  },
  {
    name: "Click",
    description: "Click ilovasi orqali onlayn to'lov.",
    status: "Tez orada",
    active: false,
  },
  {
    name: "Bank kartasi (Uzcard / Humo)",
    description: "Yetkazib berishda kuryerdagi POS-terminal orqali to'lov.",
    status: "Tez orada",
    active: false,
  },
];

export default function PaymentPage() {
  return (
    <div>
      <InfoPageHeader
        title="To'lov usullari"
        subtitle="Sizga qulay bo'lgan usulni tanlang"
      />

      <div className="flex flex-col gap-3">
        {METHODS.map((method) => (
          <div
            key={method.name}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
          >
            <div>
              <h3 className="font-semibold text-slate-800">{method.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {method.description}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                method.active
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {method.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Hozircha buyurtmalar naqd to&apos;lov bilan qabul qilinadi. Onlayn
        to&apos;lov tizimlari yaqin orada ishga tushiriladi.
      </p>
    </div>
  );
}
