import { sql } from "drizzle-orm";
import { db, attentions, expenses } from "@/lib/db";

export type MonthlyReport = {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
  profit: number;
};

export function getMonthlyReport(months = 12): MonthlyReport[] {
  const incomeRows = db.all<{ month: string; total: number }>(sql`
    select strftime('%Y-%m', ${attentions.date}) as month,
           sum(${attentions.total}) as total
    from ${attentions}
    group by month
    order by month desc
    limit ${months}
  `);

  const expenseRows = db.all<{ month: string; total: number }>(sql`
    select strftime('%Y-%m', ${expenses.date}) as month,
           sum(${expenses.amount}) as total
    from ${expenses}
    group by month
    order by month desc
    limit ${months}
  `);

  const byMonth = new Map<string, MonthlyReport>();
  for (const row of incomeRows) {
    byMonth.set(row.month, {
      month: row.month,
      income: row.total,
      expenses: 0,
      profit: row.total,
    });
  }
  for (const row of expenseRows) {
    const entry = byMonth.get(row.month) ?? {
      month: row.month,
      income: 0,
      expenses: 0,
      profit: 0,
    };
    entry.expenses = row.total;
    entry.profit = entry.income - entry.expenses;
    byMonth.set(row.month, entry);
  }

  return [...byMonth.values()]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, months);
}
