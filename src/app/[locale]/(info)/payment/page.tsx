import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { infoMetadata } from "../meta";

export const generateMetadata = (props: PageProps<"/[locale]/payment">) => infoMetadata(props.params, "payment");

export default async function PaymentPage(props: PageProps<"/[locale]/payment">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const p = getDictionary(locale).info.payment;
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
      <p className="mt-3 text-lg text-slate-700">{p.lead}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {p.methods.map((m) => (
          <div key={m.title} className="rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800">{m.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{m.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-500">{p.note}</p>
    </div>
  );
}
