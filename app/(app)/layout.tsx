import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getClinicMode } from "@/lib/settings";
import type { UserRole } from "@/lib/constants";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const mode = getClinicMode();
  const role = session.role as UserRole;

  return (
    <div className="min-h-dvh">
      <Sidebar mode={mode} role={role} />
      <main className="px-4 pt-5 pb-24 md:pt-8 md:pb-10 md:pl-72 md:pr-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <BottomNav mode={mode} />
    </div>
  );
}
