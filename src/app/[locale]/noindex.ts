import type { Metadata } from "next";

/** Utility pages (cart, account, compare…) must not be indexed. */
export const NOINDEX: Metadata = { robots: { index: false, follow: false } };
