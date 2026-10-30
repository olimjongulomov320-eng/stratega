// Pure logic tests — no database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "@/lib/csv";
import { parseLines } from "@/lib/lines";
import { can, ROLE_PERMISSIONS } from "@/lib/permissions";
import { normInn, nameKey } from "@/lib/contact-import";

describe("parseCsv", () => {
  test("quoted commas, quotes and line breaks", () => {
    const rows = parseCsv('a,b,c\n"x, y","say ""hi""","line1\nline2"\n');
    assert.deepEqual(rows[1], ["x, y", 'say "hi"', "line1\nline2"]);
  });
  test("semicolon files (Russian Excel) are detected", () => {
    assert.deepEqual(parseCsv("sku;narx\nBS-1;100\n")[1], ["BS-1", "100"]);
  });
  test("UTF-8 BOM is stripped from the first header", () => {
    assert.equal(parseCsv("﻿sku,narx\nA,1")[0][0], "sku");
  });
});

describe("parseLines (order / document lines from the form)", () => {
  test("drops empty products, zero/negative quantities and junk", () => {
    const raw = JSON.stringify([
      { productId: "p1", quantity: 2, price: 10.4 },
      { productId: "", quantity: 1 },
      { productId: "p2", quantity: 0 },
      { productId: "p3", quantity: -5 },
      { productId: 7, quantity: 1 },
    ]);
    assert.deepEqual(parseLines(raw), [{ productId: "p1", quantity: 2, price: 10 }]);
  });
  test("invalid JSON gives an empty list, never throws", () => {
    assert.deepEqual(parseLines("{oops"), []);
    assert.deepEqual(parseLines(null), []);
  });
  test("at most 200 lines are accepted", () => {
    const many = JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ productId: `p${i}`, quantity: 1 })));
    assert.equal(parseLines(many).length, 200);
  });
});

describe("permissions", () => {
  test("OWNER has every permission", () => {
    for (const perm of ROLE_PERMISSIONS.OWNER) assert.ok(can("OWNER", perm));
  });
  test("ADMIN cannot manage users", () => {
    assert.equal(can("ADMIN", "users.manage"), false);
  });
  test("WAREHOUSE sees stock but no money", () => {
    assert.ok(can("WAREHOUSE", "stock.write"));
    assert.equal(can("WAREHOUSE", "finance.read"), false);
  });
});

describe("contact import helpers", () => {
  test("INN keeps digits only", () => {
    assert.equal(normInn(" 312 506 439 "), "312506439");
    assert.equal(normInn(""), null);
  });
  test("company names match regardless of quotes, case and spaces", () => {
    assert.equal(nameKey('OOO  "Stratega"'), nameKey("ooo stratega"));
    assert.equal(nameKey("«Turan Trade»"), nameKey("turan trade"));
  });
});
