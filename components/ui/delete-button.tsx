"use client";

import { useTransition } from "react";
import { confirmDialog } from "./confirm";

export function DeleteButton({
  action,
  confirmMessage = "Esta acción no se puede deshacer.",
  confirmTitle = "¿Eliminar?",
  children = "Eliminar",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  confirmTitle?: string;
  children?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        const confirmed = await confirmDialog({
          title: confirmTitle,
          text: confirmMessage,
        });
        if (confirmed) startTransition(() => action());
      }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Eliminando…" : children}
    </button>
  );
}
