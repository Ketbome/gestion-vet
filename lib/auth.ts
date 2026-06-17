import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { SESSION_COOKIE, verifyToken, type SessionUser } from "./session-edge";
import type { UserRole } from "./constants";

function sessionDays(): number {
  return Number(process.env.AUTH_SESSION_DAYS ?? 30);
}

export async function createSession(user: SessionUser) {
  const days = sessionDays();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: days * 86400,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// cache(): una sola verificación por request aunque la llamen layout y actions
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(SESSION_COOKIE)?.value);
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  return verifySession();
}

export async function requireRole(...roles: UserRole[]): Promise<boolean> {
  const user = await verifySession();
  return !!user && roles.includes(user.role as UserRole);
}
