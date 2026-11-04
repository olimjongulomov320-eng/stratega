# Known issues

Last updated: 2026-11-04. Fixed items move to CHANGELOG.md. Security-related items are tracked privately, outside this public repository (D-14).

## Needs the owner

- Production has 16 products; about 957 are prepared. Import after a database backup (README §9).
- No analytics on the live site; webmaster tools not verified.
- Product photos are small (300–450 px wide) and some products have none.

## Engineering backlog (see ROADMAP for order)

- Every public page is rendered per request (time to first byte ≈ 0.72 s).
- Products export is not yet safe to re-import.
- Phone numbers are not stored in one format; guest requests do not appear in the cabinet after login.
- Telegram bot checkout does not yet handle on-order products.
- ru/en product pages fall back to Uzbek text when a translation is missing.
- The sitemap does not refresh between deploys.
- No CI and no error monitoring.
- Payments and order lifecycle have no automated tests; the stock-ledger tests need `RUN_DB_TESTS=1` and a local test database.
- Accessibility: quick-view modal focus handling, search autocomplete semantics, low-contrast text, emoji icons.
- Local `/uploads` photos are not served (development and self-hosting only; Vercel uses Blob).
