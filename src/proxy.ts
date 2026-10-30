import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const PREFIXED = ["ru", "en"];
const DEFAULT_LOCALE_REWRITE = "x-stratega-default-locale-rewrite";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A rewritten request is evaluated by the proxy again in some dev runtimes.
  // Let the internal /uz route reach the app instead of redirecting back to itself.
  if (request.headers.has(DEFAULT_LOCALE_REWRITE)) return NextResponse.next();

  // ── Admin: require a valid signed session ──
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = decodeAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  // ── Public site i18n ──
  // /uz and /uz/* duplicate the default language → permanent redirect to the unprefixed URL.
  if (pathname === "/uz" || pathname.startsWith("/uz/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 301);
  }
  const first = pathname.split("/")[1];
  if (PREFIXED.includes(first)) return NextResponse.next();

  // Unprefixed = Uzbek: rewrite internally to /uz/... (URL in the browser stays the same).
  const url = request.nextUrl.clone();
  url.pathname = `/uz${pathname === "/" ? "" : pathname}`;
  const headers = new Headers(request.headers);
  headers.set(DEFAULT_LOCALE_REWRITE, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    // Everything except API, Next internals, metadata routes and files with an extension.
    "/((?!api|_next|robots\\.txt|sitemap\\.xml|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
