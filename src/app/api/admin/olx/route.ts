import writeXlsxFile from "write-excel-file/node";
import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { getOlxSettings, buildOlxRows, OLX_COLUMNS } from "@/lib/olx";

export const runtime = "nodejs";

/** OLX adverts as .xlsx (default) or .csv — one row per product. */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "products.read")) return new Response("Unauthorized", { status: 401 });
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const { rows } = await buildOlxRows(await getOlxSettings());
  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const esc = (v: string | number) => {
      const s = String(v);
      const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
      return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const body = "﻿" + [OLX_COLUMNS.map((c) => c.header), ...rows.map((r) => OLX_COLUMNS.map((c) => c.value(r)))].map((r) => r.map(esc).join(",")).join("\n");
    return new Response(body, {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="stratega-olx-${date}.csv"` },
    });
  }

  const data = [
    OLX_COLUMNS.map((c) => ({ value: c.header, fontWeight: "bold" as const })),
    ...rows.map((r) => OLX_COLUMNS.map((c) => ({ value: c.value(r), wrap: c.key === "description" }))),
  ];
  const buffer = await writeXlsxFile(data, {
    sheet: "OLX",
    columns: OLX_COLUMNS.map((c) => ({ width: c.key === "description" ? 60 : c.key === "title" ? 45 : c.key.startsWith("photo") || c.key === "url" ? 30 : 16 })),
    stickyRowsCount: 1,
  }).toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="stratega-olx-${date}.xlsx"`,
    },
  });
}
