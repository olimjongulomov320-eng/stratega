# QA Report

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

**Not verified on live:** Telegram Mini Apps, admin barcode camera, admin panel, real form submissions, Telegram alerts, SMS, AI chat, photo uploads, a real iPhone.

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
