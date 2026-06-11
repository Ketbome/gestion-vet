"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { Input, Label, FormError } from "@/components/ui/form-fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="user">Usuario</Label>
        <Input
          id="user"
          name="user"
          autoComplete="username"
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FormError message={state.error} />
      <SubmitButton className="w-full">Entrar</SubmitButton>
    </form>
  );
}
