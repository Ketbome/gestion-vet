import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { Icon, type IconName } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Más" };

const ITEMS: { href: string; icon: IconName; label: string; description: string }[] = [
  {
    href: "/servicios",
    icon: "tag",
    label: "Servicios",
    description: "Catálogo de servicios y precios",
  },
  {
    href: "/gastos",
    icon: "banknotes",
    label: "Gastos",
    description: "Arriendo, sueldos y otros gastos",
  },
  {
    href: "/reportes",
    icon: "chart",
    label: "Reportes",
    description: "Ingresos vs gastos mes a mes",
  },
];

export default function MasPage() {
  return (
    <>
      <PageHeader title="Más" />
      <div className="space-y-3">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="flex items-center gap-4 p-4 transition hover:border-primary-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name={item.icon} />
              </span>
              <span>
                <span className="block font-semibold text-gray-900">{item.label}</span>
                <span className="block text-sm text-gray-500">{item.description}</span>
              </span>
            </Card>
          </Link>
        ))}

        <form action={logout}>
          <button type="submit" className="w-full text-left">
            <Card className="flex items-center gap-4 p-4 transition hover:border-red-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Icon name="logout" />
              </span>
              <span className="font-semibold text-red-600">Cerrar sesión</span>
            </Card>
          </button>
        </form>
      </div>
    </>
  );
}
