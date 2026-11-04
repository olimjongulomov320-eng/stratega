# Roadmap

Ranked by business impact, then user experience, technical importance, effort (S/M/L) and risk.
"Owner" = needs the owner's action or approval. Last updated: 2026-11-04.

## P0 — this week

| # | Item | Effort | Who |
| --- | --- | --- | --- |
| 1 | Audit fixes deployed 2026-11-04. Done: the owner confirmed the Telegram Mini Apps and barcode camera work | S | Done |
| 2 | Import the full catalogue on production and upload photos through the admin panel. Do this **after** #1, with a database backup first | M | Owner |
| 3 | Switch on Yandex Metrica (and GA4 if wanted), verify Yandex Webmaster and Google Search Console, submit the sitemap, set the region to Tashkent | S | Owner |

## P1 — next 2 weeks

| # | Item | Effort |
| --- | --- | --- |
| 4 | Further hardening of the admin panel and its API | M |
| 5 | Products export and import that round-trip safely | M |
| 6 | One canonical phone format; guest requests appear in the cabinet after login | M |
| 7 | Telegram: more robust webhook error handling, on-order products in the bot checkout, localized errors | M |
| 8 | Search-engine language signals only for languages a product is translated into; report of missing translations | M |
| 9 | CI (typecheck, lint, test, build) and error monitoring (the monitoring account is an owner decision) | M |

## P2 — performance

| # | Item | Effort |
| --- | --- | --- |
| 10 | **Done on branch `claude/optimistic-ptolemy-64bcdc`, needs deploy (owner approval).** Cache public pages, with on-demand refresh after edits. After deploy, measure time to first byte: the locale rewrite in `src/proxy.ts` still runs on every page, so if cached pages stay far from the sitemap's time, move it to `next.config` rewrites | L |
| 11 | Run functions in the same region as the database, after confirming where it is (owner approval) | S |
| 12 | Loading skeletons on catalogue pages: **tested and declined** (see D-8) | — |

## P3 — backlog

- Order, refund and stock workflow improvements (the refund process is an owner decision).
- Accessibility: quick-view modal, search autocomplete, contrast, same price and call to action on card, quick view and compare.
- Larger product photos; SVG icons instead of emoji.
- Serve local `/uploads` for development and self-hosting.
- Major dependency upgrades, with upload testing.
