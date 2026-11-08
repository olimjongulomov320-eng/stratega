// Catalogue pages have two routes. The plain URL is cached (ISR); a URL with filters, sorting, paging or a search
// query has endless variants, so the proxy sends it to the `filtered` route, which renders per request.

const CATALOG_PAGE = /^\/(category\/[^/]+|search|ehtiyot-qismlar)$/;

// Ad and analytics tags don't change what the page shows, so visitors from a campaign still get the cached page.
// Anything else counts as a filter: an unknown parameter costs one uncached render, never a wrong page.
const NOT_A_FILTER = /^(utm_\w+|gclid|gbraid|wbraid|gad_source|gad_campaignid|srsltid|fbclid|msclkid|ttclid|yclid|ysclid|_openstat|_gl|_rsc)$/;

/** Set by the proxy on its rewrites to a `filtered` route; without it those routes are a 404, so they can't be opened directly. */
export const FILTERED_REWRITE_HEADER = "x-stratega-filtered";

/** The internal path for a catalogue URL with filters ("/search?q=x" → "/search/filtered"); null when the cached page applies. */
export function filteredCatalogPath(pathname: string, params: URLSearchParams): string | null {
  if (!CATALOG_PAGE.test(pathname)) return null;
  for (const key of params.keys()) {
    if (!NOT_A_FILTER.test(key)) return `${pathname}/filtered`;
  }
  return null;
}
