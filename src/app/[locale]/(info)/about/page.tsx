import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { infoMetadata } from "../meta";

export const generateMetadata = (props: PageProps<"/[locale]/about">) => infoMetadata(props.params, "about");

export default async function AboutPage(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const p = getDictionary(locale).info.about;
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
      <p className="mt-3 text-lg text-slate-700">{p.lead}</p>
      {p.body.map((para) => (
        <p key={para} className="mt-4 text-slate-600">{para}</p>
      ))}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">{p.principles}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
        {p.principleItems.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
