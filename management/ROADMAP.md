# Roadmap (ranked: impact, UX, technical importance, effort, risk)
1. Fresh `npm ci`, get `npm test` green (low effort, unblocks QA).
2. Upgrade `next` to patched 16.4.3 (non-major); rebuild and re-test. Then review prisma/undici/nanoid fixes; `@vercel/blob` is a major bump — test uploads.
3. Back up the live DB, then deploy v2 (robots, sitemap, ru/en, fixes). Needs owner approval.
4. Add product photos and costs for incomplete products.
5. Verify and correct business claims (certificates, "2000+ sold", delivery coverage, WhatsApp).
6. Run Lighthouse + Playwright smoke tests (home, category, product, cart, RFQ, login) at mobile/tablet/desktop.
7. Confirm admin login is noindex, rate-limited; consider hiding behind staff-only route.
8. Structured data (Product, Organization) once product data is complete.
9. Wire a real GitHub remote for this codebase; decide fate of stratega `main` (CyberQalqon).
10. Add CI: typecheck, lint, test, build.
