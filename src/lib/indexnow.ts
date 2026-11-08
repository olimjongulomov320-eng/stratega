import { SITE_URL } from "@/lib/site";

// IndexNow tells Bing (whose index ChatGPT search and Copilot use), Yandex and other engines about new or changed
// pages within minutes instead of waiting for a crawl. The key is public by design: it is served at INDEXNOW_KEY_PATH.
export const INDEXNOW_KEY = "0e6cee004ae68cfebaa344e966c59583";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Submits same-site URLs (at most 10 000 per call). Returns the HTTP status for each batch. */
export async function submitToIndexNow(urls: string[], siteUrl: string = SITE_URL): Promise<number[]> {
  const host = new URL(siteUrl).host;
  const own = [...new Set(urls)].filter((u) => new URL(u).host === host);
  const statuses: number[] = [];
  for (let i = 0; i < own.length; i += 10_000) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${siteUrl}${INDEXNOW_KEY_PATH}`, urlList: own.slice(i, i + 10_000) }),
      signal: AbortSignal.timeout(15_000),
    });
    statuses.push(response.status);
  }
  return statuses;
}
