// Test ma'lumotlarini tozalash: `__test__` prefiksli barcha yozuvlar,
// testlar yaratgan hujjatlar/harakatlar va ularga tegishli audit yozuvlari
// o'chiriladi.
//
// Ishlatish:
//   npx tsx scripts/cleanup-test-data.ts           # dry-run (faqat ko'rsatadi)
//   npx tsx scripts/cleanup-test-data.ts --apply   # haqiqiy o'chirish
//
// Xavfsizlik: har bir SELECT va DELETE bitta tranzaksiyada bajariladi;
// xatolik bo'lsa — rollback. AuditLog'dagi "dangling" yozuvlar (jadvada
// mavjud bo'lmagan entity'ga tegishli) testlar yaratgan yozuvlarni tozalaydi.

import "dotenv/config";
import { Client } from "pg";

const APPLY = process.argv.includes("--apply");
const PREFIX = "__test__%";

// AuditLog.entity -> jadval nomi (nom bo'yicha tekshiriladi).
const AUDIT_TABLES: Record<string, string> = {
  Order: "Order",
  StockDocument: "StockDocument",
  Shipment: "Shipment",
  Quotation: "Quotation",
  Customer: "Customer",
  Payment: "Payment",
  Product: "Product",
  Employee: "Employee",
  Warehouse: "Warehouse",
  Supplier: "Supplier",
  Category: "Category",
  PriceList: "PriceList",
  StockMove: "StockMove",
  RfqRequest: "RfqRequest",
  User: "User",
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    statement_timeout: 60_000,
  });
  await client.connect();
  const q = async <T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T[]> => (await client.query(sql, params)).rows as T[];

  const report: Record<string, number> = {};
  const count = async (label: string, sql: string, params: unknown[] = []) => {
    const rows = await q<{ n: number }>(sql, params);
    report[label] = rows[0]?.n ?? 0;
  };

  const testWarehouseIds = (
    await q<{ id: string }>(`select id from "Warehouse" where name like $1`, [PREFIX])
  ).map((r) => r.id);
  const testEmployeeIds = (
    await q<{ id: string }>(
      `select id from "Employee" where name like $1 or email like $1`,
      [PREFIX]
    )
  ).map((r) => r.id);
  const testSupplierIds = (
    await q<{ id: string }>(`select id from "Supplier" where name like $1`, [PREFIX])
  ).map((r) => r.id);

  // --- Tekshiruv (dry-run hisobi) ---
  await count(
    "StockDocument (test omborlardan)",
    `select count(*)::int n from "StockDocument" where "warehouseId" = any($1::text[])`,
    [testWarehouseIds]
  );
  await count(
    "StockDocumentItem (test hujjatlardan)",
    `select count(*)::int n from "StockDocumentItem" where "documentId" in (select id from "StockDocument" where "warehouseId" = any($1::text[]))`,
    [testWarehouseIds]
  );
  await count(
    "StockMove (test omborlardan)",
    `select count(*)::int n from "StockMove" where "warehouseId" = any($1::text[])`,
    [testWarehouseIds]
  );
  await count(
    "Stock (test omborlardan)",
    `select count(*)::int n from "Stock" where "warehouseId" = any($1::text[])`,
    [testWarehouseIds]
  );
  await count(
    "EmployeeSession (test xodimlardan)",
    `select count(*)::int n from "EmployeeSession" where "employeeId" = any($1::text[])`,
    [testEmployeeIds]
  );
  await count(
    "SupplierProduct (test supplierlardan)",
    `select count(*)::int n from "SupplierProduct" where "supplierId" = any($1::text[])`,
    [testSupplierIds]
  );

  const prefixed: [string, string, string][] = [
    ["Employee", "name", "Xodimlar"],
    ["Warehouse", "name", "Omborlar"],
    ["Supplier", "name", "Yetkazib beruvchilar"],
    ["Product", "name", "Mahsulotlar"],
    ["Category", "name", "Kategoriyalar"],
    ["Customer", '"companyName"', "Mijozlar"],
  ];
  for (const [table, col, label] of prefixed) {
    await count(
      `${label} (${table})`,
      `select count(*)::int n from "${table}" where ${col} like $1`,
      [PREFIX]
    );
  }

  // "Dangling" audit yozuvlari — entity jadvada mavjud emas (test yozuvlari).
  const danglingClauses: string[] = [];
  for (const [entity, table] of Object.entries(AUDIT_TABLES)) {
    danglingClauses.push(
      `(a.entity = '${entity}' and not exists (select 1 from "${table}" t where t.id = a."entityId"))`
    );
  }
  await count(
    "AuditLog (dangling — test yozuvlari)",
    `select count(*)::int n from "AuditLog" a where ${danglingClauses.join(" or ")}`
  );
  await count(
    "Alert (o'chirilgan mahsulotlar uchun)",
    `select count(*)::int n from "Alert" al where al.entity = 'Product' and not exists (select 1 from "Product" p where p.id = al."entityId")`
  );

  console.log(`\n=== TEST MA'LUMOTLARI (${APPLY ? "O'CHIRILADI" : "DRY-RUN"}) ===`);
  for (const [k, v] of Object.entries(report)) {
    if (v > 0) console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  const total = Object.values(report).reduce((a, b) => a + b, 0);
  console.log(`  ${String(total).padStart(5)}  JAMI\n`);

  if (!APPLY) {
    console.log("Haqiqiy o'chirish uchun: npx tsx scripts/cleanup-test-data.ts --apply\n");
    await client.end();
    return;
  }

  await client.query("begin");
  try {
    // 1. Bog'liq yozuvlar.
    await client.query(
      `delete from "StockDocumentItem" where "documentId" in (select id from "StockDocument" where "warehouseId" = any($1::text[]))`,
      [testWarehouseIds]
    );
    await client.query(
      `delete from "StockDocument" where "warehouseId" = any($1::text[])`,
      [testWarehouseIds]
    );
    await client.query(
      `delete from "StockMove" where "warehouseId" = any($1::text[])`,
      [testWarehouseIds]
    );
    await client.query(
      `delete from "Stock" where "warehouseId" = any($1::text[])`,
      [testWarehouseIds]
    );
    await client.query(
      `delete from "EmployeeSession" where "employeeId" = any($1::text[])`,
      [testEmployeeIds]
    );
    await client.query(
      `delete from "SupplierProduct" where "supplierId" = any($1::text[])`,
      [testSupplierIds]
    );
    await client.query(`delete from "AuditLog" where "actorId" = any($1::text[])`, [
      testEmployeeIds,
    ]);
    await client.query(`delete from "AuditLog" where "actorLabel" like $1`, [PREFIX]);

    // 2. Prefiksli asosiy yozuvlar.
    for (const [table, col] of prefixed) {
      await client.query(`delete from "${table}" where ${col} like $1`, [PREFIX]);
    }

    // 3. Entity yo'qolgan audit yozuvlari (testlar yaratgan).
    await client.query(
      `delete from "AuditLog" a where ${danglingClauses.join(" or ")}`
    );

    // 4. O'chirilgan mahsulotlar uchun alertlar.
    await client.query(
      `delete from "Alert" al where al.entity = 'Product' and not exists (select 1 from "Product" p where p.id = al."entityId")`
    );

    await client.query("commit");
    console.log("✅ Test ma'lumotlari o'chirildi.\n");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }

  await client.end();
}

main().catch((err) => {
  console.error("❌ Xatolik:", err instanceof Error ? err.message : err);
  process.exit(1);
});
