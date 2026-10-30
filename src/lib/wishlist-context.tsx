"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePersistedList } from "@/lib/use-persisted-list";

type WishlistContextValue = {
  productIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "stratega-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = usePersistedList<string>(STORAGE_KEY);

  const toggle = useCallback(
    (productId: string) => {
      setProductIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );
    },
    [setProductIds]
  );

  const isWishlisted = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds]
  );

  const value = useMemo(
    () => ({ productIds, isWishlisted, toggle, count: productIds.length }),
    [productIds, isWishlisted, toggle]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
