import { localePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { formatNumber } from "@/lib/format";
import { localName, localDescription } from "@/lib/localize";
import { productFacts, productLocales } from "@/lib/product-seo";
import { COMPANY } from "@/lib/site";
import { isAvailable } from "@/lib/sourcing";
import { CATEGORY_SEO } from "@/config/category-seo";

type LlmsCategory = { slug: string; name: string; nameRu: string | null; nameEn: string | null };
type LlmsProduct = Parameters<typeof productFacts>[0] & {
  slug: string;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  description: string | null;
  descriptionRu: string | null;
  brand: string | null;
  sku: string | null;
  price: number;
  priceOnRequest: boolean;
  stock: number;
  sourcing?: "OWN_STOCK" | "SUPPLIER_STOCK";
  categorySlug: string;
};

/**
 * /llms.txt (llmstxt.org): a plain-text map of the shop for AI assistants — who we are, where to buy, and every
 * product with its page, price and key specs. States only what the product pages already show.
 */
export function buildLlmsTxt(categories: LlmsCategory[], products: LlmsProduct[]): string {
  const lines: string[] = [
    `# ${COMPANY.brand} (stratega.uz)`,
    "",
    "> B2B supplier of warehouse equipment, floor-cleaning machines, PE pipe welding machines and related equipment in Tashkent, Uzbekistan. Prices in Uzbek so'm (UZS); the site is in Uzbek (default), Russian (/ru) and English (/en).",
    "",
    "Buyers in Uzbekistan search by the kind of machine, not by brand (for example «рохля купить в Ташкенте», «генератор цена», «karcher narxi»). Products are in stock in Tashkent or delivered across Uzbekistan; prices include VAT, with a contract and VAT invoice for companies.",
    "",
    "## Contacts",
    `- Phone: ${COMPANY.phone}`,
    `- Telegram: ${COMPANY.messengers.telegram}`,
    `- Email: ${COMPANY.email}`,
    `- Shop: ${COMPANY.shop.en} (${COMPANY.hours.en})`,
    `- Legal entity: ${COMPANY.legalName}, INN ${COMPANY.inn}`,
    `- Website: ${absoluteUrl("/")}`,
    "",
  ];
  for (const c of categories) {
    const items = products.filter((p) => p.categorySlug === c.slug);
    if (!items.length) continue;
    lines.push(`## ${c.nameRu || c.name} / ${c.name}`, "", `Category page: ${absoluteUrl(localePath("ru", `/category/${c.slug}`))}`);
    const seo = CATEGORY_SEO[c.slug];
    if (seo?.aka?.length) lines.push(`Also searched as: ${seo.aka.join(", ")}`);
    if (seo?.ru.intro) lines.push(seo.ru.intro);
    lines.push("");
    for (const p of items) {
      const ru = productLocales(p).includes("ru");
      const title = ru ? localName(p, "ru") : p.name;
      const price = p.priceOnRequest ? "price on request" : `${formatNumber(p.price).replace(/\u00a0/g, " ")} UZS`;
      const facts = productFacts(p, ru ? "ru" : "uz", 8, localDescription(p, ru ? "ru" : "uz")).map((f) => `${f.name}: ${f.value}`);
      const details = [p.brand && `brand ${p.brand}`, p.sku && `model ${p.sku}`, price, isAvailable(p) ? "in stock" : "to order", ...facts]
        .filter(Boolean)
        .join("; ");
      lines.push(`- [${title}](${absoluteUrl(localePath(ru ? "ru" : "uz", `/product/${p.slug}`))}): ${details}`);
      if (ru && p.name !== title) lines.push(`  - O'zbekcha: [${p.name}](${absoluteUrl(`/product/${p.slug}`)})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
