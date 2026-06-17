"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export type AuthState = { error?: string };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (
    !user ||
    !user.active ||
    !verifyPassword(password, user.passwordHash, user.passwordSalt)
  ) {
    return { error: "Credenciales inválidas" };
  }

  await createSession({ uid: user.id, role: user.role, name: user.name });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
