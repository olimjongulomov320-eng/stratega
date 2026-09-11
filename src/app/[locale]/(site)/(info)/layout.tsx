import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const INFO_LINK_HREFS = [
  { href: "/about", key: "about" },
  { href: "/delivery", key: "delivery" },
  { href: "/payment", key: "payment" },
  { href: "/returns", key: "returns" },
  { href: "/faq", key: "faq" },
  { href: "/contacts", key: "contacts" },
] as const;

export default async function InfoLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("infoNav");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-1">
          <h2 className="mb-2 px-3 text-sm font-semibold text-slate-700">
            {tCommon("info")}
          </h2>
          {INFO_LINK_HREFS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              {t(link.key)}
            </Link>
          ))}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
