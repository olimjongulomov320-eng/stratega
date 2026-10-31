import Link from "next/link";
import { formatNumber } from "@/lib/format";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="text-sm text-slate-500 hover:text-indigo-600">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", actions }: { title?: React.ReactNode; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, href, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string; tone?: "default" | "warn" | "bad" | "good" }) {
  const toneClass = { default: "text-slate-900", warn: "text-amber-600", bad: "text-red-600", good: "text-emerald-600" }[tone];
  const inner = (
    <>
      <div className={`text-lg font-bold leading-6 [overflow-wrap:anywhere] sm:text-xl [&_span]:whitespace-normal ${toneClass}`}>{value}</div>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </>
  );
  const cls = "block min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
  return href ? (
    <Link href={href} className={`${cls} hover:border-indigo-300`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.flat().filter(Boolean) : children ? [children] : [];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-10 text-center text-slate-400">
                {empty ?? "Ma'lumot yo'q."}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "", right }: { children?: React.ReactNode; className?: string; right?: boolean }) {
  return <td className={`px-4 py-3 align-top ${right ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>;
}

const BADGE: Record<string, string> = {
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  indigo: "bg-indigo-50 text-indigo-700",
};
export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof BADGE }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[tone]}`}>{children}</span>;
}

const BTN = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};
export type BtnVariant = keyof typeof BTN;
export function btn(variant: BtnVariant = "primary", size: "sm" | "md" = "md") {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
  } ${BTN[variant]}`;
}
export function LinkButton({ href, children, variant = "primary", size = "md" }: { href: string; children: React.ReactNode; variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <Link href={href} className={btn(variant, size)}>
      {children}
    </Link>
  );
}

export const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:bg-slate-50";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Money({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
  return <span className="whitespace-nowrap tabular-nums">{formatNumber(value)} so&apos;m</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{children}</p>;
}

export function Filters({ children }: { children: React.ReactNode }) {
  return <form className="mb-4 flex flex-wrap items-end gap-2">{children}</form>;
}

/** Plain link for file downloads (CSV) from API routes. */
export function DownloadLink({ href, children, variant = "secondary", size = "md" }: { href: string; children: React.ReactNode; variant?: BtnVariant; size?: "sm" | "md" }) {
  return (
    <a href={href} download className={btn(variant, size)}>
      {children}
    </a>
  );
}
