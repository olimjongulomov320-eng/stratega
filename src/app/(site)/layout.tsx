import { Providers } from "@/lib/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth";
import { ChatWidget } from "@/components/chat-widget";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex min-h-full flex-1 flex-col pb-16 sm:pb-0">
      <Providers>
        <Header categories={headerCategories} user={headerUser} />
        <main className="flex-1">{children}</main>
        <Footer categories={headerCategories} />
        <ChatWidget />
        <MobileTabBar user={headerUser} />
      </Providers>
    </div>
  );
}
