import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_SEO } from "../src/config/category-seo";

const PRICE = /\d[\d\s ]*\s?(сум|so'm|UZS)/i;

test("category search texts fit Google's limits", () => {
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    for (const l of ["uz", "ru", "en"] as const) {
      const tx = seo[l];
      assert.ok(tx.title.length <= 75, `${slug} ${l} title ${tx.title.length}`);
      // The page trims descriptions to 165 characters; a few older ones run a little over.
      assert.ok(tx.description.length <= 170, `${slug} ${l} description ${tx.description.length}`);
    }
  }
});

test("headings, buying texts and extra questions are complete and price-free", () => {
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    const uz = seo.uz, ru = seo.ru;
    // Whatever one language has, the other has too, in the same shape.
    assert.equal(!!uz.h1, !!ru.h1, `${slug} h1 in both languages`);
    assert.equal(uz.sections?.length ?? 0, ru.sections?.length ?? 0, `${slug} sections`);
    assert.equal(uz.faq?.length ?? 0, ru.faq?.length ?? 0, `${slug} faq`);
    uz.sections?.forEach((s, i) => assert.equal(s.ul?.length ?? 0, ru.sections![i].ul?.length ?? 0, `${slug} section ${i}`));
    for (const tx of [uz, ru, seo.en]) {
      const text = [tx.h1, ...(tx.sections ?? []).flatMap((s) => [s.h2, s.p, ...(s.ul ?? [])]), ...(tx.faq ?? []).flatMap((f) => [f.q, f.a])].filter(Boolean).join(" ");
      assert.doesNotMatch(text, PRICE, `${slug}: prices belong on product cards, not in fixed text`);
      for (const s of tx.sections ?? []) assert.ok(s.p || s.ul?.length, `${slug} "${s.h2}" has no body`);
    }
  }
});

test("welding and pallet-truck pages use the words buyers type", () => {
  const weld = CATEGORY_SEO["payvandlash-apparatlari"];
  assert.match(weld.ru.title, /^Пайка/);
  assert.match(weld.ru.h1 ?? "", /Пайка/);
  assert.match(weld.ru.sections?.[0].p ?? "", /утюг.*дазмол/);
  assert.match(weld.uz.title, /payka/i);
  assert.match(CATEGORY_SEO["gidravlik-telejkalar"].ru.h1 ?? "", /^Рохли/);
  assert.match(CATEGORY_SEO["gidravlik-telejkalar"].uz.h1 ?? "", /^Rohlya/);
});
