// Own warehouse vs supplier warehouse rules — no database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isAvailable, lineUnitCost, parseSourcing } from "@/lib/sourcing";

describe("isAvailable", () => {
  test("own stock needs a positive balance; supplier stock is always available", () => {
    assert.equal(isAvailable({ stock: 3, sourcing: "OWN_STOCK" }), true);
    assert.equal(isAvailable({ stock: 0, sourcing: "OWN_STOCK" }), false);
    assert.equal(isAvailable({ stock: 0, sourcing: "SUPPLIER_STOCK" }), true);
    assert.equal(isAvailable({ stock: 0 }), false);
  });
});

describe("lineUnitCost", () => {
  test("the price actually paid to the supplier wins over the snapshot", () => {
    assert.equal(lineUnitCost({ purchaseCost: 3_600_000, costPrice: 3_300_000 }), 3_600_000);
    assert.equal(lineUnitCost({ purchaseCost: null, costPrice: 3_300_000 }), 3_300_000);
    assert.equal(lineUnitCost({}), null);
  });
});

describe("parseSourcing (import column «manba»)", () => {
  test("Uzbek, Russian and English values", () => {
    assert.equal(parseSourcing("o'z ombori"), "OWN_STOCK");
    assert.equal(parseSourcing("Ta'minotchi"), "SUPPLIER_STOCK");
    assert.equal(parseSourcing("склад поставщика"), "SUPPLIER_STOCK");
    assert.equal(parseSourcing("supplier"), "SUPPLIER_STOCK");
    assert.equal(parseSourcing(""), undefined);
    assert.equal(parseSourcing("?"), undefined);
  });
});
