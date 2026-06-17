import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage() {
  if (!(await requireRole("admin"))) redirect("/");

  const list = db.select().from(users).orderBy(asc(users.name)).all();

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Equipo de la veterinaria y sus roles"
        action={<ButtonLink href="/usuarios/nuevo">+ Nuevo usuario</ButtonLink>}
      />
      <div className="space-y-3">
        {list.map((u) => (
          <Link key={u.id} href={`/usuarios/${u.id}/editar`} className="block">
            <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-primary-300">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {u.name}
                    {!u.active && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">@{u.username}</p>
                </div>
              </div>
              <Badge variant={u.role === "admin" ? "teal" : "gray"}>
                {USER_ROLE_LABELS[u.role as UserRole] ?? u.role}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
