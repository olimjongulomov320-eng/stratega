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

// Writes to the data public pages show, directly or through the stock helpers.
const CATALOGUE_WRITE =
  /\b(?:prisma|tx)\.(?:product|category|review|priceList|priceListItem)\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\(|\b(?:moveStock|postStockDocument|syncProductStock)\(/;

// Every file that writes such data. The ones that clear the cache themselves:
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

describe("every write to public data clears the page cache", () => {
  const writers = sourceFiles(SRC)
    .filter((file) => !file.endsWith("storefront-cache.test.ts") && CATALOGUE_WRITE.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(SRC, file).split(path.sep).join("/"))
    .sort();

  test("the list above is complete: a new write path must be added here and clear the cache", () => {
    assert.deepEqual(writers, [...CLEARS_THE_CACHE, ...CALLERS_CLEAR_THE_CACHE].sort());
  });

  for (const file of CLEARS_THE_CACHE) {
    test(file, () => {
      assert.match(readFileSync(path.join(SRC, file), "utf8"), /revalidateStorefront\(\)/);
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
