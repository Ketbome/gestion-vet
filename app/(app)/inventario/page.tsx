import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, products } from "@/lib/db";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { InventoryList } from "@/components/inventario/inventory-list";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; ver?: string }>;
}) {
  const { categoria = "", ver = "" } = await searchParams;
  const catalogView = ver === "catalogo";

  const conditions = [eq(products.active, true)];
  // Vista normal: solo productos en uso (con historial).
  // El resto del catálogo seed existe para el autocompletado.
  if (!catalogView) conditions.push(eq(products.tracked, true));
  if ((PRODUCT_CATEGORIES as readonly string[]).includes(categoria)) {
    conditions.push(eq(products.category, categoria));
  }

  const list = db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.name))
    .all();

  const lowStockCount = list.filter(
    (p) => p.minStock > 0 && p.stock <= p.minStock
  ).length;

  const viewParam = catalogView ? "&ver=catalogo" : "";

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={
          catalogView
            ? "Catálogo completo (incluye productos sin uso, solo para autocompletar)"
            : lowStockCount > 0
              ? `${lowStockCount} producto${lowStockCount > 1 ? "s" : ""} con stock bajo`
              : "Productos en uso en tu veterinaria"
        }
        action={<ButtonLink href="/inventario/nuevo">+ Nuevo producto</ButtonLink>}
      />

      <div className="mb-3 flex gap-2">
        <ViewPill href="/inventario" active={!catalogView}>
          En uso
        </ViewPill>
        <ViewPill href="/inventario?ver=catalogo" active={catalogView}>
          Catálogo completo
        </ViewPill>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <CategoryPill
          href={catalogView ? "/inventario?ver=catalogo" : "/inventario"}
          active={!categoria}
        >
          Todas
        </CategoryPill>
        {PRODUCT_CATEGORIES.map((c) => (
          <CategoryPill
            key={c}
            href={`/inventario?categoria=${c}${viewParam}`}
            active={categoria === c}
          >
            {PRODUCT_CATEGORY_LABELS[c]}
          </CategoryPill>
        ))}
      </div>

      <InventoryList products={list} catalogView={catalogView} />
    </>
  );
}

function ViewPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}

function CategoryPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-primary-100 text-primary-800 ring-1 ring-primary-300"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
