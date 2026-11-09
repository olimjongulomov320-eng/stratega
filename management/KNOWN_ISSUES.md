# Known issues

Last updated: 2026-11-04. Fixed items move to CHANGELOG.md. Security-related items are tracked privately, outside this public repository (D-14).

## Needs the owner

- Production has 16 products; about 957 are prepared. Import after a database backup (README §9).
- No analytics on the live site; webmaster tools not verified.
- Product photos are small (300–450 px wide) and some products have none.

## Engineering backlog (see ROADMAP for order)

- Products export is not yet safe to re-import.
- Phone numbers are not stored in one format; guest requests do not appear in the cabinet after login.
- Telegram bot checkout does not yet handle on-order products.
- ru/en product pages fall back to Uzbek text when a translation is missing.
- Changes made by scripts or directly in the database reach public pages only after Admin → Sozlamalar → «Sahifalarni yangilash», or on a visit after the hour (README §11).
- A browser tab that is already open can show a price up to 5 minutes old when moving between pages, until it is reloaded (Next.js keeps prefetched pages that long). Requests are priced on the server, so this affects display only.
- A cart line keeps the price from when it was first added, including after a later login.
- No CI and no error monitoring.
- Payments and order lifecycle have no automated tests; the stock-ledger tests need `RUN_DB_TESTS=1` and a local test database.
- Accessibility: quick-view modal focus handling, search autocomplete semantics, low-contrast text, emoji icons.
- Local `/uploads` photos are not served (development and self-hosting only; Vercel uses Blob).
