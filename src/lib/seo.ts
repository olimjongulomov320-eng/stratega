import type { Metadata } from "next";
import { LOCALES, LOCALE_TAGS, localePath, type Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;
}

/** canonical + hreflang for a locale-neutral path like "/product/x". */
export function alternatesFor(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(localePath(l, path));
  languages["x-default"] = absoluteUrl(localePath("uz", path));
  return { canonical: absoluteUrl(localePath(locale, path)), languages };
}

export function pageMetadata(opts: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(localePath(opts.locale, opts.path));
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : absoluteUrl(opts.image)) : absoluteUrl("/og-default.png");
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: alternatesFor(opts.locale, opts.path),
    openGraph: {
      type: opts.type ?? "website",
      url,
      title: opts.title,
      description: opts.description,
      siteName: "Stratega",
      locale: LOCALE_TAGS[opts.locale].replace("-", "_"),
      alternateLocale: LOCALES.filter((l) => l !== opts.locale).map((l) => LOCALE_TAGS[l].replace("-", "_")),
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
  };
}

/** Render JSON-LD safely (escapes "<" so content can't close the script tag). */
export function jsonLd(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
