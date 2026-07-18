"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";

export function TrackView({ productId }: { productId: string }) {
  const { track } = useRecentlyViewed();

  useEffect(() => {
    track(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
