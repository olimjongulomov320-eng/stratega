import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { HeaderCategory } from "@/components/header";
import { LogoMark } from "@/components/logo-mark";
import {
  TelegramIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/social-icons";

const FOOTER_SOCIALS = [
  { name: "Telegram", href: "https://t.me/stratega_uz", Icon: TelegramIcon },
  { name: "Instagram", href: "https://instagram.com/stratega.uz", Icon: InstagramIcon },
  { name: "YouTube", href: "https://youtube.com/@stratega_uz", Icon: YouTubeIcon },
  { name: "Facebook", href: "https://facebook.com/stratega.uz", Icon: FacebookIcon },
];

export async function Footer({ categories }: { categories: HeaderCategory[] }) {
  const t = await getTranslations("footer");
  const tInfo = await getTranslations("infoNav");

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
          <p className="mt-3 text-sm text-slate-500">{t("tagline")}</p>
          <div className="mt-4 flex gap-2">
            {FOOTER_SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="group flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white"
              >
                <social.Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t("categoriesHeading")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link href={`/category/${cat.slug}`} className="hover:text-indigo-600">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t("infoHeading")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/about" className="hover:text-indigo-600">
                {tInfo("about")}
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="hover:text-indigo-600">
                {tInfo("delivery")}
              </Link>
            </li>
            <li>
              <Link href="/payment" className="hover:text-indigo-600">
                {tInfo("payment")}
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-indigo-600">
                {tInfo("returns")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-indigo-600">
                {tInfo("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t("contactHeading")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>{t("phoneLabel", { phone: "+998 99 301 11 70" })}</li>
            <li>{t("addressLabel")}</li>
            <li>{t("hoursLabel")}</li>
            <li>
              <Link href="/contacts" className="text-indigo-600 hover:underline">
                {t("contactsLink")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400">
        {t("copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
