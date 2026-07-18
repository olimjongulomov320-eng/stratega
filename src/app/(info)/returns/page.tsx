import type { Metadata } from "next";
import { InfoPageHeader } from "@/components/info-page-header";

export const metadata: Metadata = {
  title: "Qaytarish shartlari — Stratega",
};

export default function ReturnsPage() {
  return (
    <div>
      <InfoPageHeader
        title="Qaytarish va almashtirish shartlari"
        subtitle="Mahsulot sizga mos kelmasa, quyidagi shartlar asosida qaytarishingiz mumkin"
      />

      <div className="flex flex-col gap-8 text-slate-700">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Qaytarish shartlari
          </h2>
          <ul className="flex flex-col gap-2 text-slate-600">
            <li>
              Mahsulotni qabul qilib olgan kundan boshlab{" "}
              <b className="text-slate-800">10 kun</b> ichida qaytarish
              mumkin.
            </li>
            <li>
              Mahsulot asl qadog&apos;ida, ishlatilmagan va tashqi
              ko&apos;rinishi buzilmagan holatda bo&apos;lishi kerak.
            </li>
            <li>
              Chek yoki buyurtma raqami mavjud bo&apos;lishi kerak.
            </li>
            <li>
              Sifatsiz yoki nosoz mahsulot uchun qaytarish muddati
              cheklanmagan — kafolat shartlariga muvofiq almashtiriladi.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Qaytarilmaydigan mahsulotlar
          </h2>
          <p className="text-slate-600">
            Gigiyena talablariga ko&apos;ra ichki kiyim, kosmetika va shaxsiy
            gigiyena buyumlari, shuningdek buzilgan qadoqli dasturiy
            ta&apos;minot mahsulotlari qaytarilmaydi (agar ular nosoz
            bo&apos;lmasa).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Qaytarish tartibi
          </h2>
          <ol className="flex flex-col gap-3">
            {[
              "Operatorimizga qo'ng'iroq qiling yoki buyurtma raqamingizni ko'rsating.",
              "Qaytarish sababini bildiring — mutaxassisimiz sizga yo'l-yo'riq beradi.",
              "Mahsulotni asl holatida kuryerga topshirasiz yoki do'konga olib kelasiz.",
              "To'lovingiz 3-5 ish kuni ichida qaytariladi.",
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
      </div>
    </div>
  );
}
