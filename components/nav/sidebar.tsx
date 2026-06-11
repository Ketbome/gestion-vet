import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { SidebarLink } from "./nav-link";
import { logout } from "@/lib/actions/auth";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <SidebarLink href="/" icon="home">
          Inicio
        </SidebarLink>
        <SidebarLink href="/atenciones" icon="heart">
          Atenciones
        </SidebarLink>
        <SidebarLink href="/inventario" icon="box">
          Inventario
        </SidebarLink>
        <SidebarLink href="/pedidos" icon="truck">
          Pedidos
        </SidebarLink>
        <SidebarLink href="/servicios" icon="tag">
          Servicios
        </SidebarLink>
        <SidebarLink href="/gastos" icon="banknotes">
          Gastos
        </SidebarLink>
        <SidebarLink href="/reportes" icon="chart">
          Reportes
        </SidebarLink>
      </nav>
      <div className="border-t border-gray-200 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Icon name="logout" className="h-5 w-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
