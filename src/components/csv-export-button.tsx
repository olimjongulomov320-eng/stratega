"use client";

import { useState } from "react";

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(header: string[], rows: string[][]): string {
  const lines = [header.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}

export function CsvExportButton({
  filename,
  header,
  rows,
  label = "CSV yuklab olish",
}: {
  filename: string;
  header: string[];
  rows: string[][];
  label?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  function handleExport() {
    setDownloading(true);
    try {
      const csv = "﻿" + buildCsv(header, rows); // BOM — Excel'da o'zbekcha harflar to'g'ri chiqishi uchun
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `${filename}-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-150 hover:scale-105 hover:bg-slate-50 disabled:opacity-50"
    >
      {downloading ? "Tayyorlanmoqda..." : label}
    </button>
  );
}
