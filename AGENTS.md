<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database is remote (Prisma Postgres) — do NOT use `prisma migrate dev`

`.env` points at the hosted Prisma Postgres instance, not a local SQLite file.

- ✅ `npm run db:deploy` (`prisma migrate deploy`) — applies existing migrations.
- ✅ `npx prisma migrate diff` — inspect drift without touching data.
- ❌ `npx prisma migrate dev` — tries to create/shadow a DB and may rewrite the
  schema against the live database. Never run it against this project.
- After adding a migration file manually, run `npm run db:deploy` and then
  `npx prisma generate` (client lives in `src/generated/prisma`).

## Validation before pushing

```bash
npm test          # ORDER_TRANSITIONS state-machine tests (tsx + node:test)
npm run lint      # must be 0 errors, 0 warnings
npx tsc --noEmit
npx next typegen && npm run build
```
