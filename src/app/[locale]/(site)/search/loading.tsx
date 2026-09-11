import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </aside>
        <div>
          <div className="mb-6 h-10 w-full animate-pulse rounded bg-slate-100" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
