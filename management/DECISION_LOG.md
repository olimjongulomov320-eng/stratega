# Decision log

- 2026-11-01: Pushed v2 to branch `v2-improved` only. Owner chose to keep `main` (CyberQalqon) untouched. No force-push.
- 2026-11-01: No production deploy or DB migration without explicit approval + backup.

## 2026-11-04

Numbers are not continuous: some decisions are recorded privately (D-14).

- **D-1 Work on top of GitHub `main` (4effeee).** The local copy was 4 commits behind; the branch was fast-forwarded, nothing rewritten on GitHub.
- **D-2 Next.js 16.2.10 → 16.4.4** (same major), plus semver-compatible `npm audit fix` only.
- **D-3 Framing rules use CSP `frame-ancestors`, not X-Frame-Options.** Telegram Web frames the Mini Apps, which then navigate to the storefront and `/admin` inside the frame; Yandex Metrica frames pages for replay. `Permissions-Policy` keeps `camera=(self)` because admin scans barcodes with the phone camera.
- **D-4 "Price on request" means no public price anywhere.** The Excel price list shows the localized text for those products and price filters skip them. A buyer's own contract price is still shown to that buyer.
- **D-5 Hero model count hidden below 50 models.** It appears again automatically once the full catalogue is imported.
- **D-6 Structured data:** no Product node for price-on-request items without reviews, because Google rejects a Product with no offer, review or rating. Stock-0 items are `BackOrder`, because they are imported to order. Internal SKU is no longer sent as `mpn`.
- **D-7 Number parsing in imports:** a single `,` or `.` before exactly three digits is a thousands separator ("125,000" = 125 000). "0,500" and "12,5" stay decimals; numeric Excel cells are never treated as grouped, and malformed values are rejected. The kW column keeps decimals.
- **D-8 No `loading.tsx` on product and category pages (revisited 2026-11-04, still no).** The original reason no longer holds: on the cached routes a missing product stays HTTP 404 with a loading boundary, measured uncached and cached. But the boundary makes the skeleton the first HTML of every cached page, with the real content in a hidden block swapped in by script, and on a missing product the visible HTML is the skeleton. That is worse for first paint and for crawlers, and cached pages with link prefetch already open quickly. A boundary on a category page would also wrap the per-request `/filtered` route, where it would bring the old soft-404 problem back.
- **D-10 Catch-all route for unknown URLs.** Costs a function call per junk URL; accepted so visitors get a branded 404 with navigation.
- **D-13 Layout queries fail soft.** If the database is down the menus are empty but the page still renders, so `error.tsx` can show contacts and info pages keep working. Pages that need data still return HTTP 500.
- **D-14 This repository stays public (owner's decision).** Nothing goes into this folder, commit messages or pull requests that describes an unfixed weakness, shows how to exploit one, reveals a hidden price, or lists claims awaiting proof. Full audit material is kept privately, outside git. Fixes should be deployed soon after they are pushed.

## 2026-11-08

- **D-15 Every product gets Product structured data (replaces part of D-6).** Price-on-request items now carry brand, model, photos and specifications without an offer. Google shows no price rich result for them, which is accepted: search engines and AI assistants still learn what the product is.
- **D-16 Sitemap built on each request.** The cached sitemap stayed stale, so products added in the admin never reached search engines.
- **D-17 A product is published only in languages it has a name in.** Uzbek always; Russian and English need their own name, otherwise that page is `noindex` and left out of hreflang and the sitemap.
- **D-18 AI visibility through the big indexes, not tricks.** ChatGPT search and Copilot use Bing, Gemini uses Google, Alice uses Yandex. So: IndexNow for Bing and Yandex, a fresh sitemap, rich structured data, and `/llms.txt` as a plain-text catalogue. `/llms.txt` states only what the product pages show.
- **D-19 Layout error handling passes Next.js internal signals through** (`unstable_rethrow`). The 2026-11-04 catch swallowed the "page reads cookies" signal; harmless today because pages are dynamic anyway, but it would break static pages.
- **D-20 Specs are also read from the description.** Most products list specs in a "Texnik xususiyatlari: / Характеристики: Label: value; …" paragraph rather than in the spec fields. That paragraph now feeds structured data and /llms.txt; filter fields and the spec table still come first. Prose without such a paragraph gives nothing; the parser never guesses.

### Page caching (branch `claude/optimistic-ptolemy-64bcdc`)

- **D-21 Any change clears the whole public cache.** One product's price also shows on other products' pages, its category and direction, the home page, page titles and the category's "from" price, and those lists change as the data changes. Tracking the affected pages is how a stale price gets missed. The cost is one normal render per visited page after a save, which is what every page cost before caching.
- **D-22 Catalogue pages have two routes.** A page that reads the query string cannot be cached, and client-side filtering would lose server-rendered results. So the plain URL is cached and the proxy rewrites URLs with a query to `/filtered`. Only known ad tags count as "no query": an unknown parameter costs one uncached render, while treating it as no query could show the wrong page.
- **D-23 A non-HttpOnly hint cookie tells the browser a login exists.** It is set at login, removed at logout, and kept in step with the session by the proxy, so sessions from before this change work without logging in again. It grants nothing: every server check still uses the HttpOnly session cookie. It spares guests an API call on every page. It holds no name, so the header no longer shows the company name.
- **D-24 Layout database failures are cached for one minute (refines D-13).** With caching, a page rendered without menus would otherwise stay for an hour after the database recovered. Pages that need data fail instead: the last good copy keeps serving if there is one, otherwise HTTP 500 with the branded error page.
- **D-25 One hour as the cache limit.** Saves in the app clear the cache at once, so this limit only covers changes made outside the app: scripts and direct database edits. A page refreshes on the first visit after its hour, and that visitor still gets the old copy, so after a script the admin presses Sozlamalar → «Sahifalarni yangilash» (README §11).
- **D-26 Pages are still built ahead, with one database connection per build worker.** Building nothing ahead would spare the database during the build, but then Next.js cannot see which pages read cookies or the query, and marks `/kabinet` and the `filtered` routes as cacheable. Building ahead keeps that detection and catches pages that fail to render; one connection per worker keeps the build within the hosted connection limit.
- **D-27 The cache is cleared inside each save, after the permission check and right after the write.** Clearing it after every action call, error or not, would let a request without an admin session empty the whole cache. Saves made of several steps (new product with opening stock, Excel import) clear it in `finally`, so a later failing step cannot leave it stale.
