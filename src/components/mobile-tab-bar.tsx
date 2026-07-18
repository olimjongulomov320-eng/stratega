"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRfq } from "@/lib/rfq-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { HeaderUser } from "@/components/header";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CatalogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
    </svg>
  );
}

export function MobileTabBar({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const { totalItems } = useRfq();
  const { count: wishlistCount } = useWishlist();

  const tabs = [
    { href: "/", label: "Bosh sahifa", icon: "home" as const, match: (p: string) => p === "/" },
    { href: "/search", label: "Katalog", icon: "catalog" as const, match: (p: string) => p.startsWith("/search") || p.startsWith("/category") },
    { href: "/korzina", label: "Korzina", icon: "cart" as const, match: (p: string) => p.startsWith("/korzina"), badge: totalItems },
    { href: "/wishlist", label: "Sevimli", icon: "heart" as const, match: (p: string) => p.startsWith("/wishlist"), badge: wishlistCount },
    {
      href: user ? "/kabinet" : "/kirish",
      label: user ? "Kabinet" : "Kirish",
      icon: "user" as const,
      match: (p: string) => p.startsWith("/kabinet") || p.startsWith("/kirish"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const iconClass = `h-5.5 w-5.5 transition-transform ${active ? "scale-110" : ""}`;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              active ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <span className="relative">
              {tab.icon === "home" && <HomeIcon className={iconClass} />}
              {tab.icon === "catalog" && <CatalogIcon className={iconClass} />}
              {tab.icon === "cart" && <CartIcon className={iconClass} />}
              {tab.icon === "heart" && <HeartIcon className={iconClass} filled={active} />}
              {tab.icon === "user" && <UserIcon className={iconClass} />}
              {!!tab.badge && tab.badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
