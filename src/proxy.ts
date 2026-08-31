import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { EMPLOYEE_COOKIE } from "@/lib/employee-auth-cookie";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const hasAdminToken = isValidAdminToken(adminToken);

  // EmployeeSession bazada saqlanadi (HMAC token emas) — edge middleware'da
  // to'liq tekshirib bo'lmaydi, shuning uchun bu yerda faqat cookie borligi
  // tekshiriladi. Haqiqiy tekshiruv (bazadan, muddati va isActive) har bir
  // server action/sahifada isAdminAuthenticated() orqali amalga oshadi.
  const hasEmployeeCookie = Boolean(request.cookies.get(EMPLOYEE_COOKIE)?.value);

  if (!hasAdminToken && !hasEmployeeCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
