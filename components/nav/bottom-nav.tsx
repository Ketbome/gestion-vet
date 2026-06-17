import type { ClinicMode } from "@/lib/constants";
import { BottomNavLink } from "./nav-link";

export function BottomNav({ mode }: { mode: ClinicMode }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <BottomNavLink href="/" icon="home" label="Inicio" />
      <BottomNavLink href="/atenciones" icon="heart" label="Atenciones" />
      {mode === "completo" ? (
        <BottomNavLink href="/agenda" icon="calendar" label="Agenda" />
      ) : (
        <BottomNavLink href="/pedidos" icon="truck" label="Pedidos" />
      )}
      <BottomNavLink href="/inventario" icon="box" label="Inventario" />
      <BottomNavLink href="/mas" icon="dots" label="Más" />
    </nav>
  );
}
