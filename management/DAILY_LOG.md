# Daily log
## 2026-11-01
- Inspected repo, ran tsc/eslint/tests/audit, fetched live site, wrote audit + roadmap. Pushed branch v2-improved.

## 2026-11-04
- Fast-forwarded the working branch onto GitHub `main`.
- Inspected the live site with read-only requests and a browser.
- Ran the 8-area audit (91 findings: 90 confirmed, 1 undetermined, 0 refuted).
- Implemented and verified the safe fixes (see CHANGELOG, QA_REPORT). Independent review found 8 problems in the new code; all fixed and retested.
- Owner decided to keep the repository public, so these documents were reduced to summaries (D-14).
- Started two follow-up sessions at the owner's request: page caching and a reliability batch.
- Owner approved merging. PR #1 merged and deployed to production; live checks passed (see QA_REPORT). The owner confirmed the Telegram Mini Apps and the barcode camera work.

## 2026-11-08
- Compared with irtemstroymarket.uz: they answer about 4× faster (server in Uzbekistan); we lead on prices, filters and SEO basics.
- Audited all 22 live products in uz/ru/en. 8 were missing from the stale sitemap; English pages showed Russian text; one product has contradictory data.
- Built the SEO and AI-visibility change and checked it on a local production build. Not pushed.
- Owner approved. PR #2 merged and deployed (652719e). Live: all 22 products in the sitemap (8 were missing), /llms.txt lists 22, every sitemap URL returns 200. All 103 sitemap URLs submitted to IndexNow (HTTP 202 accepted).
- Found: specifications mostly live inside description text, so 8 products expose no structured specs and most others 1–3.
