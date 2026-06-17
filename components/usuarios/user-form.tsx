"use client";

import { useActionState } from "react";
import type { User } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/users";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/constants";
import { Input, Label, Select, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export function UserForm({
  user,
  action,
}: {
  user?: User;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <Card className="max-w-lg p-5">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user?.username}
              autoComplete="off"
              placeholder="ej: drarojas"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name}
              placeholder="Ej: Dra. Camila Rojas"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select id="role" name="role" defaultValue={user?.role ?? "veterinario"}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Color en la agenda</Label>
            <Input
              id="color"
              name="color"
              type="color"
              defaultValue={user?.color ?? "#0ea5e9"}
              className="h-10 p-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password">
            {user ? "Nueva contraseña (dejar en blanco para mantener)" : "Contraseña"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={!user}
            placeholder="••••••"
          />
        </div>
        <FormError message={state.error} />
        <SubmitButton>{user ? "Guardar cambios" : "Crear usuario"}</SubmitButton>
      </form>
    </Card>
  );
}
