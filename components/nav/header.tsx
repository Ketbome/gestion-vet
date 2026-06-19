import Link from "next/link";
import type { ClinicMode } from "@/lib/constants";
import { LogoMark } from "@/components/logo";
import { GlobalSearch } from "./global-search";

export function Header({ mode }: { mode: ClinicMode }) {
  const placeholder =
    mode === "completo"
      ? "Buscar cliente, RUT o mascota…"
      : "Buscar atención por mascota o tutor…";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur md:pl-72">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 md:px-8">
        <Link href="/" className="md:hidden">
          <LogoMark className="h-8 w-8" />
        </Link>
        <GlobalSearch placeholder={placeholder} />
      </div>
    </header>
  );
}
