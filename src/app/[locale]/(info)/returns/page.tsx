import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { infoMetadata } from "../meta";

export const generateMetadata = (props: PageProps<"/[locale]/returns">) => infoMetadata(props.params, "returns");

export default async function ReturnsPage(props: PageProps<"/[locale]/returns">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const p = getDictionary(locale).info.returns;
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
      <p className="mt-3 text-lg text-slate-700">{p.lead}</p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-600">
        {p.items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
