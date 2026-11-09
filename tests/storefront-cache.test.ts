// Public pages are cached, so a write that doesn't clear the cache shows visitors stale prices. No database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { filteredCatalogPath } from "@/lib/catalog-route";
import { revalidateStorefront } from "@/lib/storefront-cache";

const SRC = path.join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "generated" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

// Writes to the data public pages show: products, categories, reviews, stock, price lists. Any client name, any spacing,
// raw SQL on those tables, and the helpers that write them.
const CATALOGUE_WRITE = new RegExp(
  [
    String.raw`\.\s*(?:product|category|review|priceList|priceListItem)\s*\.\s*(?:create|createMany|createManyAndReturn|update|updateMany|updateManyAndReturn|upsert|delete|deleteMany)\s*\(`,
    String.raw`\$(?:executeRaw|executeRawUnsafe|queryRaw|queryRawUnsafe)\b[^;]*?\b(?:INSERT|UPDATE|DELETE)\b[^;]*?"(?:Product|Category|Review|StockLevel|PriceList|PriceListItem)"`,
    String.raw`\b(?:moveStock|postStockDocument|syncProductStock|importProductRows)\s*\(`,
  ].join("|"),
  "s"
);

// Files whose functions write that data. Each such function must clear the cache itself (checked below).
const CLEARS_THE_CACHE = [
  "app/admin/(panel)/categories/actions.ts", // category saved, deleted
  "app/admin/(panel)/orders/actions.ts", // shipment shipped (stock goes out)
  "app/admin/(panel)/price-lists/actions.ts", // price list and its prices saved
  "app/admin/(panel)/products/actions.ts", // product created, saved, hidden, deleted; stock adjusted; Excel/CSV import
  "app/admin/(panel)/reviews/actions.ts", // review added, approved, deleted
  "app/admin/(panel)/stock-documents/actions.ts", // stock document posted
  "app/api/admin/product-image/route.ts", // photo uploaded
  "lib/telegram-admin.ts", // Telegram /narx and /qoldiq
];
// Helpers that run inside their callers' transactions; each caller above clears the cache after the commit.
const CALLERS_CLEAR_THE_CACHE = [
  "lib/inventory.ts", // moveStock, postStockDocument
  "lib/product-import.ts", // importProductRows: products/actions.ts (also scripts/import-products.ts, see README)
];

/** Top-level functions of a source file, with their bodies (brace matching; enough for this code base). */
function functions(source: string): { name: string; body: string; start: number; end: number }[] {
  const found: { name: string; body: string; start: number; end: number }[] = [];
  const header = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm;
  for (let m = header.exec(source); m; m = header.exec(source)) {
    const open = source.indexOf("{", source.indexOf(")", m.index));
    let depth = 0;
    let i = open;
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}" && --depth === 0) break;
    }
    found.push({ name: m[1] ?? m[2], body: source.slice(open, i + 1), start: m.index, end: i + 1 });
    header.lastIndex = i + 1;
  }
  return found;
}

describe("every write to public data clears the page cache", () => {
  const writers = sourceFiles(SRC)
    .filter((file) => CATALOGUE_WRITE.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(SRC, file).split(path.sep).join("/"))
    .sort();

  test("the list above is complete: a new file that writes public data must be added here", () => {
    assert.deepEqual(writers, [...CLEARS_THE_CACHE, ...CALLERS_CLEAR_THE_CACHE].sort());
  });

  for (const file of CLEARS_THE_CACHE) {
    test(`${file}: every function that writes clears the cache`, () => {
      const source = readFileSync(path.join(SRC, file), "utf8");
      const fns = functions(source);
      const writing = fns.filter((fn) => CATALOGUE_WRITE.test(fn.body));
      assert.ok(writing.length > 0, "no writing function found");
      for (const fn of writing) assert.match(fn.body, /revalidateStorefront\(\)/, `${fn.name} writes public data without revalidateStorefront()`);
      // A write outside any function (module level) would escape the check above.
      let outside = source;
      for (const fn of [...fns].reverse()) outside = outside.slice(0, fn.start) + outside.slice(fn.end);
      assert.doesNotMatch(outside, CATALOGUE_WRITE);
    });
  }

  test("the shipment clears the cache when goods go out", () => {
    const orders = readFileSync(path.join(SRC, "app/admin/(panel)/orders/actions.ts"), "utf8");
    assert.match(orders, /if \(to === "SHIPPED"\) revalidateStorefront\(\)/);
  });
});

describe("revalidateStorefront", () => {
  test("never throws outside a Next.js request (Telegram poller, scripts): the data is already saved", () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      assert.doesNotThrow(() => revalidateStorefront());
    } finally {
      console.warn = warn;
    }
  });
});

describe("filteredCatalogPath", () => {
  const route = (pathname: string, query = "") => filteredCatalogPath(pathname, new URLSearchParams(query));

  test("plain catalogue URLs use the cached page", () => {
    assert.equal(route("/category/rohlya"), null);
    assert.equal(route("/search"), null);
    assert.equal(route("/ehtiyot-qismlar"), null);
  });
  test("filters, sorting, paging and search render per request", () => {
    assert.equal(route("/category/rohlya", "sort=price_asc"), "/category/rohlya/filtered");
    assert.equal(route("/category/rohlya", "page=2"), "/category/rohlya/filtered");
    assert.equal(route("/category/rohlya", "capMin=1000"), "/category/rohlya/filtered");
    assert.equal(route("/search", "q=generator"), "/search/filtered");
    assert.equal(route("/ehtiyot-qismlar", "q=gx35"), "/ehtiyot-qismlar/filtered");
  });
  test("ad and analytics tags keep the cached page", () => {
    assert.equal(route("/category/rohlya", "utm_source=ads&utm_campaign=x&gclid=1&yclid=2&fbclid=3"), null);
    assert.equal(route("/search", "srsltid=a&gad_source=1&gad_campaignid=2&msclkid=3&_gl=4&ttclid=5"), null);
    assert.equal(route("/search", "_rsc=abc"), null);
  });
  test("a tag next to a filter still renders per request", () => {
    assert.equal(route("/category/rohlya", "utm_source=ads&sort=newest"), "/category/rohlya/filtered");
  });
  test("an unknown parameter is treated as a filter, never ignored", () => {
    assert.equal(route("/search", "newFilter=1"), "/search/filtered");
  });
  test("other pages are left alone", () => {
    assert.equal(route("/product/x", "sort=price_asc"), null);
    assert.equal(route("/", "q=x"), null);
    assert.equal(route("/category/x/filtered", "sort=price_asc"), null);
    assert.equal(route("/category", "sort=price_asc"), null);
  });
});
