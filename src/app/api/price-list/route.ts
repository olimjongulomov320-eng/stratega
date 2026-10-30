import writeXlsxFile from "write-excel-file/node";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { localName } from "@/lib/localize";
import { FOCUS_CATEGORY_ORDER } from "@/lib/focus";
import { getBuyerPriceList, getBuyerPrices } from "@/lib/customer-price";
import { rateLimit, getRequestIp } from "@/lib/rate-limit";
import { SITE_URL, COMPANY } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public price list (.xlsx) of all products on sale, focus directions first.
 * A logged-in buyer with their own price list also gets a "your price" column.
 */
export async function GET(req: Request) {
  if (!rateLimit(`price-list:${getRequestIp(req)}`, 20, 60 * 60 * 1000)) return new Response("Too many requests", { status: 429 });
  const lang = new URL(req.url).searchParams.get("lang") ?? "uz";
  const locale: Locale = isLocale(lang) ? lang : "uz";
  const f = getDictionary(locale).focus;

  const products = await prisma.product.findMany({
    where: { isActive: true, price: { gt: 0 }, category: { isActive: true } },
    include: { category: true },
  });
  const rank = (slug: string) => {
    const i = FOCUS_CATEGORY_ORDER.indexOf(slug);
    return i === -1 ? 1000 : i;
  };
  products.sort(
    (a, b) =>
      Number(a.category.isSparePart) - Number(b.category.isSparePart) ||
      rank(a.category.slug) - rank(b.category.slug) ||
      a.category.sortOrder - b.category.sortOrder ||
      localName(a.category, locale).localeCompare(localName(b.category, locale)) ||
      a.price - b.price
  );
  const [list, buyerPrices] = await Promise.all([getBuyerPriceList(), getBuyerPrices(products.map((p) => p.id))]);

  const date = new Date().toISOString().slice(0, 10);
  const head = [f.sheetCategory, f.sheetName, f.sheetSku, f.sheetBrand, f.sheetPrice, ...(list ? [f.yourPrice] : []), f.sheetStock, "URL"];
  const data = [
    [{ value: `${f.sheetTitle} — ${date}. ${COMPANY.phone}, ${COMPANY.email}`, fontWeight: "bold" as const }],
    [],
    head.map((h) => ({ value: h, fontWeight: "bold" as const })),
    ...products.map((p) => [
      { value: localName(p.category, locale) },
      { value: localName(p, locale) },
      { value: p.sku ?? "" },
      { value: p.brand ?? "" },
      { value: p.price, format: "#,##0" },
      ...(list ? [{ value: buyerPrices.get(p.id) ?? p.price, format: "#,##0" }] : []),
      { value: p.stock > 0 ? f.sheetInStock : f.sheetOnOrder },
      { value: `${SITE_URL}${localePath(locale, `/product/${p.slug}`)}` },
    ]),
  ];
  const buffer = await writeXlsxFile(data, {
    sheet: "Narxlar",
    columns: [{ width: 28 }, { width: 60 }, { width: 18 }, { width: 12 }, { width: 18 }, ...(list ? [{ width: 18 }] : []), { width: 16 }, { width: 50 }],
    stickyRowsCount: 3,
  }).toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="stratega-narxlar-${date}.xlsx"`,
      "cache-control": "private, no-store",
    },
  });
}
