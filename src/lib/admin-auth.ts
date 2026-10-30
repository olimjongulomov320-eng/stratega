// Admin sessions: signed cookie, no DB lookup needed to verify.
// Two ways in: an Employee account (email + password, role-based) or the shared
// ADMIN_PASSWORD (acts as OWNER — keep it for emergencies only).
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "stratega_admin";
const SESSION_HOURS = 12;

export type AdminRole = "OWNER" | "ADMIN" | "MANAGER" | "WAREHOUSE" | "ACCOUNTANT" | "VIEWER";

export type AdminSession = {
  employeeId: string | null; // null = shared admin password
  name: string;
  role: AdminRole;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("ADMIN_SESSION_SECRET is not configured (min 16 chars)");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encode(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeAdminToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifySharedAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password.trim());
  const b = Buffer.from(expected.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminSession(data: Omit<AdminSession, "expiresAt">) {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, encode({ ...data, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return decodeAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
