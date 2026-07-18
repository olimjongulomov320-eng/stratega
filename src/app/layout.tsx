import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/categories";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stratega — qurilish va sanoat texnikasi",
  description:
    "Stratega — qurilish texnikasi, gidravlik uskunalar, klining va bog' texnikasini qulay narxlarda onlayn buyurtma qiling.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  const headerCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    productCount: c._count.products,
  }));

  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        <Providers>
          <Header categories={headerCategories} />
          <main className="flex-1">{children}</main>
          <Footer categories={headerCategories} />
        </Providers>
      </body>
    </html>
  );
}
