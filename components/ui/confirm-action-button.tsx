"use client";

import { useTransition } from "react";
import { confirmDialog } from "./confirm";

export function ConfirmActionButton({
  action,
  confirmTitle,
  confirmMessage,
  confirmText = "Sí, continuar",
  children,
}: {
  action: () => Promise<void>;
  confirmTitle: string;
  confirmMessage?: string;
  confirmText?: string;
  children: React.ReactNode;
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
          confirmText,
          danger: false,
        });
        if (confirmed) startTransition(() => action());
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:ring-2 focus:ring-primary-300 focus:outline-none disabled:opacity-60"
    >
      {pending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
