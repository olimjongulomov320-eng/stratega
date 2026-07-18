import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth";

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
  const [categories, currentUser] = await Promise.all([
    getCategories(),
    getCurrentUser(),
  ]);
  const headerCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    productCount: c._count.products,
  }));
  const headerUser = currentUser
    ? { phone: currentUser.phone, companyName: currentUser.companyName }
    : null;

  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-800">
        <Providers>
          <Header categories={headerCategories} user={headerUser} />
          <main className="flex-1">{children}</main>
          <Footer categories={headerCategories} />
        </Providers>
      </body>
    </html>
  );
}
