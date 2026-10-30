# STRATEGA — stratega.uz v2

Full rebuild of stratega.uz: public B2B catalog (Uzbek / Russian / English, SEO-ready) and an admin ERP
(products, stock, warehouses, stock documents, RFQs, quotations/КП, orders, shipments, payments,
customers, suppliers, price lists, analytics, alerts, employees & roles, audit log).

Stack: Next.js 16 · React 19 · Tailwind 4 · Prisma 7 · PostgreSQL 16.

---

## 1. Run it on your Mac (first time)

You need **Node.js 20+** and **Docker Desktop**.

```bash
cd ~/Desktop/stratega-v2
npm install
docker compose up -d                 # starts a local PostgreSQL
cp .env.example .env                 # then open .env and fill ADMIN_PASSWORD,
                                     # ADMIN_SESSION_SECRET, SEED_OWNER_PASSWORD
npx prisma migrate deploy            # creates all tables (first time only)
npm run db:seed                      # categories, 15 products, stock, suppliers, owner account
npm run dev
```

Open:
- Site: http://localhost:3000 (Uzbek), http://localhost:3000/ru, http://localhost:3000/en
- Admin: http://localhost:3000/admin — log in with `SEED_OWNER_EMAIL` + `SEED_OWNER_PASSWORD`
  (or just the shared `ADMIN_PASSWORD`).

Every day after that: `docker compose up -d` and `npm run dev`.

## 2. Before going live — check these

| What | Where |
| --- | --- |
| Marketing claims (official supplier, warranty, CE, service centre, units sold…) — only switch on what is true | `src/lib/site.ts` → `CLAIMS` |
| Company details, phone, address, bank account (bank account is empty = hidden) | `src/lib/site.ts` → `COMPANY` |
| Welder photos (none yet) — upload in Admin → Mahsulotlar → edit | admin |
| CN-013A price (was 200 000 so'm, below ~428 000 cost) — not in the seed, add when the price is decided | admin |
| Company name on documents, low-stock threshold, payment overdue days | Admin → Sozlamalar |

## 3. Adding products from Excel + photos

1. Admin → Mahsulotlar → **Import (Excel / CSV)**. Columns: `sku, nomi_uz, nomi_ru, kategoriya, brend,
   birlik, tannarx_usd, narx, qoldiq, yetkazib_beruvchi, tavsif_uz, tavsif_ru, faol` (full list on the page).
   New SKUs are created (categories too); existing SKUs are updated. Rows without `narx` are added hidden.
   If the file has `tannarx_usd`, enter the USD rate on the import page.
2. Admin → Mahsulotlar → **Rasmlarni yuklash**: select many photos at once; each file name is the SKU
   (`XS-1218.jpg`; `XS-1218__2.jpg` adds a second photo).
3. Photos are stored in Vercel Blob (`BLOB_READ_WRITE_TOKEN`) or, on your own server, in `./uploads`
   (`LOCAL_UPLOADS=1`). In `npm run dev` they go to `./uploads` automatically.

## 4. Replacing Website 2 on stratega.uz (switch-over)

Website 2 (the site running on stratega.uz today) stays untouched until the very last step, so you can
always switch back. Do it in a quiet hour; steps 4–7 take about 30 minutes.

1. **New database.** Create a new Postgres database for v2 (Prisma Postgres / Neon / Vercel Postgres).
   Do **not** reuse Website 2's database — the tables are different.
2. **New Vercel project.** Push this folder to a new GitHub repository, import it in Vercel, and set the
   variables from `.env.example`:
   - `DATABASE_URL` = the new database
   - `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` = new long random values
   - `BLOB_READ_WRITE_TOKEN` = the **same** Blob store as Website 2 (product photos keep working)
   - `GROQ_API_KEY`, `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` = copy from Website 2's Vercel settings
   - Build command: `npm run vercel-build` (applies the migrations in `prisma/migrations`).
   **Do not run `npm run db:seed`** on this database — the real data comes from Website 2.
3. Deploy. You get a test address like `stratega-v2.vercel.app`.
4. **Stop entering data in Website 2** (tell staff: no new orders / stock documents for ~30 minutes).
5. **Copy the data** from your Mac (Website 2's database is only read, never changed):
   ```bash
   export SOURCE_DATABASE_URL="…Website 2 DATABASE_URL (Vercel → old project → Settings → Environment Variables)…"
   export DATABASE_URL="…the NEW v2 database…"
   npm run migrate:website2            # dry run: shows counts and warnings, writes nothing
   npm run migrate:website2 -- --apply # copies everything in one transaction
   ```
   Kept: categories, products (with prices, cost, photos, barcodes), stock per warehouse and the full
   stock history, stock documents, suppliers, customers, price lists, website users, RFQs, quotations,
   orders, shipments, payments, employees **with their current passwords**, audit log, settings.
   Not kept: the generated "demo" reviews, ratings and "sold" counts (they were not real).
6. **Check on the test address**: log in with your usual admin email and password, open Sklad, Buyurtmalar,
   To'lovlar; compare a few stock numbers with Website 2. Then Admin → Ogohlantirishlar → recalculate.
   Give staff without an email a real email (Admin → Xodimlar) — the copy script lists them.
7. **Switch the domain**: Vercel → old project → Domains → remove `stratega.uz` / `www.stratega.uz`;
   new project → Domains → add them. Page URLs are the same as on Website 2 (`/product/…`, `/ru/…`),
   so Google links keep working. Submit `https://www.stratega.uz/sitemap.xml` in Google Search Console.
8. Keep the old Vercel project and database for 2–4 weeks. To roll back: move the domain back.

## 5. Useful commands

```bash
npm run dev          # development server
npm run build        # production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run db:migrate   # create a migration after editing prisma/schema.prisma (local DB)
npm run db:seed      # demo data for a LOCAL database only (never on production)
npm test             # fast tests (no database)
RUN_DB_TESTS=1 TEST_DATABASE_URL="postgresql://stratega:stratega@localhost:5432/stratega_test" npm run test:db
                     # + stock-ledger tests on a local test database (refuses non-local URLs)
npx prisma studio    # browse the database
```

## 6. Where things are

- `src/app/[locale]/` — public pages (home, category, product, search, cart/RFQ, cabinet, info pages)
- `src/i18n/dictionaries/` — all site texts in uz / ru / en
- `src/app/admin/(panel)/` — admin modules
- `src/lib/inventory.ts` — stock ledger (every change is a StockMove)
- `src/lib/permissions.ts` — what each role can do
- `prisma/schema.prisma` — database model, `prisma/seed.ts` — starting data
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts` — SEO

## 7. Taken over from Website 2 (October 2026)

- **Barcode / SKU scanning** in stock documents, orders and quotations: type or scan into
  "Shtrix-kod yoki SKU" and press Enter (a USB scanner does this by itself). On Android Chrome a
  **📷 Kamera** button scans with the phone camera.
- **Stock charts** on the Sklad page: stock value by category, inflow/outflow for the last 30 days.
- **Supplier analytics** (Admin → Yetkazib beruvchilar tahlili): purchases per supplier from posted
  receipts, average cost, lead time, CSV export.
- **Supplier import** from Excel/CSV (Admin → Yetkazib beruvchilar). Customer import now also takes Excel,
  and both update existing records (matched by INN, then name) instead of creating duplicates.
- **Assistant tool API** `/api/admin/assistant` — read-only queries over real data (low stock, reorder,
  dead stock, sales, supplier report, supplier prices, open orders, alerts) for a future AI assistant.
  Needs an admin login; each tool checks the user's role.
- **Tests** (`tests/`) and stock-ledger hardening: stock and reservations now change atomically, so two
  people posting at the same moment can't push stock below zero; the database also rejects negative
  reservations and zero ledger rows (`prisma/migrations/…_stock_integrity`).

## 8. Spare parts section and OLX export

**Spare parts (Ehtiyot qismlar).** Any category can be marked «Ehtiyot qismlar kategoriyasi» (Admin → Kategoriyalar).
Such categories leave the main machine menu and appear on `/ehtiyot-qismlar`, where customers search by machine
model or part code. On each part, fill «Mos keladigan modellar» (e.g. `CBY-AC, BS3500`) — the part then shows on
those machines' pages under «Ushbu texnika uchun ehtiyot qismlar». In the Excel import use columns `mos_keladi`
and `ehtiyot_qism` (categories with "ehtiyot qism" in the name become spare-part categories automatically).

**OLX export** (Admin → Mahsulotlar → OLX eksport):
- *Excel / CSV*: one row per advert (title ≤ 70 chars, description, price in so'm, category, up to 8 photo links,
  city, contact). Products without a price or photo are skipped and listed on the page.
- *Feed link* `https://www.stratega.uz/feeds/olx.xml?key=…`: an always-current XML (YML) list. Give it to any
  service that imports from a link (prom.uz reads this format too). The key keeps it private; you can renew it.
- Set the OLX category for each site category once (Kategoriyalar → «OLX kategoriyasi»).
- Fully automatic publishing on OLX (create / update / remove adverts when prices or stock change) needs OLX's
  Partner API: register an app at developer.olx.uz and wait for OLX approval; then the site can sync by itself.

## 9. Main directions, filters, company buyers (31.10.2026)

**Main directions.** The site is now built around 7 directions, set in `src/lib/focus.ts`: warehouse equipment, floor cleaning, PE pipe welding, generators, lifting & rigging, cultivators & trimmers, pressure washers. Each has its own page `/yonalish/<slug>` with Uzbek/Russian text for Google. These directions appear in the menu, on the home page and in the footer. To change the order or the texts, edit `focus.ts`.

**Set up the catalogue once (after `npm run db:deploy`):**
```bash
npm run seed:focus              # dry run — shows what would change
npm run seed:focus -- --apply   # creates the rigging categories, fills empty category texts,
                                # puts focus categories first, fills filter values from product names
```
Run it again after a big import, so new products get their filter values. It never overwrites text you wrote yourself.

**Prices.** Upload `STRATEGA_narx_takliflari.xlsx` (or `STRATEGA_narx_import.xlsx`) in admin → Mahsulotlar → Import. Enter the USD rate and keep "create missing" ticked. Excel files are now read from the sheet named **Import** if there is one, otherwise from the first sheet.

**Filters and product pages.**
- Products have filter fields: capacity (kg), lift height (mm), working width (mm), power (kW).
- They also have: a spec table (one row per line: `O'zbekcha | Русский | value`), a PDF datasheet link, a YouTube video and a delivery time in days.
- Edit these in the product form, or import them with the columns `yuk_kg`, `kotarish_mm`, `ish_kengligi_mm`, `quvvat_kvt`, `pasport_pdf`, `video` and `yetkazish_kun`.
- A filter appears in a category only when its products have at least two different values.

**Company buyers see their own prices.**
1. Give the customer (admin → Mijozlar) a price list.
2. When a website user with the same phone number logs in, they see "Sizning narxingiz" on product cards and product pages, and in the downloadable price list.

**New pages and buttons:**
- `/yuridik-shaxslar`: VAT invoice, contract, tenders, bank details, price-list download.
- `/api/price-list?lang=uz|ru|en`: all prices as Excel.
- Floating Telegram and WhatsApp buttons. Change or hide them in `COMPANY.messengers` in `src/lib/site.ts`. **Check the WhatsApp number.**
- A "Warranty and payment" block on every product page. Instalments show only if `CLAIMS.installments = true`.

New migration: `20261031000000_product_specs`.
## 10. Telegram shop bot and seller alerts

The bot lets customers browse active products by category, search by name/SKU/brand, build a cart, share a phone number, and submit a draft order. New website cart requests and new admin/Telegram orders notify the configured seller chat. Seller notifications include order/request details and an admin link; customer phone numbers are not copied into the group message.

### Local testing

1. Create a bot with Telegram's `@BotFather` and keep its token private.
2. Add the bot to the seller group. In that group, send `/chatid`; copy the returned ID.
3. Put these values in the local `.env` file (never commit it):

   ```dotenv
   TELEGRAM_BOT_TOKEN="..."
   TELEGRAM_WEBHOOK_SECRET="a-long-random-value"
   TELEGRAM_SELLER_CHAT_ID="-100..."
   NEXT_PUBLIC_TELEGRAM_BOT_URL="https://t.me/YourBotName"
   ```

4. Restart the site after changing `.env`, then run `npm run telegram:dev` in a second terminal. Open the bot link and send `/start`. Stop local polling before switching to a production webhook.

### Production setup

Set the same environment variables on the hosted site, set `NEXT_PUBLIC_SITE_URL` to its public HTTPS address, deploy the database migration with `npm run db:deploy`, and run `npm run telegram:setup` once. The setup command registers `/api/telegram/webhook` with Telegram and prints the bot link. Do not run webhook mode and local polling at the same time.

