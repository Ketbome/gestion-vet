"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { USER_ROLES } from "@/lib/constants";

export type ActionState = { error?: string };

function parseUser(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "veterinario");
  const color = String(formData.get("color") ?? "#0ea5e9");

  if (!username) return { error: "El usuario es obligatorio" as const };
  if (!name) return { error: "El nombre es obligatorio" as const };
  if (!(USER_ROLES as readonly string[]).includes(role))
    return { error: "Rol inválido" as const };

  return { data: { username, name, role, color } };
}

export async function createUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireRole("admin"))) return { error: "No autorizado" };

  const parsed = parseUser(formData);
  if ("error" in parsed) return { error: parsed.error };

  const password = String(formData.get("password") ?? "");
  if (password.length < 4)
    return { error: "La contraseña debe tener al menos 4 caracteres" };

  const exists = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, parsed.data.username))
    .get();
  if (exists) return { error: "Ese usuario ya existe" };

  const { hash, salt } = hashPassword(password);
  db.insert(users)
    .values({ ...parsed.data, passwordHash: hash, passwordSalt: salt })
    .run();

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function updateUser(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireRole("admin"))) return { error: "No autorizado" };

  const parsed = parseUser(formData);
  if ("error" in parsed) return { error: parsed.error };

  const clash = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, parsed.data.username), ne(users.id, id)))
    .get();
  if (clash) return { error: "Ese usuario ya existe" };

  const password = String(formData.get("password") ?? "");
  const passwordFields =
    password.length >= 4
      ? (() => {
          const { hash, salt } = hashPassword(password);
          return { passwordHash: hash, passwordSalt: salt };
        })()
      : {};

  db.update(users)
    .set({ ...parsed.data, ...passwordFields })
    .where(eq(users.id, id))
    .run();

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function setUserActive(id: number, active: boolean) {
  if (!(await requireRole("admin"))) redirect("/");
  db.update(users).set({ active }).where(eq(users.id, id)).run();
  revalidatePath("/usuarios");
}
