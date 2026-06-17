"use client";

import { useActionState } from "react";
import type { Attention } from "@/lib/db/schema";
import type { ActionState } from "@/lib/actions/attentions";
import { FormError } from "@/components/ui/form-fields";
import { ClinicalFields, type VetOption } from "./clinical-fields";

export function ClinicalFieldsForm({
  attention,
  vets,
  action,
  children,
}: {
  attention: Attention;
  vets: VetOption[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <ClinicalFields attention={attention} vets={vets} includeWeight />
      <FormError message={state.error} />
      {children}
    </form>
  );
}
