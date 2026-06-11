import type { Metadata } from "next";
import { createExpense } from "@/lib/actions/expenses";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ExpenseForm } from "@/components/gastos/expense-form";

export const metadata: Metadata = { title: "Nuevo gasto" };

export default function NuevoGastoPage() {
  return (
    <>
      <PageHeader title="Nuevo gasto" />
      <ExpenseForm action={createExpense} defaultDate={today()} />
    </>
  );
}
