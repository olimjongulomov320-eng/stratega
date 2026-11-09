# QA Report

## 2026-11-08 — public page caching, after the independent review (branch `claude/optimistic-ptolemy-64bcdc`, NOT deployed)

An independent reviewer read the whole change and probed the local build: no blockers, one medium and several low findings. The fixes are in CHANGELOG ("After the independent review"). The branch was then rebased onto the deployed SEO change (7569877) and everything below was rerun from a clean build and a fresh copy of the database: 223 checks, all passing, no server errors; 64 unit tests. Since the SEO change the sitemap and `/llms.txt` are built per request, so they are not part of the page cache.

| Requirement (owner's request) | Result |
| --- | --- |
| Admin price edit appears after revalidation | A product shown on the home page and its category: product, category and home pages were cached with the old price; after the save all three rendered anew with the new price, then were cached again |
| Logged-in buyer sees own price, no one else's data in cached HTML | Buyers A and B each get only their own price and company from the private route (`private, no-store`); the cached page they receive is byte-identical to a guest's and holds neither |
| Missing product | HTTP 404 with `noindex` in uz/ru/en, also when served from cache |
| "Price on request" stays hidden | Stored price absent from the product page, its category page and the page data; left out of the buyer route even with a contract price |
| Write paths still covered after the reordering | 82 checks, all pass (list below) |
| Cache cleared only by a signed-in admin | An action call without an admin session leaves cached pages untouched |

Time to first byte on the local build (same machine as the database, median of 5):

| Page | Cached | Rendered anew after a save |
| --- | --- | --- |
| Product | 3.8 ms | 20.7 ms |
| Category | 4.8 ms | 32.6 ms |
| Home | 4.7 ms | 39.3 ms |
| `/about` | 3.1 ms | 18.6 ms |
| Category with a sort (always per request) | — | 14.1 ms |

These local times measure the render itself; on production, network and the US-East function region add to both columns (0.72 s per request and 0.43 s for the cached sitemap before this change). Measure again after deploy.

## 2026-11-04 — public page caching (first pass)

Environment: macOS, Node 23.10, Next.js 16.4.4 production build (`next start`), a throwaway copy of the local database with 957 products. Telegram went to a local mock. Nothing touched production.

| Check | Result |
| --- | --- |
| `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | PASS, 55 tests (17 new) |
| Guard test against a missed write path | Fails when a function stops clearing the cache, when a new file writes public data, and on raw SQL to those tables (all three tried, 2026-11-08) |
| `next build` route table | Storefront routes static or ISR; per request only `/filtered`, `/kabinet`, `/korzina-yuborildi` and the catch-all 404 |

| Area | Result |
| --- | --- |
| Cache headers on 19 URLs (uz/ru/en home, info, cart, product, category, direction, catalogue) | HIT, `s-maxage=3600`; sitemap HIT |
| Filters, sorting, paging, search | `private, no-store`, correct results; clicked through in a browser from a cached page, query kept across a language switch, no hydration errors |
| Ad tags on a category URL | Cached page |
| Missing product, category, direction, unknown URL (uz/ru/en) | HTTP 404 with `noindex`, also when served from cache |
| Logged-in buyers | Each sees only their own price and company in the browser; buyer without a price list, guest, invalid session and hint cookie alone get nothing; API sends `private, no-store` |
| Per-user data in cached HTML | None: buyers A and B receive byte-identical HTML to a guest |
| Cart | Takes the buyer's price from product page and card; one API call per page; none for guests |
| Login and logout | Real `verifyOtp` and `logout` actions set and clear both cookies; a session from before this change gets its hint without logging in again; switching buyer without a reload drops the old prices |
| "Price on request" | Stored price absent from the HTML and page data; stays out of the buyer route |
| Write paths against already-cached pages (82 checks) | All page types refreshed and the new value shown: product create, save, hide, delete; price change on another product's page; stock adjustment; category create, rename, delete; price-list saves; stock document created and posted; shipment shipped (READY rightly leaves pages cached); CSV import; review add and delete; photo upload; `/narx` and `/qoldiq` on both bots |
| Sitemap | Gains and loses products at once after a save |
| Database outage | Cached pages keep serving. Info page: HTTP 200 without menus, `s-maxage=60`, menus back after the minute. Uncached data page: HTTP 500 with the branded error page and Retry |
| Cached HTML | Real content inline, no skeleton (see D-8) |
| Phone width | Tab bar shows "Kirish" for guests and "Shaxsiy kabinet" when logged in; no sideways scroll |
| Time to first byte, local | Cached ≈ 2 ms; per-request search ≈ 22 ms. Local numbers say nothing about production |

### Not verified

- **Anything on Vercel:** the edge cache, purging through Vercel's cache and real time to first byte. Measure on a preview or after deploy; the 0.72 s and 0.43 s figures in CEO_AUDIT are still the baseline.
- The hourly time limit itself: on-demand refresh and the one-minute limit were tested, the full hour was not waited out.
- The new admin button was exercised as a server-action request and found on the settings page, not clicked in a browser.
- Admin saves were sent as the same server-action requests the forms send, not clicked through in the admin UI.
- A real SMS login: the code was inserted in the test database.
- Real Telegram delivery; photo upload to Vercel Blob.

## 2026-11-04 — live checks after deployment (merge commit c31b729)

Read-only requests and a browser on https://www.stratega.uz. No forms were submitted.

| Check | Result |
| --- | --- |
| Response headers on storefront, admin login and Mini App pages | Present; `X-Powered-By` gone; admin pages `noindex` |
| Out-of-range catalogue and search parameters (6 URLs) | HTTP 200 |
| Missing and unknown pages (5 URLs across languages) | HTTP 404 with `noindex`; branded page with header and footer in the browser |
| Price list and price filter | "Price on request" handled as designed |
| Structured data on 2 products | Valid for the on-request and the priced product |
| All 96 sitemap URLs, utility pages in 3 languages, static files | 118 checks, 0 failures |
| Guest access to the cabinet and admin | Redirected to login |
| Phone at 360 px | 8 cards: prices and buttons on one line, no cut titles, no sideways scroll; compare bar clear of all 5 tabs |
| Tablet at 768 px, desktop at 1024 px | No sideways scroll; top bar on one line; no broken images on the home page |
| Browser console | Only the 404 requested on purpose |

Timing could not be compared fairly: the connection from the test machine was slower that day (one request timed out), and readings varied from 0.85 to 1.9 s to first byte. Re-measure on a normal day.

**Confirmed by the owner on live:** Telegram Mini Apps and the admin barcode camera work.

**Not verified on live:** admin panel pages in a browser, real form submissions, Telegram alerts, SMS, AI chat, photo uploads, a real iPhone.

## 2026-11-04 — local verification of the audit fixes

Environment: macOS, Node 23.10, Next.js 16.4.4 production build (`next start`), local Postgres with 957 products. The live site was only read, never changed.

| Check | Result |
| --- | --- |
| `npm run typecheck` from a clean checkout | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS, 38/38 (14 new) |
| `npm run build` | PASS |
| `npm audit --omit=dev` | 0 critical |
| DB-backed stock tests (`npm run test:db`) | **NOT RUN** (needs a separate test database) |
| Lighthouse | **NOT RUN** (not available here) |

### Behaviour checks on the local production build

| Area | Result |
| --- | --- |
| Response headers | Present on storefront, admin and Mini App pages |
| Price list and price filter | "Price on request" items behave as designed: all 324 local on-request rows show the localized text |
| Catalogue with out-of-range filter values | HTTP 200 |
| Missing and unknown pages (uz/ru/en) | HTTP 404 with `noindex`; the browser shows the branded page with header and footer |
| Structured data | Valid for on-request and sold-to-order products; uploaded-photo URLs covered by a unit test |
| Phone cards at 360 px | Prices and buttons on one line, no cut titles, no sideways scroll |
| Compare bar at 360 px | Above the tab bar, all tabs tappable, chat button clear of it |
| Failed send (simulated network failure, nothing sent) | Button re-enabled, localized message with phone number |
| Database outage (second local server) | Data pages: HTTP 500 with branded page, header, footer, phone and Retry. Info pages keep working |
| Keyboard | Focus enters the menus, Escape closes and returns focus; skip link is the first focusable element |
| Sideways scroll at 360, 640, 768 and 1280 px | None |
| Route sweep: all public routes in uz/ru/en, 55 categories, 12 products, missing pages, feeds, Mini App pages | 273 checks, 0 unexpected |
| Guest access to the cabinet and admin | Redirected to the login pages |

### Independent review of the fixes

Two fresh reviewers went through the finished commits and found 8 problems in the first version of the new code. All are fixed and retested. Lesson: review your own fix as critically as the original code.

### Not verified

- Telegram Mini Apps under the new headers, the admin barcode camera, real Telegram alerts, SMS, chat and photo uploads: no credentials here. **Check these first after deploying.**
- Admin panel pages in a browser.
- The cart and one-click forms use the same error handling as the tested quick-quote form; only that form was exercised.
- The iOS zoom fix on a real iPhone.
- Photo layout for catalogue items whose photos are not served locally.

## 2026-11-01 — first pass

| Check | Result |
| --- | --- |
| tsc --noEmit | PASS |
| eslint | PASS |
| npm test | FAIL — esbuild crash in that environment (not reproduced on 2026-11-03) |
| Live site text fetch | Reported home 200, robots 404, sitemap 404 (the live site now serves robots and sitemap) |
