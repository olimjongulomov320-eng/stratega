import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Boshqaruv paneli — Stratega", template: "%s — Stratega admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
