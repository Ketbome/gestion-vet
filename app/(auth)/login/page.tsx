import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="p-6">
          <h1 className="mb-1 text-lg font-semibold text-gray-900">
            Bienvenido
          </h1>
          <p className="mb-5 text-sm text-gray-500">
            Ingresa tus credenciales para continuar
          </p>
          <LoginForm />
        </Card>
        <p className="mt-4 text-center text-xs text-gray-400">
          GestionVet · Gestión simple para tu veterinaria
        </p>
      </div>
    </main>
  );
}
