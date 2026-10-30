import { requirePage } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { PageHeader, Card, Stat, Table, Td, Field, inputCls, DownloadLink, Badge } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/forms";
import { formatNumber } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { getOlxSettings, buildOlxRows } from "@/lib/olx";
import { saveOlx } from "./actions";

export default async function OlxExportPage() {
  const session = await requirePage("products.read");
  const settings = await getOlxSettings();
  const { rows, skipped } = await buildOlxRows(settings);
  const canWrite = can(session.role, "products.write");
  const feedUrl = absoluteUrl(`/feeds/olx.xml?key=${settings.feedKey}`);
  const reasons = skipped.reduce<Record<string, number>>((a, s) => ((a[s.reason] = (a[s.reason] ?? 0) + 1), a), {});
  return (
    <div>
      <PageHeader
        title="OLX eksport"
        description="Saytdagi mahsulotlardan OLX e'lonlari ro'yxati: Excel fayl yoki avtomatik yangilanadigan havola (feed)."
        back={{ href: "/admin/products", label: "Mahsulotlar" }}
        actions={
          <>
            <DownloadLink href="/api/admin/olx?format=xlsx" variant="primary">Excel yuklab olish</DownloadLink>
            <DownloadLink href="/api/admin/olx?format=csv">CSV</DownloadLink>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="OLX ga tayyor e'lonlar" value={rows.length} tone="good" />
        <Stat label="O'tkazib yuborildi" value={skipped.length} tone={skipped.length ? "warn" : "default"} hint={Object.entries(reasons).map(([r, n]) => `${r}: ${n}`).join(" · ") || undefined} />
        <Stat label="Til" value={settings.lang === "ru" ? "Ruscha" : "O'zbekcha"} />
        <Stat label="Shahar" value={settings.city} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Avtomatik feed (havola)">
          <p className="text-sm text-slate-600">
            Bu havola har safar ochilganda saytdagi joriy narx, qoldiq va rasmlar bilan yangi ro&apos;yxat beradi (YML/XML formati). OLX biznes kabinetidagi
            «Import» havola qabul qilsa — shu havolani bering; prom.uz ham shu formatni o&apos;qiydi.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{feedUrl}</code>
          <p className="mt-2 text-xs text-slate-400">Havola maxfiy kalitga ega. Begona odamga berilgan bo&apos;lsa — pastda «yangi kalit» ni belgilab saqlang.</p>
        </Card>
        {canWrite && (
          <Card title="Sozlamalar">
            <ActionForm action={saveOlx} className="grid gap-3 sm:grid-cols-2">
              <Field label="E'lon tili">
                <select name="lang" defaultValue={settings.lang} className={inputCls}>
                  <option value="ru">Ruscha (OLX da ko&apos;proq qidiriladi)</option>
                  <option value="uz">O&apos;zbekcha</option>
                </select>
              </Field>
              <Field label="Shahar / tuman"><input name="city" defaultValue={settings.city} className={inputCls} /></Field>
              <Field label="Kontakt ismi"><input name="contactName" defaultValue={settings.contactName} className={inputCls} /></Field>
              <Field label="Telefon"><input name="phone" defaultValue={settings.phone} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="onlyInStock" defaultChecked={settings.onlyInStock} /> Faqat omborda borlari</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="newKey" /> Feed uchun yangi kalit</label>
              <div className="sm:col-span-2"><Submit size="sm">Saqlash</Submit></div>
            </ActionForm>
            <p className="mt-3 text-xs text-slate-400">OLX kategoriyasini har bir kategoriya sahifasida «OLX kategoriyasi» maydonida belgilang — bo&apos;sh bo&apos;lsa sayt kategoriyasi nomi yoziladi.</p>
          </Card>
        )}
      </div>

      <Card title={`Ko'rib chiqish (${rows.length})`} className="mt-6">
        <Table head={["Kod", "Sarlavha (≤70)", "Narx", "Kategoriya", "Rasm", "Qoldiq"]} empty="Narxi va rasmi bor faol mahsulot yo'q.">
          {rows.slice(0, 100).map((r) => (
            <tr key={r.externalId}>
              <Td className="text-xs text-slate-500">{r.externalId}</Td>
              <Td>{r.title}<div className="text-xs text-slate-400">{r.title.length} belgi · tavsif {r.description.length}</div></Td>
              <Td right>{formatNumber(r.price)}</Td>
              <Td>{r.category}</Td>
              <Td right>{r.images.length}</Td>
              <Td right>{r.stock > 0 ? r.stock : <Badge tone="amber">0</Badge>}</Td>
            </tr>
          ))}
        </Table>
        {rows.length > 100 && <p className="mt-2 text-xs text-slate-400">Birinchi 100 tasi ko&apos;rsatildi — faylda hammasi bor.</p>}
      </Card>

      {skipped.length > 0 && (
        <Card title={`O'tkazib yuborilganlar (${skipped.length})`} className="mt-6">
          <p className="mb-2 text-sm text-slate-500">OLX narxsiz va rasmsiz e&apos;lonni qabul qilmaydi. Narx yoki rasm qo&apos;shilgach, avtomatik ro&apos;yxatga tushadi.</p>
          <ul className="columns-1 text-sm text-slate-600 sm:columns-2">
            {skipped.slice(0, 60).map((s, i) => <li key={i}>{s.name} — <span className="text-amber-600">{s.reason}</span></li>)}
          </ul>
          {skipped.length > 60 && <p className="mt-2 text-xs text-slate-400">…va yana {skipped.length - 60} ta</p>}
        </Card>
      )}
    </div>
  );
}
