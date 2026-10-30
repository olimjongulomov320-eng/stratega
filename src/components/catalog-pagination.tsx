import Link from "next/link";

export function CatalogPagination({ pathname, page, pageSize, total, params, labels }: {
  pathname: string; page: number; pageSize: number; total: number;
  params: Record<string, string | string[] | undefined>;
  labels: { previous: string; next: string; page: string };
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      (Array.isArray(value) ? value : [value]).forEach((v) => query.append(key, v));
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  return <nav aria-label="Pagination" className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm">
    {page > 1 && <Link className="rounded-lg border px-3 py-2 hover:bg-slate-50" href={href(page - 1)}>{labels.previous}</Link>}
    {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((n) => <Link key={n} aria-current={n === page ? "page" : undefined} className={`rounded-lg border px-3 py-2 ${n === page ? "border-indigo-600 bg-indigo-600 text-white" : "hover:bg-slate-50"}`} href={href(n)}>{n}</Link>)}
    <span className="px-1 text-slate-500">{labels.page} {page} / {pages}</span>
    {page < pages && <Link className="rounded-lg border px-3 py-2 hover:bg-slate-50" href={href(page + 1)}>{labels.next}</Link>}
  </nav>;
}
