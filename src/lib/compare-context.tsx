"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePersistedList } from "@/lib/use-persisted-list";

const MAX_COMPARE = 4;

export type CompareEntry = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

type CompareContextValue = {
  items: CompareEntry[];
  isComparing: (productId: string) => boolean;
  toggle: (entry: CompareEntry) => boolean; // returns false if list was full
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  maxReached: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "stratega-compare";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = usePersistedList<CompareEntry>(STORAGE_KEY);

  const toggle = useCallback(
    (entry: CompareEntry) => {
      let added = true;
      setItems((prev) => {
        if (prev.some((i) => i.id === entry.id)) {
          return prev.filter((i) => i.id !== entry.id);
        }
        if (prev.length >= MAX_COMPARE) {
          added = false;
          return prev;
        }
        return [...prev, entry];
      });
      return added;
    },
    [setItems]
  );

  const remove = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== productId));
    },
    [setItems]
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const isComparing = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isComparing,
      toggle,
      remove,
      clear,
      count: items.length,
      maxReached: items.length >= MAX_COMPARE,
    }),
    [items, isComparing, toggle, remove, clear]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export { MAX_COMPARE };
