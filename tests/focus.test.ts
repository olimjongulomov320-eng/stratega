import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSpecText, parseSpecRows, specText, youTubeId, specsFromName } from "../src/lib/product-specs";
import { FOCUS, FOCUS_CATEGORY_ORDER, directionOfCategory } from "../src/lib/focus";
import { phoneKey } from "../src/lib/customer-price";

test("spec text round-trips and rejects junk", () => {
  const rows = parseSpecText("Akkumulyator | Аккумулятор | 24 V 100 Ah\nOg'irlik: 120 kg\n\nno value line\nRang | Цвет | ");
  assert.deepEqual(rows, [
    { uz: "Akkumulyator", ru: "Аккумулятор", value: "24 V 100 Ah" },
    { uz: "Og'irlik", ru: "Og'irlik", value: "120 kg" },
  ]);
  assert.deepEqual(parseSpecRows(JSON.parse(JSON.stringify(rows))), rows.map((r) => ({ ...r, en: undefined })));
  assert.equal(specText(rows).split("\n").length, 2);
  assert.deepEqual(parseSpecRows("nope"), []);
  assert.deepEqual(parseSpecRows([{ uz: "x" }, null, 5, { ru: "Длина", value: 3 }]), [{ uz: undefined, ru: "Длина", en: undefined, value: "3" }]);
});

test("youtube ids", () => {
  assert.equal(youTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://vimeo.com/123"), null);
  assert.equal(youTubeId(null), null);
});

test("specs from product names", () => {
  assert.deepEqual(specsFromName("Gidravlik telejka (rohlya) NIULI CBY-AC, 2–3 t", "gidravlik-telejkalar"), { capacityKg: 3000 });
  assert.deepEqual(specsFromName("Elektr shtabeler NIULI CTQB, 1–1,5 t, 1,6–3,5 m", "elektr-shtabelerlar"), { capacityKg: 1500, liftHeightMm: 3500 });
  assert.deepEqual(specsFromName("Pol yuvish mashinasi G65 (530 mm)", "pol-yuvish-mashinalari"), { workingWidthMm: 530 });
  assert.deepEqual(specsFromName("Benzinli generator SDL 5 kVt", "generatorlar"), { powerKw: 5 });
  assert.deepEqual(specsFromName("Benzinli kultivator BISON BS950FG (7 o.k., 950 mm)", "motoblok-va-kultivatorlar"), { workingWidthMm: 950, powerKw: 5.1 });
  assert.deepEqual(specsFromName("Elektr tal TOR PA 200/400 kg, 12/6 m, 220 V", "elektr-tallar"), { capacityKg: 200 });
  assert.deepEqual(specsFromName("Gidravlik ko'tarish stoli TOR PT1000A, 1000 kg, 415-1000 mm, 1016x510 mm", "kotarish-stollari"), { capacityKg: 1000, liftHeightMm: 1000 });
  // "kVt" must not be read as tonnes; generators have no capacity.
  assert.equal(specsFromName("Benzinli generator XS 3 kVt", "generatorlar").capacityKg, undefined);
});

test("focus directions are consistent", () => {
  assert.equal(new Set(FOCUS.map((f) => f.slug)).size, FOCUS.length);
  assert.equal(new Set(FOCUS_CATEGORY_ORDER).size, FOCUS_CATEGORY_ORDER.length, "a category belongs to one direction only");
  for (const f of FOCUS) for (const l of ["uz", "ru", "en"] as const) assert.ok(f.name[l] && f.intro[l] && f.tagline[l], `${f.slug} ${l}`);
  assert.equal(directionOfCategory("stroplar")?.slug, "yuk-kotarish-va-takelaj");
});

test("phone matching for buyer prices", () => {
  assert.equal(phoneKey("+998 (90) 123-45-67"), "901234567");
  assert.equal(phoneKey("998901234567"), "901234567");
  assert.equal(phoneKey("901234567"), "901234567");
  assert.equal(phoneKey("12345"), "");
  assert.equal(phoneKey(null), "");
});
