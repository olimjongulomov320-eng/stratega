// SEO and AI-visibility helpers — no database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { productLocales, productFacts } from "@/lib/product-seo";
import { buildLlmsTxt } from "@/lib/llms";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const base = { nameRu: null, nameEn: null, specs: null, capacityKg: null, liftHeightMm: null, workingWidthMm: null, powerKw: null };

describe("productLocales", () => {
  test("Uzbek always; Russian and English only with their own name", () => {
    assert.deepEqual(productLocales(base), ["uz"]);
    assert.deepEqual(productLocales({ ...base, nameRu: "Штабелёр" }), ["uz", "ru"]);
    assert.deepEqual(productLocales({ ...base, nameRu: "Штабелёр", nameEn: "  " }), ["uz", "ru"]);
    assert.deepEqual(productLocales({ ...base, nameRu: "Штабелёр", nameEn: "Stacker" }), ["uz", "ru", "en"]);
  });
});

describe("productFacts", () => {
  test("filter fields first, then spec rows in the page language, without duplicates", () => {
    const facts = productFacts({ ...base, capacityKg: 1500, liftHeightMm: 3500, specs: [{ uz: "Akkumulyator", ru: "Аккумулятор", value: "24 V 100 Ah" }, { ru: "Грузоподъёмность", value: "1,5 т" }] }, "ru");
    assert.deepEqual(facts, [
      { name: "Грузоподъёмность", value: "1500 кг" },
      { name: "Высота подъёма", value: "3500 мм" },
      { name: "Аккумулятор", value: "24 V 100 Ah" },
    ]);
  });
});

describe("alternatesFor", () => {
  test("hreflang lists only the languages given", () => {
    const a = alternatesFor("uz", "/product/x", ["uz", "ru"]);
    assert.deepEqual(Object.keys(a?.languages ?? {}).sort(), ["ru", "uz", "x-default"]);
  });
});

describe("buildLlmsTxt", () => {
  const products = [
    { ...base, slug: "stacker", name: "Elektr shtabeler", nameRu: "Электрический штабелёр", brand: "NIULI", sku: "CTQB", price: 37500000, priceOnRequest: false, stock: 2, categorySlug: "stackers", capacityKg: 1500 },
    { ...base, slug: "sweeper", name: "Supurish mashinasi", brand: null, sku: null, price: 10000000, priceOnRequest: true, stock: 0, categorySlug: "stackers" },
  ];
  const text = buildLlmsTxt([{ slug: "stackers", name: "Elektr shtabelerlar", nameRu: "Электроштабелёры", nameEn: null }], products);
  test("lists each product with its page, price and specs", () => {
    assert.match(text, new RegExp(`\\[Электрический штабелёр\\]\\(${SITE_URL}/ru/product/stacker\\): brand NIULI; model CTQB; 37 500 000 UZS; in stock; Грузоподъёмность: 1500 кг`));
    assert.match(text, /O'zbekcha: \[Elektr shtabeler\]/);
  });
  test("never reveals a hidden price, and uses the Uzbek page when there is no Russian name", () => {
    assert.match(text, new RegExp(`\\[Supurish mashinasi\\]\\(${SITE_URL}/product/sweeper\\): price on request; to order`));
    assert.doesNotMatch(text, /10 000 000/);
  });
});
