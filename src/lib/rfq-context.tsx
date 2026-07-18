"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type RfqItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type RfqContextValue = {
  items: RfqItem[];
  addItem: (item: Omit<RfqItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const RfqContext = createContext<RfqContextValue | null>(null);
const STORAGE_KEY = "stratega-rfq";

function readStoredRfq(): RfqItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function RfqProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RfqItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage is only possible after mount (no SSR access),
    // so this one-time hydration must set state from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStoredRfq());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<RfqItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQuantity,
      clear,
      totalItems,
      totalPrice,
    }),
    [items, addItem, removeItem, setQuantity, clear, totalItems, totalPrice]
  );

  return <RfqContext.Provider value={value}>{children}</RfqContext.Provider>;
}

export function useRfq() {
  const ctx = useContext(RfqContext);
  if (!ctx) throw new Error("useRfq must be used within RfqProvider");
  return ctx;
}
