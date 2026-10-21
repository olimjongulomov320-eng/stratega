"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import type { NavGroup } from "./nav";

// Mobil (lg: gacha) uchun hamburger menyu — sidebar nav daraxtining
// aynan o'zini full-screen drawer ichida ko'rsatadi.
export function MobileNav({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Yo'l o'zgarganda drawer avtomatik yopiladi (render davomida moslashtirish).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menyuni ochish"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
      >
        <span className="text-lg leading-none">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/admin" className="flex items-center gap-2">
                <LogoMark className="h-7 w-7" />
                <span className="text-sm font-black tracking-tight text-white">
                  STRATEG<span className="text-indigo-400">A</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Menyuni yopish"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-6">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.title}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" &&
                          pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-indigo-600 text-white"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
