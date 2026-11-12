import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDES, GUIDE_LOCALES, guidesForCategory } from "../src/config/guides";

test("guide slugs are unique and URL-safe", () => {
  const slugs = GUIDES.map((g) => g.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});

test("every guide has Uzbek and Russian text that fits search snippets", () => {
  for (const g of GUIDES)
    for (const l of GUIDE_LOCALES) {
      const tx = g.text[l];
      const title = `${tx.seoTitle} | Stratega`;
      assert.ok(title.length <= 75, `${g.slug}/${l} title is ${title.length} chars`);
      assert.ok(tx.description.length >= 80 && tx.description.length <= 180, `${g.slug}/${l} description is ${tx.description.length} chars`);
      assert.ok(tx.body.length >= 4, `${g.slug}/${l} body too short`);
      assert.ok(tx.faq.length >= 2, `${g.slug}/${l} needs FAQ`);
      // Prices change; guides must link to live product cards instead of quoting them.
      assert.doesNotMatch(JSON.stringify(tx), /\d[\d\s]*\s?(so'm|сум|сўм)/i, `${g.slug}/${l} quotes a price`);
    }
});

test("Uzbek and Russian versions have the same structure", () => {
  for (const g of GUIDES) {
    assert.deepEqual(
      g.text.uz.body.map((b) => Object.keys(b)[0]),
      g.text.ru.body.map((b) => Object.keys(b)[0]),
      g.slug,
    );
    assert.equal(g.text.uz.faq.length, g.text.ru.faq.length, g.slug);
  }
});

test("category pages find their guides", () => {
  assert.ok(guidesForCategory("payvandlash-apparatlari").length >= 2);
  assert.equal(guidesForCategory("no-such-category").length, 0);
});
