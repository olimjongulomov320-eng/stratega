"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { DEALER_PAGE, SERVICE_PAGE } from "@/config/service-pages";

export function InfoNav() {
  const { t, href, locale } = useI18n();
  const current = stripLocale(usePathname());
  const items = [
    ["/yuridik-shaxslar", t.focus.b2bNav],
    ["/dilerlar", DEALER_PAGE[locale].nav],
    ["/servis", SERVICE_PAGE[locale].nav],
    ["/about", t.info.nav.about],
    ["/delivery", t.info.nav.delivery],
    ["/payment", t.info.nav.payment],
    ["/returns", t.info.nav.returns],
    ["/faq", t.info.nav.faq],
    ["/contacts", t.info.nav.contacts],
  ] as const;
  return (
    <nav className="flex flex-col gap-1" aria-label={t.footer.info}>
      {items.map(([path, label]) => (
        <Link
          key={path}
          href={href(path)}
          aria-current={current === path ? "page" : undefined}
          className={`rounded-lg px-3 py-2 text-sm ${current === path ? "bg-indigo-50 font-semibold text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
