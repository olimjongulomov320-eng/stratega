import Link from "next/link";
import type { HeaderCategory } from "@/lib/categories";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export function CategorySidebar({
  categories,
  activeSlug,
  locale,
}: {
  categories: HeaderCategory[];
  activeSlug?: string;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  return (
    <nav className="flex flex-col gap-1" aria-label={t.common.categories}>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{t.common.categories}</h2>
      <Link
        href={localePath(locale, "/search")}
        className={`rounded-lg px-3 py-2 text-sm transition ${
          !activeSlug ? "bg-indigo-50 font-semibold text-indigo-600" : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        {t.catalog.allProducts}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={localePath(locale, `/category/${cat.slug}`)}
          aria-current={activeSlug === cat.slug ? "page" : undefined}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
            activeSlug === cat.slug ? "bg-indigo-50 font-semibold text-indigo-600" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{cat.icon}</span>
            {cat.name}
          </span>
          <span className="text-xs text-slate-400">{cat.productCount}</span>
        </Link>
      ))}
    </nav>
  );
}
