export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-4 w-56 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-9 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-12 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
