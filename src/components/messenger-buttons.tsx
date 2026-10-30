"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { COMPANY } from "@/lib/site";
import { TelegramIcon } from "@/components/social-icons";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1 2.7 11.6 11.6 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

/** Floating Telegram / WhatsApp buttons (bottom left; the chat assistant sits bottom right). */
export function MessengerButtons() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > Math.max(180, window.innerHeight * 0.8));
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  const items = [
    { href: process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || COMPANY.messengers.telegram, label: t.focus.writeTelegram, Icon: TelegramIcon, cls: "bg-sky-500 hover:bg-sky-400" },
    { href: COMPANY.messengers.whatsapp, label: t.focus.writeWhatsapp, Icon: WhatsAppIcon, cls: "bg-emerald-500 hover:bg-emerald-400" },
  ].filter((i) => i.href);
  const isHome = pathname === "/" || /^\/(uz|ru|en)\/?$/.test(pathname ?? "");
  if (items.length === 0 || !visible || isHome) return null;
  return (
    <div className="fixed bottom-20 left-4 z-40 flex flex-col gap-2 sm:bottom-5 sm:left-5">
      {items.map(({ href, label, Icon, cls }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105 ${cls}`}
        >
          <Icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  );
}
