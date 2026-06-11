import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, expenses } from "@/lib/db";
import { updateExpense } from "@/lib/actions/expenses";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { ExpenseForm } from "@/components/gastos/expense-form";

export const metadata: Metadata = { title: "Editar gasto" };

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = db
    .select()
    .from(expenses)
    .where(eq(expenses.id, Number(id)))
    .get();

  if (!expense) notFound();
  // Los gastos automáticos de pedidos no se editan
  if (expense.orderId != null) redirect("/gastos");

  return (
    <>
      <PageHeader title="Editar gasto" subtitle={expense.description} />
      <ExpenseForm
        expense={expense}
        action={updateExpense.bind(null, expense.id)}
        defaultDate={today()}
      />
    </>
  );
}
