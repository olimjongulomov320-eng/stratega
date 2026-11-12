import "server-only";
import { revalidatePath, unstable_cache } from "next/cache";

/**
 * Public pages are cached (the [locale] layout sets how long). Call this after every write that changes what a
 * visitor can see: price, stock, catalogue data, reviews. Call it also when the save reports an error, since part of
 * it may already be committed. tests/storefront-cache.test.ts fails on a function that writes such data without it.
 *
 * It clears the whole site on purpose. One product's price also shows on other products' pages (related items,
 * spare parts), its category and direction, the home page, page titles and the category's "from" price, and those
 * lists change as the data changes, so working out the affected pages would be how a stale price gets missed.
 *
 * Never throws: the data is already saved, and outside a Next.js request (the `telegram:dev` poller, scripts) there
 * is nothing to clear, so pages catch up when their cache time runs out.
 */
export function revalidateStorefront() {
  try {
    // Every cached page carries the root layout tag, so this one call clears them all. The sitemap is outside the
    // layout and cached on its own; /llms.txt is built per request (CDN-cached for an hour).
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  } catch (error) {
    console.warn("Storefront cache not cleared", error instanceof Error ? error.message : error);
  }
}

/**
 * Keeps the page being rendered in the cache for a short time only: for a page rendered with fallback content.
 * Next.js has no direct call for this, but a page is cached no longer than the shortest unstable_cache inside it.
 */
export async function shortenPageCache(seconds = 60) {
  await unstable_cache(async () => true, ["shorten-page-cache"], { revalidate: seconds })().catch(() => undefined);
}
