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
- **D-8 No `loading.tsx` on product and category pages yet.** With per-request rendering, a loading boundary would make missing products return HTTP 200. Revisit after the caching work.
- **D-10 Catch-all route for unknown URLs.** Costs a function call per junk URL; accepted so visitors get a branded 404 with navigation.
- **D-13 Layout queries fail soft.** If the database is down the menus are empty but the page still renders, so `error.tsx` can show contacts and info pages keep working. Pages that need data still return HTTP 500.
- **D-14 This repository stays public (owner's decision).** Nothing goes into this folder, commit messages or pull requests that describes an unfixed weakness, shows how to exploit one, reveals a hidden price, or lists claims awaiting proof. Full audit material is kept privately, outside git. Fixes should be deployed soon after they are pushed.

## 2026-11-08

- **D-15 Every product gets Product structured data (replaces part of D-6).** Price-on-request items now carry brand, model, photos and specifications without an offer. Google shows no price rich result for them, which is accepted: search engines and AI assistants still learn what the product is.
- **D-16 Sitemap built on each request.** The cached sitemap stayed stale, so products added in the admin never reached search engines.
- **D-17 A product is published only in languages it has a name in.** Uzbek always; Russian and English need their own name, otherwise that page is `noindex` and left out of hreflang and the sitemap.
- **D-18 AI visibility through the big indexes, not tricks.** ChatGPT search and Copilot use Bing, Gemini uses Google, Alice uses Yandex. So: IndexNow for Bing and Yandex, a fresh sitemap, rich structured data, and `/llms.txt` as a plain-text catalogue. `/llms.txt` states only what the product pages show.
- **D-19 Layout error handling passes Next.js internal signals through** (`unstable_rethrow`). The 2026-11-04 catch swallowed the "page reads cookies" signal; harmless today because pages are dynamic anyway, but it would break static pages.
