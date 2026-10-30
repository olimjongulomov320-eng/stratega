# Stratega v2 — review notes

This folder is an independent copy of the existing site. Its local database is `stratega_v2_improved`; the original copy and its database are separate.

## Changes in this copy

- Product quick-view and compare actions stay visible on touch-sized screens and appear on hover for larger screens.
- Storefront search gets a full-width row on tablet widths, the hero stays stacked until there is room for two columns, and the headline scales more comfortably.
- WhatsApp is listed with the footer contact details instead of floating over product cards and the hero call to action.
- The admin navigation has a close button, backdrop, Escape-key close behavior, and active-page semantics on smaller screens.
- Shared admin cards have clearer hover and focus states; keyboard focus is visible throughout the site.
- Reduced-motion settings now disable product-grid entrance animations too.
- The Uzbek delivery metric reads naturally: “14 ta viloyatga — yetkazib beramiz.”
- Turbopack is rooted to this copy so it does not pick up unrelated lockfiles above the project.

## Catalog and admin improvements from competitor review

- Storefront search and category listings now show 24 products per page, accurate total matches, and preserve search, price, specification, and sorting selections while moving between pages.
- Added brand and in-stock filters to search and category pages in Uzbek, Russian, and English.
- Admin product lists now load 50 rows per page and combine text, category, and status filters correctly; this also avoids loading every product image when opening the list.
- Inventory dashboard figures wrap within their cards at smaller widths. Product margin calculations handle zero price and zero cost safely.

The review found useful patterns on [BESTTOOLS](https://besttools.uz/), [TOR Industries](https://tor-industries.com/), [TUS](https://tus.uz/), [ZON](https://zon.uz/), and [Fora Group](https://foragroup.gl.uz/): visible catalog structure, purchase state, and clear service information. Mervan Makina could not be reviewed reliably because its site did not load in the research browser.

## Recommended content work before launch

- Add photos for the 7 of 15 products currently missing images.
- Fill the 8 missing product costs so stock valuation and margins are reliable.
- Confirm the direct-import and official-supplier claims, delivery coverage, and WhatsApp number against current company details.
- Check translations and product names in Uzbek, Russian, and English, especially products whose names currently remain Uzbek on other language pages.
- Replace sample catalog and stock values with the approved production data before launch.

## Run locally

Use Node 22 (Prisma does not support the installed Node 23 version). Start local PostgreSQL, then run:

```bash
npm run dev -- --port 3001
```

The improved copy uses its own `.env` and local database.
