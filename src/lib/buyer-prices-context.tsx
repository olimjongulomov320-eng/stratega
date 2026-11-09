"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { LOGIN_HINT_COOKIE } from "@/lib/login-hint";

// Public pages are cached and show the guest price. A logged-in buyer's own prices are fetched here, in the browser,
// from a private route, so they never become part of a cached page.

const MAX_IDS_PER_REQUEST = 100;

function readLoginHint(): string | null {
  const prefix = `${LOGIN_HINT_COOKIE}=`;
  const row = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

const neverChanges = () => () => {};

/**
 * The login hint cookie, or null for a guest. Null while the page hydrates, then the real value, so cached HTML
 * always matches. Cookies have no change event; re-rendering on navigation picks up a login or logout.
 */
export function useLoginHint(): string | null {
  usePathname();
  return useSyncExternalStore(neverChanges, readLoginHint, () => null);
}

type BuyerPrices = { hint: string; companyName: string | null; prices: Record<string, number> };

type BuyerPricesContextValue = {
  data: BuyerPrices | null;
  request: (productId: string) => void;
  settledPrices: () => Promise<Record<string, number>>;
};

const BuyerPricesContext = createContext<BuyerPricesContextValue | null>(null);

async function fetchBuyerPrices(ids: string[]): Promise<{ companyName?: string; prices?: Record<string, number> }> {
  const res = await fetch("/api/buyer-prices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ids }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Buyer prices: HTTP ${res.status}`);
  return res.json();
}

export function BuyerPricesProvider({ children }: { children: React.ReactNode }) {
  const hint = useLoginHint();
  const [loaded, setLoaded] = useState<BuyerPrices | null>(null);
  const activeHint = useRef<string | null>(null);
  const wanted = useRef(new Set<string>());
  const asked = useRef(new Set<string>());
  const latest = useRef<Record<string, number>>({});
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(() => {
    const forHint = activeHint.current;
    if (!forHint) return;
    const ids = [...wanted.current].filter((id) => !asked.current.has(id));
    for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
      const batch = ids.slice(i, i + MAX_IDS_PER_REQUEST);
      batch.forEach((id) => asked.current.add(id));
      const run = fetchBuyerPrices(batch)
        .then((res) => {
          // An answer for a login that has since ended must not reach the next buyer.
          if (activeHint.current !== forHint) return;
          latest.current = { ...latest.current, ...res.prices };
          setLoaded({ hint: forHint, companyName: res.companyName ?? null, prices: latest.current });
        })
        .catch(() => {
          // The guest price stays on screen; the next page that shows this product asks again.
          batch.forEach((id) => asked.current.delete(id));
        });
      pending.current = Promise.all([pending.current, run]);
    }
  }, []);

  useEffect(() => {
    activeHint.current = hint;
    asked.current.clear();
    latest.current = {};
    load();
  }, [hint, load]);

  const request = useCallback(
    (productId: string) => {
      wanted.current.add(productId);
      // One request for all the cards on a page.
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 0);
    },
    [load]
  );

  const settledPrices = useCallback(async () => {
    load();
    await pending.current;
    return latest.current;
  }, [load]);

  const data = loaded?.hint === hint ? loaded : null;
  const value = useMemo(() => ({ data, request, settledPrices }), [data, request, settledPrices]);
  return <BuyerPricesContext.Provider value={value}>{children}</BuyerPricesContext.Provider>;
}

/**
 * The logged-in buyer's own price for a product (null for guests, and on "price on request" items).
 * `cartPrice` waits for a request still in flight, so a quick click doesn't put the guest price in the cart.
 */
export function useBuyerPrice(product: { id: string; price: number; priceOnRequest: boolean }) {
  const ctx = useContext(BuyerPricesContext);
  if (!ctx) throw new Error("useBuyerPrice must be used within BuyerPricesProvider");
  const { data, request, settledPrices } = ctx;
  const { id, price, priceOnRequest } = product;

  useEffect(() => {
    if (!priceOnRequest) request(id);
  }, [id, priceOnRequest, request]);

  const cartPrice = useCallback(async () => {
    if (priceOnRequest) return price;
    return (await settledPrices())[id] ?? price;
  }, [id, price, priceOnRequest, settledPrices]);

  return { buyerPrice: priceOnRequest ? null : (data?.prices[id] ?? null), companyName: data?.companyName ?? null, cartPrice };
}
