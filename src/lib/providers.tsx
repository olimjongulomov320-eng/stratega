"use client";

import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CompareProvider } from "@/lib/compare-context";
import { RecentlyViewedProvider } from "@/lib/recently-viewed-context";
import { CompareBar } from "@/components/compare-bar";
import { QuickViewProvider } from "@/lib/quick-view-context";
import { QuickViewModal } from "@/components/quick-view-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CompareProvider>
          <RecentlyViewedProvider>
            <QuickViewProvider>
              {children}
              <CompareBar />
              <QuickViewModal />
            </QuickViewProvider>
          </RecentlyViewedProvider>
        </CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
