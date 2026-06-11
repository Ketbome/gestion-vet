"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const RANGES = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
] as const;

export function DateRangeFilter({ defaultRange = "mes" }: { defaultRange?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = searchParams.get("rango") ?? defaultRange;
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  function applyCustom(nextDesde: string, nextHasta: string) {
    if (!nextDesde || !nextHasta) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("rango", "custom");
    params.set("desde", nextDesde);
    params.set("hasta", nextHasta);
    router.push(`${pathname}?${params.toString()}`);
  }

  function hrefFor(rango: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("rango", rango);
    params.delete("desde");
    params.delete("hasta");
    return `${pathname}?${params.toString()}`;
  }

  const customActive = current === "custom";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-200">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={hrefFor(r.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              current === r.key
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-primary-50 hover:text-primary-700"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div
        className={`flex items-center gap-2 rounded-lg bg-white p-1 pl-2.5 shadow-sm ring-1 transition ${
          customActive ? "ring-2 ring-primary-500" : "ring-gray-200"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 ${customActive ? "text-primary-600" : "text-gray-400"}`}
          aria-hidden="true"
        >
          <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <input
          type="date"
          aria-label="Desde"
          defaultValue={desde}
          onChange={(e) => applyCustom(e.target.value, hasta || e.target.value)}
          className={`rounded-md px-2 py-1 text-sm font-medium transition focus:bg-primary-50 focus:outline-none ${
            customActive ? "text-primary-800" : "text-gray-600"
          }`}
        />
        <span className="text-gray-300">→</span>
        <input
          type="date"
          aria-label="Hasta"
          defaultValue={hasta}
          onChange={(e) => applyCustom(desde || e.target.value, e.target.value)}
          className={`rounded-md px-2 py-1 text-sm font-medium transition focus:bg-primary-50 focus:outline-none ${
            customActive ? "text-primary-800" : "text-gray-600"
          }`}
        />
      </div>
    </div>
  );
}
