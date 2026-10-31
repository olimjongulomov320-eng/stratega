"use client";

import { useEffect } from "react";
import { telegramWebApp } from "../telegram";

/** Shop Mini App: opens the normal stratega.uz catalogue in the user's Telegram language. */
export default function TelegramShopEntry() {
  useEffect(() => {
    const app = telegramWebApp();
    app?.ready();
    app?.expand();
    const lang = app?.initDataUnsafe?.user?.language_code?.toLowerCase() ?? "";
    const path = lang.startsWith("ru") ? "/ru" : lang.startsWith("en") ? "/en" : "/";
    window.location.replace(`${path}?utm_source=telegram&utm_medium=mini_app`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-lg font-black">
        STRATEG<span className="text-indigo-600">A</span>
      </p>
    </main>
  );
}
