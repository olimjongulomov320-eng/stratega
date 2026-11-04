/**
 * Where to send the visitor after login: the requested path if it stays on this site, otherwise the fallback.
 * A plain startsWith("/") check is not enough — browsers read "/\evil.com" and "/\t/evil.com" as another host.
 */
export function safeLocalPath(requested: string | null | undefined, fallback: string): string {
  if (!requested || !requested.startsWith("/") || /[\\\u0000-\u001f]/.test(requested)) return fallback;
  const base = "https://stratega.invalid";
  try {
    const url = new URL(requested, base);
    // Checked after parsing: "/.//evil.com" normalises to "//evil.com", which a browser reads as another host.
    if (url.origin !== base || url.pathname.startsWith("//")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback; // "//" and friends are not valid URLs at all.
  }
}
