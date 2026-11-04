// Pure logic tests — no database. Run: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseNumber } from "@/lib/csv";
import { cellText } from "@/lib/table-file";
import { parseLines } from "@/lib/lines";
import { can, ROLE_PERMISSIONS } from "@/lib/permissions";
import { normInn, nameKey } from "@/lib/contact-import";
import { safeLocalPath } from "@/lib/safe-redirect";
import { absoluteUrl } from "@/lib/seo";
import { formatSum } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { numParam, pageParam, rangeFilter } from "@/lib/query-params";

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

describe("safeLocalPath (redirect after customer login)", () => {
  test("keeps same-site paths with query and hash", () => {
    assert.equal(safeLocalPath("/ru/kabinet?tab=orders#x", "/kabinet"), "/ru/kabinet?tab=orders#x");
  });
  test("values that are not valid URLs fall back instead of throwing", () => {
    for (const bad of ["//", "///", "//[", "//a b", "//:80", "//?"]) assert.equal(safeLocalPath(bad, "/kabinet"), "/kabinet", bad);
  });
  test("rejects other hosts, including backslash and control-character tricks", () => {
    for (const evil of ["//evil.example", "/\\evil.example", "/\t/evil.example", "https://evil.example", "evil", "", null, undefined, "/.//evil.example", "/%2e//evil.example", "/x/..//evil.example", "/..//evil.example"]) {
      assert.equal(safeLocalPath(evil, "/kabinet"), "/kabinet", String(evil));
    }
  });
});

describe("catalogue query parameters", () => {
  test("numbers are non-negative and capped at the int4 limit", () => {
    assert.equal(numParam("1500000"), 1500000);
    assert.equal(numParam("3000000000"), 2_147_483_647);
    assert.equal(numParam("-5"), undefined);
    assert.equal(numParam("abc"), undefined);
    assert.equal(numParam(""), undefined);
    assert.equal(numParam(["1", "2"]), undefined);
  });
  test("page is a whole number between 1 and 1000", () => {
    assert.equal(pageParam(undefined), 1);
    assert.equal(pageParam("3.7"), 3);
    assert.equal(pageParam("0"), 1);
    assert.equal(pageParam("1e300"), 1000);
  });
  test("integer ranges are rounded inward; empty range is undefined", () => {
    assert.deepEqual(rangeFilter(1.5, 9.5, true), { gte: 2, lte: 9 });
    assert.deepEqual(rangeFilter(1.5, undefined), { gte: 1.5 });
    assert.equal(rangeFilter(undefined, undefined), undefined);
  });
});

describe("parseNumber (import prices and stock)", () => {
  test("thousands separators are not read as decimals", () => {
    assert.equal(parseNumber("125,000"), 125000);
    assert.equal(parseNumber("125.000"), 125000);
    assert.equal(parseNumber("1,250,000"), 1250000);
    assert.equal(parseNumber("1.250.000"), 1250000);
    assert.equal(parseNumber("12 500 000 so'm"), 12500000);
  });
  test("decimals in either notation", () => {
    assert.equal(parseNumber("12,5"), 12.5);
    assert.equal(parseNumber("12.50"), 12.5);
    assert.equal(parseNumber("0,500"), 0.5);
    assert.equal(parseNumber("1.250.000,50"), 1250000.5);
    assert.equal(parseNumber("1,250,000.50"), 1250000.5);
    assert.equal(parseNumber("$1,250.75"), 1250.75);
  });
  test("kW column keeps small decimals", () => {
    assert.equal(parseNumber("1,500", { groups: false }), 1.5);
    assert.equal(parseNumber("2,2", { groups: false }), 2.2);
    assert.equal(parseNumber("1.250.000", { groups: false }), 1250000);
  });
  test("malformed values are errors, not wrong numbers", () => {
    for (const bad of ["125.000.00", "1.250.000.00", "12.05.2026", "...", ",,,", "1.2.3,4", "1,25.5"]) assert.equal(parseNumber(bad), null, bad);
  });
  test("a numeric Excel cell keeps its value", () => {
    assert.equal(parseNumber(cellText(12.345)), 12.345);
    assert.equal(parseNumber(cellText(1.125)), 1.125);
    assert.equal(parseNumber(cellText(125000)), 125000);
    assert.equal(parseNumber(cellText(12.5)), 12.5);
    assert.equal(cellText(null), "");
  });
  test("empty and junk", () => {
    assert.equal(parseNumber(""), null);
    assert.equal(parseNumber(undefined), null);
    assert.equal(parseNumber("abc"), null);
  });
});

describe("absoluteUrl (structured data and Open Graph)", () => {
  test("site paths get the site address; uploaded photos keep their own address", () => {
    assert.equal(absoluteUrl("/product/x"), `${SITE_URL}/product/x`);
    assert.equal(absoluteUrl("/"), SITE_URL);
    const blob = "https://abc.public.blob.vercel-storage.com/products/g150.jpg";
    assert.equal(absoluteUrl(blob), blob);
  });
});

describe("formatSum", () => {
  test("digit groups never break; the currency may wrap to the next line", () => {
    assert.equal(formatSum(37500000, "ru"), "37\u00a0500\u00a0000 сум");
  });
});
