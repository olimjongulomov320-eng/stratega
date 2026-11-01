# CEO Audit — stratega.uz (v2 improved copy)

Date: 2026-11-01. Scope of this first pass: repository inspection, static checks, live-site text fetch.
NOT done in this pass (no tooling run): Lighthouse, Playwright/browser tests, responsive screenshots,
console-error check, production `next build`, DB-backed tests. Anything below not listed as verified is unverified.

## Verified
- `tsc --noEmit`: passes. `eslint`: passes (no output).
- `npm audit --omit=dev`: 20 vulnerabilities (1 critical, 14 high, 5 moderate). Critical/high include `next`
  (fix available at 16.4.3, non-major), `@vercel/blob` (major bump), `prisma`/`@prisma/config`, `undici`, `nanoid`, `zod`, `sharp`, `postcss`.
- Repo: 273 tracked files, 72 pages, locales uz/ru/en, admin panel, Telegram bot/Mini App, cron daily report (vercel.json), robots.ts + sitemap.ts present. `.env` is git-ignored; only `.env.example` is tracked.
- Live https://stratega.uz (text fetch only): home 200; `/robots.txt` 404; `/sitemap.xml` 404; `/admin/login` 200 (login page publicly reachable); only Uzbek seen, no language switcher/ru/en routes found.
  => The live site is an OLDER build than this copy (this copy defines robots/sitemap and ru/en routes).
- Live content issues seen: several products show a placeholder emoji instead of images; duplicated claims ("CE sertifikati", "2000+ dona sotilgan") — the latter must be verified as true before keeping.

## Critical
1. **Test suite cannot run in this environment**: all 4 test files fail with esbuild "The service was stopped"
   (`node_modules/esbuild/bin/esbuild --version` prints nothing). Likely a broken/quarantined binary in the copied
   node_modules. Fix: fresh `npm ci`. Until then QA of business logic is unverified.
2. **Dependency vulnerabilities** (see above), incl. 1 critical in `next`.
3. **Deploy risk**: `vercel-build` runs `prisma migrate deploy`. Deploying this copy against the live DB applies its migrations. Needs a DB backup and explicit approval first.

## Important
4. Live site lacks robots.txt/sitemap.xml -> SEO indexing signals missing (fixed in this copy, needs deploy).
5. Live site is Uzbek-only; ru/en exist in this copy.
6. Product images missing (7 of 15 per IMPROVEMENTS.md) and 8 missing product costs.
7. Unverified business claims (direct import, official supplier, delivery coverage, WhatsApp number) — verify before launch.
8. Git remote in this copy is a placeholder (`YOUR-ACCOUNT/stratega-v2`); real repo `stratega` `main` holds an unrelated project.

## Minor
9. `/admin/login` is publicly indexable-reachable; confirm it is `noindex` and rate-limited.
10. Duplicate marketing blocks on the live home page.

## Actions completed
- Branch `v2-improved` pushed to github.com/olimjongulomov320-eng/stratega (main untouched).
- This management folder created.
