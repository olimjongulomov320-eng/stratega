// Submits every URL in the live sitemap to IndexNow (Bing, Yandex and others). Run once after a deploy that adds
// many pages; the daily cron (/api/cron/indexnow) handles day-to-day changes.
//   npm run indexnow
import { submitToIndexNow, INDEXNOW_KEY, INDEXNOW_KEY_PATH } from "../src/lib/indexnow";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stratega.uz").replace(/\/$/, "");

async function main() {
  const key = await fetch(`${site}${INDEXNOW_KEY_PATH}`).then((r) => (r.ok ? r.text() : ""));
  if (key.trim() !== INDEXNOW_KEY) throw new Error(`${site}${INDEXNOW_KEY_PATH} does not serve the key yet: deploy first.`);
  const xml = await fetch(`${site}/sitemap.xml`).then((r) => r.text());
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Submitting ${urls.length} URLs from ${site}/sitemap.xml`);
  console.log("IndexNow responses:", await submitToIndexNow(urls, site));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
