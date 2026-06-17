import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createUser } from "@/lib/actions/users";
import { PageHeader } from "@/components/ui/page-header";
import { UserForm } from "@/components/usuarios/user-form";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NuevoUsuarioPage() {
  if (!(await requireRole("admin"))) redirect("/");
  return (
    <>
      <PageHeader title="Nuevo usuario" subtitle="Crea una cuenta para el equipo" />
      <UserForm action={createUser} />
    </>
  );
}
