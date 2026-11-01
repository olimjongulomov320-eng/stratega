# QA Report
| Date | Check | Result |
|---|---|---|
| 2026-11-01 | tsc --noEmit | PASS |
| 2026-11-01 | eslint | PASS |
| 2026-11-01 | npm test (4 files) | FAIL — esbuild service crash, environment issue, not a test assertion failure |
| 2026-11-01 | npm audit --omit=dev | 20 vulns (1 critical, 14 high, 5 moderate) |
| 2026-11-01 | next build | NOT RUN |
| 2026-11-01 | browser/responsive/Lighthouse | NOT RUN |
| 2026-11-01 | Live site text fetch | home 200, robots 404, sitemap 404, admin login 200 |
