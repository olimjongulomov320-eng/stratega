import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { filteredCatalogPath } from "@/lib/catalog-route";
import { SESSION_COOKIE, LOGIN_HINT_COOKIE, LOGIN_HINT_MAX_AGE_SECONDS, loginHintCookieOptions, newLoginHint } from "@/lib/login-hint";

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

  // Telegram Mini App entry pages are not localised.
  if (pathname === "/tg" || pathname.startsWith("/tg/")) return NextResponse.next();

  return syncLoginHint(request, routePublicSite(request));
}

function routePublicSite(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Public site i18n ──
  // /uz and /uz/* duplicate the default language → permanent redirect to the unprefixed URL.
  if (pathname === "/uz" || pathname.startsWith("/uz/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 301);
  }
  const first = pathname.split("/")[1];
  if (PREFIXED.includes(first)) {
    const filtered = filteredCatalogPath(pathname.slice(first.length + 1), searchParams);
    if (!filtered) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${first}${filtered}`;
    return NextResponse.rewrite(url);
  }

  // Unprefixed = Uzbek: rewrite internally to /uz/... (URL in the browser stays the same).
  const url = request.nextUrl.clone();
  const path = filteredCatalogPath(pathname, searchParams) ?? pathname;
  url.pathname = `/uz${path === "/" ? "" : path}`;
  const headers = new Headers(request.headers);
  headers.set(DEFAULT_LOCALE_REWRITE, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

/** Keeps the login hint in step with the session cookie: covers sessions from before the hint, and expired ones. */
function syncLoginHint(request: NextRequest, response: NextResponse) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const hasHint = request.cookies.has(LOGIN_HINT_COOKIE);
  if (hasSession && !hasHint) response.cookies.set(LOGIN_HINT_COOKIE, newLoginHint(), { ...loginHintCookieOptions(), maxAge: LOGIN_HINT_MAX_AGE_SECONDS });
  if (!hasSession && hasHint) response.cookies.delete(LOGIN_HINT_COOKIE);
  return response;
}

export const config = {
  matcher: [
    // Everything except API, Next internals, metadata routes and files with an extension.
    "/((?!api|_next|robots\\.txt|sitemap\\.xml|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
