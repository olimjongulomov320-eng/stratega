import Link from "next/link";
import type { HeaderCategory } from "@/components/header";

export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: HeaderCategory[];
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Kategoriyalar
      </h3>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
            activeSlug === cat.slug
              ? "bg-indigo-50 font-semibold text-indigo-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{cat.icon}</span>
            {cat.name}
          </span>
          <span className="text-xs text-slate-400">{cat.productCount}</span>
        </Link>
      ))}
    </div>
  );
}
