import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { isValidAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { EMPLOYEE_COOKIE } from "@/lib/employee-auth-cookie";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    const hasAdminToken = isValidAdminToken(adminToken);

    // EmployeeSession bazada saqlanadi (HMAC token emas) — edge middleware'da
    // to'liq tekshirib bo'lmaydi, shuning uchun bu yerda faqat cookie borligi
    // tekshiriladi. Haqiqiy tekshiruv (bazadan, muddati va isActive) har bir
    // server action/sahifada isAdminAuthenticated() orqali amalga oshadi.
    const hasEmployeeCookie = Boolean(
      request.cookies.get(EMPLOYEE_COOKIE)?.value
    );

    if (pathname.startsWith("/admin")) {
      if (!hasAdminToken && !hasEmployeeCookie) {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
