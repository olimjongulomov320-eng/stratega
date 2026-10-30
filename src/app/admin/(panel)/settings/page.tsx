import { requirePage } from "@/lib/admin";
import { PageHeader, Field, inputCls, Card } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { SETTING_DEFS, getSettings } from "@/lib/settings";
import { saveSettings } from "./actions";

export default async function SettingsPage() {
  await requirePage("settings.manage");
  const values = await getSettings();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Sozlamalar" description="Tizim qoidalari — o'zgarishlar darhol barcha modullarga ta'sir qiladi." />
      <ActionForm action={saveSettings} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        {SETTING_DEFS.map((d) =>
          d.type === "boolean" ? (
            <label key={d.key} className="flex items-start gap-3 text-sm">
              <input type="checkbox" name={d.key} defaultChecked={Boolean(values[d.key])} className="mt-1" />
              <span><span className="font-medium text-slate-800">{d.label}</span><span className="block text-xs text-slate-400">{d.hint}</span></span>
            </label>
          ) : (
            <Field key={d.key} label={d.label} hint={d.hint}>
              <input name={d.key} defaultValue={String(values[d.key] ?? "")} inputMode={d.type === "number" ? "decimal" : undefined} className={inputCls} />
            </Field>
          )
        )}
        <div><Submit>Saqlash</Submit></div>
      </ActionForm>
      <Card title="Sayt matnlari va da'volar" className="mt-6">
        <p className="text-sm text-slate-600">Kompaniya rekvizitlari, telefon, manzil va saytdagi da&apos;volar (CE sertifikati, servis markazi, sotilgan dona soni, kafolat) <code>src/lib/site.ts</code> faylida. Har bir da&apos;vo faqat yoqilganda ko&apos;rsatiladi — faqat haqiqat bo&apos;lsa yoqing.</p>
      </Card>
    </div>
  );
}
