"use client";

import { useEffect, useState } from "react";
import { telegramWebApp } from "../telegram";

/** Admin Mini App: signs in with the Telegram account, then opens the regular admin panel. */
export default function TelegramAdminEntry() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const app = telegramWebApp();
    if (!app) {
      // Rendering an error from an effect is fine here: it only runs once, outside Telegram.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Bu sahifa Telegram ichida ochiladi: botdagi «Admin panel» tugmasini bosing. Brauzerda — /admin/login.");
      return;
    }
    app.ready();
    app.expand();
    fetch("/api/telegram/webapp-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initData: app.initData }) })
      .then(async (r) => {
        if (r.ok) return window.location.replace("/admin");
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Kirish amalga oshmadi.");
      })
      .catch(() => setError("Aloqa xatoligi. Qayta urinib ko'ring."));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-black">
        STRATEG<span className="text-indigo-600">A</span> · Admin
      </p>
      {error ? <p className="max-w-sm rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : <p className="text-sm text-slate-500">Telegram orqali kirilmoqda…</p>}
    </main>
  );
}
