import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getClinicMode } from "@/lib/settings";
import { Icon, type IconName } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Más" };

type Item = { href: string; icon: IconName; label: string; description: string };

const COMPLETE_ITEMS: Item[] = [
  {
    href: "/clientes",
    icon: "users",
    label: "Clientes",
    description: "Fichas de tutores y mascotas",
  },
  {
    href: "/agenda",
    icon: "calendar",
    label: "Agenda",
    description: "Citas y calendario",
  },
  {
    href: "/hospitalizaciones",
    icon: "hospital",
    label: "Hospitalización",
    description: "Pacientes internados",
  },
  {
    href: "/recordatorios",
    icon: "bell",
    label: "Recordatorios",
    description: "Controles, vacunas e inactivos",
  },
  {
    href: "/pedidos",
    icon: "truck",
    label: "Pedidos",
    description: "Compras a proveedores",
  },
];

const BASE_ITEMS: Item[] = [
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

const ADMIN_ITEMS: Item[] = [
  {
    href: "/usuarios",
    icon: "users",
    label: "Usuarios",
    description: "Equipo y roles",
  },
  {
    href: "/configuracion",
    icon: "cog",
    label: "Configuración",
    description: "Modo de operación y datos de la veterinaria",
  },
];

export default async function MasPage() {
  const mode = getClinicMode();
  const user = await getCurrentUser();
  const items = [
    ...(mode === "completo" ? COMPLETE_ITEMS : []),
    ...BASE_ITEMS,
    ...(user?.role === "admin" ? ADMIN_ITEMS : []),
  ];
  return (
    <>
      <PageHeader title="Más" />
      <div className="space-y-3">
        {items.map((item) => (
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
