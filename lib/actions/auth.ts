"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";

export type AuthState = { error?: string };

function safeEquals(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length, 1);
  const bufA = Buffer.alloc(max);
  const bufB = Buffer.alloc(max);
  bufA.write(a);
  bufB.write(b);
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const user = String(formData.get("user") ?? "");
  const password = String(formData.get("password") ?? "");

  const validUser = process.env.AUTH_USER ?? "";
  const validPassword = process.env.AUTH_PASSWORD ?? "";

  const userOk = safeEquals(user, validUser);
  const passOk = safeEquals(password, validPassword);

  if (!userOk || !passOk) {
    return { error: "Credenciales inválidas" };
  }

  await createSession(user);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
