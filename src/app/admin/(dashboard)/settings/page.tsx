import { prisma } from "@/lib/prisma";
import { allSettingsSchema, getSetting } from "@/lib/settings";
import { requirePagePermission } from "@/lib/require-permission";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePagePermission("settings.manage");

  const schema = allSettingsSchema();
  const rows = await prisma.setting.findMany();
  const stored = new Map(rows.map((r) => [r.key, r.value]));

  const values: Record<string, string> = {};
  for (const field of schema) {
    // Saqlangan qiymat bo'lmasa — kutubxonadagi default ko'rsatiladi.
    values[field.key] = stored.get(field.key) ?? (await getSetting(field.key as never));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Sozlamalar</h1>
      <p className="mt-1 text-slate-500">
        Tizim qoidalari — manfiy qoldiq, zaxira, prognoz davri va boshqalar.
        O&apos;zgarishlar darhol barcha modullarga ta&apos;sir qiladi.
      </p>

      <div className="mt-6 max-w-3xl">
        <SettingsForm
          fields={schema.map((f) => ({ ...f, value: values[f.key] }))}
        />
      </div>
    </div>
  );
}
