"use client";

import { RfqProvider } from "@/lib/rfq-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CompareProvider } from "@/lib/compare-context";
import { RecentlyViewedProvider } from "@/lib/recently-viewed-context";
import { CompareBar } from "@/components/compare-bar";
import { QuickViewProvider } from "@/lib/quick-view-context";
import { QuickViewModal } from "@/components/quick-view-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RfqProvider>
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
    </RfqProvider>
  );
}
