import Link from "next/link";
import { requirePage } from "@/lib/admin";
import { PageHeader, Card, inputCls, Field } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { importProductsCsv } from "../actions";

const COLUMNS: [string, string][] = [
  ["sku", "Artikul — mahsulot shu bo'yicha topiladi (majburiy)"],
  ["nomi_uz / nomi_ru / nomi_en", "Nomi (yangi mahsulot uchun nomi_uz majburiy)"],
  ["kategoriya", "Kategoriya slugi; yo'q bo'lsa yaratiladi (kategoriya_uz / kategoriya_ru nomlari bilan)"],
  ["brend, birlik", "Brend; birlik: dona, komplekt, kg, metr, litr, paddon, quti"],
  ["tannarx_usd", "Xarid narxi USD da — kurs bo'yicha so'mga o'giriladi (saytda ko'rinmaydi)"],
  ["tannarx", "Yoki tannarx to'g'ridan-to'g'ri so'mda"],
  ["narx", "Sotuv narxi, so'm (QQS bilan). Bo'sh bo'lsa mahsulot yashirin qo'shiladi"],
  ["eski_narx", "Chegirmadan oldingi narx (ixtiyoriy)"],
  ["qoldiq", "Asosiy ombordagi qoldiq (ixtiyoriy)"],
  ["rasm", "Rasm havolasi https://… (ixtiyoriy; yoki rasmlarni alohida yuklang)"],
  ["yetkazib_beruvchi, yetkazib_beruvchi_kodi", "Yetkazib beruvchi nomi va uning katalog kodi"],
  ["tavsif_uz / tavsif_ru", "Tavsif (ixtiyoriy)"],
  ["faol", "1 — saytda ko'rsatish, 0 — yashirish (ixtiyoriy)"],
  ["mos_keladi", "Ehtiyot qism uchun: qaysi modellarga mos (vergul bilan: CBY-AC, BS3500)"],
  ["ehtiyot_qism", "ha — yangi kategoriya «Ehtiyot qismlar» bo'limiga tushadi (nomida «ehtiyot qism» bo'lsa avtomatik)"],
  ["yuk_kg, kotarish_mm, ish_kengligi_mm, quvvat_kvt", "Texnik xususiyatlar — katalogdagi filtrlar uchun (raqam)"],
  ["pasport_pdf, video", "Texnik pasport (PDF) va YouTube havolasi — https:// bilan"],
  ["yetkazish_kun", "Omborda yo'q bo'lsa: yetkazish muddati, kun"],
  ["manba", "«o'z ombori» yoki «ta'minotchi» (ta'minotchi omboridan sotilgach sotib olinadigan mahsulot)"],
  ["tavsiya", "1 — bosh sahifada va ro'yxatlarda birinchi ko'rsatish, 0 — oddiy (ixtiyoriy)"],
];

export default async function ImportPage() {
  await requirePage("products.write");
  return (
    <div className="max-w-3xl">
      <PageHeader title="Import (Excel / CSV)" description="Yangi mahsulotlarni qo'shing yoki narx, qoldiq va boshqa ma'lumotlarni bitta faylda yangilang." back={{ href: "/admin/products", label: "Mahsulotlar" }} />
      <Card>
        <ActionForm action={importProductsCsv} className="flex flex-col gap-4">
          <Field label="Fayl: Excel (.xlsx) yoki CSV" hint="Excel: «Import» nomli varaq bo'lsa o'sha o'qiladi, aks holda birinchi varaq">
            <input type="file" name="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className={inputCls} />
          </Field>
          <Field label="USD kursi, so'm (faqat tannarx_usd ustuni bo'lsa)" hint="Masalan, Markaziy bank kursi yoki o'zingizning hisob kursingiz.">
            <input type="text" inputMode="decimal" name="usdRate" placeholder="masalan 12 650" className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="createMissing" defaultChecked /> Faylda bor, saytda yo&apos;q SKU — yangi mahsulot sifatida qo&apos;shilsin
          </label>
          <div><Submit>Yuklash</Submit></div>
        </ActionForm>
      </Card>
      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-slate-800">Ustunlar</h2>
        <p className="mt-1 text-sm text-slate-600">Birinchi qator — ustun nomlari. Bo&apos;sh katak mavjud qiymatni o&apos;zgartirmaydi. Faqat kerakli ustunlarni qoldirishingiz mumkin.</p>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {COLUMNS.map(([c, d]) => (
              <tr key={c} className="border-t border-slate-100">
                <td className="py-1.5 pr-3 font-mono text-xs text-slate-800">{c}</td>
                <td className="py-1.5 text-slate-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-slate-600">
          Rasmlarni ko&apos;p sonli yuklash: <Link href="/admin/products/images" className="text-indigo-600">Rasmlarni yuklash</Link> — fayl nomi SKU bo&apos;lsin (XS-1218.jpg).
        </p>
      </Card>
    </div>
  );
}
