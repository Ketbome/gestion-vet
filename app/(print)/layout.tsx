import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await verifySession())) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-gray-900 print:p-0">
      {children}
    </div>
  );
}
