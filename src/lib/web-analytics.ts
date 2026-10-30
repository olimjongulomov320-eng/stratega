// Web analytics: Yandex Metrica and Google Analytics 4.
// Both are off until their IDs are set in the environment (NEXT_PUBLIC_YM_ID, NEXT_PUBLIC_GA_ID).

/** Conversion goals. Create goals with the same names in Metrica ("JavaScript event") and mark them as key events in GA4. */
export type Goal =
  | "quick_rfq_sent" // home page quick quote form sent
  | "cart_rfq_sent" // cart (specification) request sent
  | "add_to_cart"
  | "phone_click"
  | "telegram_click"
  | "whatsapp_click"
  | "chat_open";

// Validated so the IDs can be placed in an inline script safely.
const rawYm = process.env.NEXT_PUBLIC_YM_ID ?? "";
const rawGa = process.env.NEXT_PUBLIC_GA_ID ?? "";
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

/** Metrica page view for client-side navigation (init uses defer: true, so every view is sent from here). */
export function trackPageView(url: string, referer?: string) {
  if (typeof window === "undefined" || !YM_ID) return;
  const w = window as Win;
  try {
    w.ym?.(YM_ID, "hit", url, referer ? { referer } : undefined);
  } catch {
    // ignore
  }
}
