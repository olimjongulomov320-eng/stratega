"use client";

import { useLoginHint } from "@/lib/buyer-prices-context";

/** Content for guests on a cached page: it is in the HTML, and a logged-in visitor's browser hides it. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  return useLoginHint() ? null : children;
}
