// Web analytics: Yandex Metrica and Google Analytics 4.
// On for the live domain with the counters below; NEXT_PUBLIC_YM_ID / NEXT_PUBLIC_GA_ID override them.

/** Conversion goals. Create goals with the same names in Metrica ("JavaScript event") and mark them as key events in GA4. */
export type Goal =
  | "quick_rfq_sent" // home page quick quote form sent
  | "cart_rfq_sent" // cart (specification) request sent
  | "add_to_cart"
  | "phone_click"
  | "telegram_click"
  | "whatsapp_click"
  | "chat_open"
  | "callback_sent" // "Request a call" form sent
  | "one_click_sent"; // "Buy in 1 click" form sent

// The live site's counters. These IDs are public (every visitor's browser sees them), so they live in code.
// They are used only on the live domain (see LIVE_HOST), so local runs and preview deployments send nothing.
// Setting NEXT_PUBLIC_YM_ID / NEXT_PUBLIC_GA_ID overrides them and works on any host.
const DEFAULT_YM_ID = "114222888";
const DEFAULT_GA_ID = "G-1YJXQ5XMV7";
const envYm = process.env.NEXT_PUBLIC_YM_ID || "";
const envGa = process.env.NEXT_PUBLIC_GA_ID || "";
/** True when the counters come from the environment, so they are not limited to the live domain. */
export const ANALYTICS_FROM_ENV = Boolean(envYm || envGa);
/** stratega.uz and www.stratega.uz. */
export const LIVE_HOST = /(^|\.)stratega\.uz$/;

// Validated so the IDs can be placed in an inline script safely.
const rawYm = ANALYTICS_FROM_ENV ? envYm : DEFAULT_YM_ID;
const rawGa = ANALYTICS_FROM_ENV ? envGa : DEFAULT_GA_ID;
export const YM_ID = /^\d{5,12}$/.test(rawYm) ? Number(rawYm) : null;
export const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(rawGa) ? rawGa : null;
/** Metrica session recordings (Webvisor). Off unless NEXT_PUBLIC_YM_WEBVISOR=1. */
export const YM_WEBVISOR = process.env.NEXT_PUBLIC_YM_WEBVISOR === "1";

type Win = Window & { ym?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };

export function trackGoal(goal: Goal, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  try {
    if (YM_ID && w.ym) w.ym(YM_ID, "reachGoal", goal, params);
    if (GA_ID && w.gtag) w.gtag("event", goal, params ?? {});
  } catch {
    // Analytics must never break the page.
  }
}

/** Metrica page view for client-side navigation (the first page is counted by init). */
export function trackPageView(url: string, referer?: string) {
  if (typeof window === "undefined" || !YM_ID) return;
  const w = window as Win;
  try {
    w.ym?.(YM_ID, "hit", url, referer ? { referer } : undefined);
  } catch {
    // ignore
  }
}
