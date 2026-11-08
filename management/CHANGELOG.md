# Changelog

Local changes until deployed. "Deployed" is stated explicitly when it happens.

## 2026-11-04/08 — public pages cached (branch `claude/optimistic-ptolemy-64bcdc`, NOT deployed)

### Faster pages
- Home, product, category, direction, catalogue, spare-parts and info pages are static or ISR (one hour) instead of rendered per request. `next start` sends `s-maxage=3600`.
- URLs with filters, sorting, a page number or a search query still render per request, through an internal `/filtered` route (`src/lib/catalog-route.ts`). Visitors see no change in the URL. Ad tags (`utm_*`, `gclid`, `yclid`…) keep the cached page.

### Buyer prices
- "Your price" now loads in the browser from a new private route, `POST /api/buyer-prices`, and still goes into the cart. It never appears in cached HTML.
- It now shows on every product card (home, catalogue, search, spare parts, wishlist, recently viewed), not only on category, direction and product pages.
- The header shows "Shaxsiy kabinet" for logged-in buyers instead of their company name; the cabinet page still shows it.

### Fresh data
- `revalidateStorefront()` clears the cached pages after every write to public data. New: shipments going out, price-list saves, Telegram `/narx` and `/qoldiq`. It replaces the same call in product, category, review, photo and stock-document saves.
- `tests/storefront-cache.test.ts` lists every write path and fails on a new one that is not covered.

### Reliability
- A page rendered without menus during a database failure stays in the cache for one minute instead of one hour (D-13, D-24).
- Build workers use one database connection each (D-26).

### After the independent review (2026-11-08)
- Admin → Sozlamalar has a «Sahifalarni yangilash» button for changes made by scripts (README §11).
- Each save clears the cache right after its write, so a later error in the same save (for example the audit entry) no longer leaves pages stale (D-27).
- The guard test now checks every function that writes public data, any database client name and raw SQL on those tables.
- `filtered` routes are a 404 when opened directly instead of a duplicate page.
- More ad tags keep the cached page (`srsltid`, `gad_source`, `gad_campaignid`, `msclkid`, `_gl`, `ttclid`).
- `/api/buyer-prices` answers an empty or odd request body without an error.

## 2026-11-08 — specs from descriptions (NOT deployed)

- Product structured data and /llms.txt also use the spec paragraph of the description. On the live catalogue, 15 of 22 products go from 0–3 to 6–14 machine-readable specs.

## 2026-11-08 — SEO and AI visibility (deployed, merge commit 652719e)

- Sitemap always current; products listed only in the languages they have names in.
- Product structured data for every product, with specifications as properties.
- English product pages without an English name are `noindex`.
- `/llms.txt`: catalogue for AI assistants, built from live data.
- IndexNow: key file, daily submission of changed products (Vercel cron), `npm run indexnow` for a full submission.
- Shop opening hours and map link in the store's structured data.
- Layout error handling no longer swallows Next.js internal signals.
- Per-product status: `management/SEO_PRODUCTS.md`.

## 2026-11-04 — audit fixes (deployed to production, merge commit c31b729)

### Security and dependencies
- Next.js 16.2.10 → 16.4.4; semver-compatible `npm audit fix`.
- Response security headers added; `X-Powered-By` removed.
- Stricter validation of the post-login redirect.
- "Price on request" handled the same way on every public page and download.

### Sales and reliability
- Cart, one-click, quick-quote and login forms show a localized message with the phone number when sending fails.
- Branded error page with a working Retry, and branded 404 for unknown URLs. Pages that do not need the database keep working during an outage.
- Catalogue filters and pagination handle out-of-range values.
- Seller Telegram alerts capped at 20 item lines, so big carts still reach the sales chat.

### Phones and accessibility
- Product cards rebuilt for narrow phones: tighter spacing, one-line price and button, photo no longer covered, prices never split mid-number, long words wrap.
- Compare bar sits above the tab bar and is one row on phones; the chat button moves up while it is shown.
- Catalog and Language menus work with the keyboard; skip link added; closed chat panel left the tab order.
- No iOS zoom on small inputs. Desktop top bar stays on one line.

### SEO
- Product structured data: correct image URLs for uploaded photos, valid markup for price-on-request items, `BackOrder` for sold-to-order items.
- Missing pages get a "not found" title and `noindex`. Empty spare-parts page is `noindex` and out of the sitemap.
- Direction titles carry the brand when they fit; emoji moved out of H1; Russian FAQ plural and the "PE" acronym fixed.
- Below-the-fold home photos are no longer preloaded. Hero model count hidden below 50 models.

### Data safety and tooling
- Import number parsing: "125,000" = 125 000; the kW column keeps decimals; malformed values are rejected; numeric Excel cells keep their exact value. Also applies to Telegram `/narx` and `/qoldiq`.
- `npm run db:seed` refuses non-local databases.
- Editing an employee no longer clears their Telegram ID.
- `npm run typecheck` works on a fresh checkout. 14 new unit tests.

## 2026-11-01
- Added /management documentation. No application code changed.
