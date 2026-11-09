# Audit summary — stratega.uz

Second full audit: **2026-11-03/04**. **This repository is public**, so this file is a summary. Details of open weaknesses and items awaiting the owner's confirmation are kept privately, outside git (see decision D-14).

## How the audit was done

| Check | How | Status |
| --- | --- | --- |
| Repository and architecture | 8 specialist reviewers (security, storefront, admin/ERP, integrations, SEO, performance, accessibility/UX, build/deploy). A separate skeptic re-checked each finding | 91 findings: 90 confirmed, 1 undetermined, 0 refuted |
| Live site | Browser at 1024 px and 375 px; read-only requests to public routes | Done |
| Static checks | `tsc`, `eslint`, `npm test`, `npm audit`, `next build` | Done, see QA_REPORT |
| Local production build | `next start` on a local database of 957 products, browser at 360–1280 px, 273 route checks, simulated database outage | Done |
| Independent review of the fixes | 2 fresh reviewers on the finished commits; 8 problems found in the new code, all fixed and retested | Done |
| Lighthouse | Not available in this environment; time to first byte measured with `curl` instead | **Not run** |
| Forms on the live site | Not submitted, because that would create real requests | Not done by design |
| Real Telegram bots, SMS, AI chat, photo uploads | No credentials in this environment | **Not tested** |
| Admin panel in a browser | Code review only | **Not tested in a browser** |

## Current condition

The live site runs the v2 codebase on Vercel: a well-structured Next.js + Prisma store and admin ERP. Pages render correctly on desktop and phone, with hreflang, canonical and robots in place. The largest gaps are in business data rather than code: the production catalogue has 16 products while about 957 are prepared, and analytics are not switched on yet.

## Priorities

"Fixed" items were deployed to production on 2026-11-04 (merge commit c31b729) and checked on the live site; see QA_REPORT.

| # | Improvement | Status |
| --- | --- | --- |
| 1 | Import the full catalogue to production | Owner |
| 2 | Consistent "price on request" handling across public pages and downloads | Fixed |
| 3 | Dependency updates, including Next.js 16.4.4 | Fixed |
| 4 | Forms recover from server failures and show how to reach sales | Fixed |
| 5 | Analytics and webmaster tools | Owner |
| 6 | Product cards and navigation on phones | Fixed |
| 7 | Security hardening: response headers, login flow | Fixed |
| 8 | Valid structured data, proper error and 404 pages | Fixed |
| 9 | Page caching | In progress |
| 10 | Further admin hardening | Needs owner approval |

## Performance

Measured from one machine, 3 samples each:

| URL | Time to first byte | Server wait |
| --- | --- | --- |
| Home, `/ru/about`, product page (uncached) | ≈ 0.72 s | ≈ 0.45 s |
| `/sitemap.xml` (cached) | ≈ 0.43 s | ≈ 0.15 s |

These are the figures from before caching. Public pages are now cached on a branch that is not yet deployed, which should save about 0.3 s per page; measure again after deploy. Lighthouse was not run.

## Known limitation of the 404 pages

The root layout sits under the `[locale]` segment, so Next.js sends a 404 as an empty HTML shell and builds the page in the browser. Visitors see the branded page with header and footer, and the HTTP status is 404 with `noindex`, which is what search engines need.

## Details

See ROADMAP.md, CHANGELOG.md, QA_REPORT.md, KNOWN_ISSUES.md and DECISION_LOG.md.
