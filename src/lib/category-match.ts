// Finds the category a search query is about, from the names buyers use ("рохля", "пайка", "керхер", "rohlya"…).
// The names come from `aka` in config/category-seo.ts. Used by the site search: an exact name opens the category,
// a query that mentions one shows a link to it above the results.

import { CATEGORY_SEO } from "@/config/category-seo";
import { transliterate } from "@/lib/products";

// Words that only add intent ("цена", "купить", "Ташкент") and don't change which category is meant.
const NOISE = new Set(
  "цена цены цене ценам купить куплю продажа продаю недорого дешево в для ташкенте ташкент узбекистан узбекистане бу б/у новый narxi narxlari нархи нархлари sotib olish olaman sotiladi toshkent toshkentda тошкент тошкентда арзон arzon bor price prices buy tashkent uzbekistan".split(" "),
);

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}'/.\- ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Query without intent words, in its own spelling and transliterated to Latin. */
function forms(q: string): string[] {
  const clean = norm(q).split(" ").filter((w) => !NOISE.has(w)).join(" ");
  return [...new Set([clean, transliterate(clean)])].filter(Boolean);
}

type Alias = { slug: string; text: string; lat: string };

let cache: Alias[] | null = null;
function aliases(): Alias[] {
  if (cache) return cache;
  const out: Alias[] = [];
  for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
    for (const a of seo.aka ?? []) {
      // Same cleaning as the query, so "пайка для пэ труб" matches whether or not "для" is typed.
      const [text] = forms(a);
      if (text && text.length >= 3) out.push({ slug, text, lat: transliterate(text) });
    }
  }
  // Longer names first, so "инверторный генератор" wins over "генератор".
  cache = out.sort((a, b) => b.text.length - a.text.length);
  return cache;
}

/** The category whose name is the whole query ("керхер", "пайка цена", "rohlya narxi"); null when none or unclear. */
export function exactCategory(q: string): string | null {
  const f = forms(q);
  if (!f[0]) return null;
  const hits = new Set(aliases().filter((a) => f.includes(a.text) || f.includes(a.lat)).map((a) => a.slug));
  return hits.size === 1 ? [...hits][0] : null;
}

/** Categories the query mentions, best match first (at most `limit`). */
export function matchCategories(q: string, limit = 3): string[] {
  const f = forms(q);
  if (!f[0]) return [];
  const oneWord = !f[0].includes(" ");
  const found: string[] = [];
  for (const a of aliases()) {
    if (found.includes(a.slug)) continue;
    const inQuery = f.some((x) => (` ${x} `).includes(` ${a.text} `) || (` ${x} `).includes(` ${a.lat} `));
    // A one-word query that starts a longer name: "штабел" → "штабелер", "pay" is too short to count.
    const prefix = oneWord && f[0].length >= 4 && (a.text.startsWith(f[0]) || a.lat.startsWith(f[f.length - 1]));
    if (inQuery || prefix) found.push(a.slug);
    if (found.length >= limit) break;
  }
  return found;
}
