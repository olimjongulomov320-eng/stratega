// Telegram Mini App login check and search spellings — no database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebAppInitData } from "@/lib/telegram-webapp";
import { searchVariants } from "@/lib/products";

const TOKEN = "123456:TEST-TOKEN";

/** Builds initData exactly the way Telegram signs it. */
function signedInitData(fields: Record<string, string>, token = TOKEN) {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

const now = () => String(Math.floor(Date.now() / 1000));
const user = JSON.stringify({ id: 987654321, first_name: "Ali", language_code: "ru" });

describe("verifyWebAppInitData", () => {
  test("accepts data signed with the bot token", () => {
    const u = verifyWebAppInitData(signedInitData({ auth_date: now(), query_id: "AAE", user }), TOKEN);
    assert.equal(u?.id, 987654321);
  });
  test("rejects data signed with another token", () => {
    assert.equal(verifyWebAppInitData(signedInitData({ auth_date: now(), user }, "999:OTHER"), TOKEN), null);
  });
  test("rejects a changed field", () => {
    const tampered = signedInitData({ auth_date: now(), user }).replace("987654321", "111111111");
    assert.equal(verifyWebAppInitData(tampered, TOKEN), null);
  });
  test("rejects data older than a day", () => {
    const old = String(Math.floor(Date.now() / 1000) - 2 * 86400);
    assert.equal(verifyWebAppInitData(signedInitData({ auth_date: old, user }), TOKEN), null);
  });
  test("rejects missing hash or token", () => {
    assert.equal(verifyWebAppInitData(`auth_date=${now()}&user=${encodeURIComponent(user)}`, TOKEN), null);
    assert.equal(verifyWebAppInitData(signedInitData({ auth_date: now(), user }), ""), null);
  });
});

describe("searchVariants", () => {
  test("Cyrillic is also searched in Uzbek Latin", () => {
    assert.ok(searchVariants("штабелер").includes("shtabeler"));
  });
  test("synonyms for pallet trucks", () => {
    const v = searchVariants("рохля");
    assert.ok(v.includes("rohly") && v.includes("гидравлическая тележ"));
  });
  test("ё and е are the same", () => {
    assert.ok(searchVariants("штабелёр").includes("штабелер"));
  });
});
