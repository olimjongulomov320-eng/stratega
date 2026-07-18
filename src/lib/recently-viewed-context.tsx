"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePersistedList } from "@/lib/use-persisted-list";

const MAX_RECENT = 12;

type RecentlyViewedContextValue = {
  productIds: string[];
  track: (productId: string) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(
  null
);
const STORAGE_KEY = "stratega-recently-viewed";

export function RecentlyViewedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [productIds, setProductIds] = usePersistedList<string>(STORAGE_KEY);

  const track = useCallback(
    (productId: string) => {
      setProductIds((prev) => {
        const withoutCurrent = prev.filter((id) => id !== productId);
        return [productId, ...withoutCurrent].slice(0, MAX_RECENT);
      });
    },
    [setProductIds]
  );

  const value = useMemo(() => ({ productIds, track }), [productIds, track]);

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx)
    throw new Error(
      "useRecentlyViewed must be used within RecentlyViewedProvider"
    );
  return ctx;
}
