import { test } from "node:test";
import assert from "node:assert/strict";
import { exactCategory, matchCategories } from "../src/lib/category-match";
import { CATEGORY_SEO } from "../src/config/category-seo";

test("a search that is just a product type opens its category", () => {
  assert.equal(exactCategory("рохля"), "gidravlik-telejkalar");
  assert.equal(exactCategory("Рохля цена"), "gidravlik-telejkalar");
  assert.equal(exactCategory("rohlya narxi"), "gidravlik-telejkalar");
  assert.equal(exactCategory("пайка для пэ труб"), "payvandlash-apparatlari");
  assert.equal(exactCategory("дазмол"), "payvandlash-apparatlari");
  assert.equal(exactCategory("керхер купить в ташкенте"), "yuqori-bosimli-yuvish-apparatlari");
  assert.equal(exactCategory("karcher"), "yuqori-bosimli-yuvish-apparatlari");
  assert.equal(exactCategory("виброплита"), "vibroplita-va-vibrotrambovkalar");
  assert.equal(exactCategory("инверторный генератор"), "invertorli-generatorlar");
});

test("a model or a vague word does not jump to a category", () => {
  assert.equal(exactCategory("CN-90/315H"), null);
  assert.equal(exactCategory("цена"), null);
  assert.equal(exactCategory(""), null);
  assert.equal(exactCategory("штабелер"), null, "manual and electric stackers are both stackers");
});

test("queries that mention a product type link to it, best match first", () => {
  assert.deepEqual(matchCategories("инверторный генератор 3 квт")[0], "invertorli-generatorlar");
  assert.ok(matchCategories("рохля 3 тонны").includes("gidravlik-telejkalar"));
  assert.ok(matchCategories("штабелер 1.6 м").includes("elektr-shtabelerlar"));
  assert.ok(matchCategories("штабелер 1.6 м").includes("qol-shtabelerlari"));
  assert.ok(matchCategories("штабел").length > 0, "a started word counts");
  assert.deepEqual(matchCategories("xyz123"), []);
});

test("every buyer name belongs to a known category and no exact name is shared by mistake", () => {
  const seen = new Map<string, string>();
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    for (const a of seo.aka ?? []) {
      const k = a.toLowerCase();
      assert.ok(k.length >= 3, `${slug}: "${a}" is too short`);
      if (seen.has(k) && seen.get(k) !== slug) {
        // Shared names are allowed only between sibling categories on purpose (they then show both).
        assert.ok(SHARED.has(k), `"${a}" is in ${seen.get(k)} and ${slug}`);
      }
      seen.set(k, slug);
    }
  }
});

const SHARED = new Set(["штабелер", "штабелёр", "shtabeler"]);
