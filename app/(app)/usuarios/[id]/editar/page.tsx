import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { updateUser, setUserActive } from "@/lib/actions/users";
import { PageHeader } from "@/components/ui/page-header";
import { UserForm } from "@/components/usuarios/user-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");

  const { id } = await params;
  const user = db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)))
    .get();

  if (!user) notFound();

  return (
    <>
      <PageHeader title="Editar usuario" subtitle={user.name} />
      <div className="max-w-lg space-y-4">
        <UserForm user={user} action={updateUser.bind(null, user.id)} />

        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          {user.role === "veterinario" && (
            <Link
              href={`/usuarios/${user.id}/horario`}
              className="text-sm font-semibold text-primary-600 hover:underline"
            >
              Configurar horario de atención →
            </Link>
          )}
          <form action={setUserActive.bind(null, user.id, !user.active)}>
            <button
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                user.active
                  ? "text-red-600 hover:bg-red-50"
                  : "text-primary-600 hover:bg-primary-50"
              }`}
            >
              {user.active ? "Desactivar" : "Activar"}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
