import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stratega — elektr shtabelerlar va gidravlik telejkalar",
  description:
    "Stratega — elektr shtabelerlar va gidravlik telejkalarni (rohlyalarni) kafolat bilan qulay narxlarda onlayn buyurtma qiling.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        {children}
      </body>
    </html>
  );
}
