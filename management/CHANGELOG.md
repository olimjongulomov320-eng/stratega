# Changelog

Local changes until deployed. "Deployed" is stated explicitly when it happens.

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
