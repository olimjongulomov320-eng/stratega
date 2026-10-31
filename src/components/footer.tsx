import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { TelegramIcon, InstagramIcon, YouTubeIcon, FacebookIcon } from "@/components/social-icons";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { COMPANY } from "@/lib/site";
import { directionsFrom, type HeaderCategory } from "@/lib/categories";

const SOCIALS = [
  { name: "Telegram", href: COMPANY.socials.telegram, Icon: TelegramIcon },
  { name: "Instagram", href: COMPANY.socials.instagram, Icon: InstagramIcon },
  { name: "YouTube", href: COMPANY.socials.youtube, Icon: YouTubeIcon },
  { name: "Facebook", href: COMPANY.socials.facebook, Icon: FacebookIcon },
];

export function Footer({ categories, locale }: { categories: HeaderCategory[]; locale: Locale }) {
  const t = getDictionary(locale);
  const lp = (p: string) => localePath(locale, p);
  const directions = directionsFrom(categories, locale);
  const menu = directions.length > 0 ? directions.map((d) => ({ key: d.slug, path: `/yonalish/${d.slug}`, name: d.name })) : categories.map((c) => ({ key: c.id, path: `/category/${c.slug}`, name: c.name }));
  const info = [
    ["/yuridik-shaxslar", t.focus.b2bNav],
    ["/about", t.info.nav.about],
    ["/delivery", t.info.nav.delivery],
    ["/payment", t.info.nav.payment],
    ["/returns", t.info.nav.returns],
    ["/faq", t.info.nav.faq],
  ] as const;

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-black text-slate-900">
              STRATEG<span className="text-indigo-600">A</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">{t.footer.about}</p>
          <div className="mt-4 flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white"
              >
                <s.Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t.common.categories}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {menu.map((m) => (
              <li key={m.key}>
                <Link href={lp(m.path)} className="hover:text-indigo-600">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t.footer.info}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {info.map(([path, label]) => (
              <li key={path}>
                <Link href={lp(path)} className="hover:text-indigo-600">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`/api/price-list?lang=${locale}`} className="hover:text-indigo-600">
                {t.focus.priceList}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t.footer.contact}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              {t.footer.phone}:{" "}
              <a href={`tel:${COMPANY.phoneHref}`} className="hover:text-indigo-600">
                {COMPANY.phone}
              </a>
            </li>
            {COMPANY.messengers.whatsapp && (
              <li>
                <a href={COMPANY.messengers.whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 hover:text-emerald-800">
                  WhatsApp ↗
                </a>
              </li>
            )}
            {process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL && (
              <li>
                <a href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-700 hover:text-sky-800">
                  Telegram bot · buyurtma berish ↗
                </a>
              </li>
            )}
            <li>
              {t.trust.shop}: {COMPANY.shop[locale]}
            </li>
            <li>
              {t.footer.address}: {COMPANY.address[locale]}
            </li>
            <li>
              {t.footer.hours}: {COMPANY.hours[locale]}
            </li>
            <li>
              <Link href={lp("/contacts")} className="text-indigo-600 hover:underline">
                {t.footer.contactsLink}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {COMPANY.legalName}. {t.footer.rights}
      </div>
    </footer>
  );
}
