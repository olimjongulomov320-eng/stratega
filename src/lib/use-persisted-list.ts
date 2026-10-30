"use client";

import { useCallback, useEffect, useState } from "react";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Generic hook for a list persisted to localStorage, hydrated after mount
// (SSR has no access to localStorage, so initial state is always the fallback).
export function usePersistedList<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStored(key, []));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [items, hydrated, key]);

  const set = useCallback((next: T[] | ((prev: T[]) => T[])) => {
    setItems(next);
  }, []);

  return [items, set] as const;
}
