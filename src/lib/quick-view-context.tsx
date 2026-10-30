"use client";

import { createContext, useContext, useState } from "react";

type QuickViewContextValue = {
  openProductSlug: string | null;
  open: (slug: string) => void;
  close: () => void;
};

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [openProductSlug, setOpenProductSlug] = useState<string | null>(null);

  return (
    <QuickViewContext.Provider
      value={{
        openProductSlug,
        open: setOpenProductSlug,
        close: () => setOpenProductSlug(null),
      }}
    >
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error("useQuickView must be used within QuickViewProvider");
  return ctx;
}
