"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/currency";
import {
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/constants";
import { deleteProduct } from "@/lib/actions/products";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { DeleteButton } from "@/components/ui/delete-button";
import { StockBadge } from "@/components/inventario/stock-badge";

export function InventoryList({
  products,
  catalogView,
}: {
  products: Product[];
  catalogView: boolean;
}) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const list = normalized
    ? products.filter((p) => p.name.toLowerCase().includes(normalized))
    : products;

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto… (filtra al escribir)"
          aria-label="Buscar producto"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={
            normalized
              ? `Sin resultados para "${query}"`
              : catalogView
                ? "El catálogo está vacío"
                : "Aún no hay productos en uso"
          }
          description={
            normalized
              ? catalogView
                ? "Prueba con otro nombre o créalo."
                : "Prueba en el catálogo completo o créalo."
              : "Los productos aparecen aquí cuando los creas, los pides a un proveedor o los vendes en una atención."
          }
          action={<ButtonLink href="/inventario/nuevo">Crear producto</ButtonLink>}
        />
      ) : (
        <>
          {/* Móvil: cards */}
          <div className="space-y-3 md:hidden">
            {list.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/inventario/${p.id}/editar`}
                      className="font-semibold text-gray-900"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {PRODUCT_CATEGORY_LABELS[p.category as ProductCategory] ??
                        p.category}
                    </p>
                  </div>
                  <StockBadge stock={p.stock} minStock={p.minStock} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Stock: <strong className="tabular-nums">{p.stock}</strong>
                  </span>
                  <span className="font-semibold text-primary-700 tabular-nums">
                    {formatCurrency(p.salePrice)}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: tabla */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                  <th className="px-4 py-3 text-right font-medium">Venta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {PRODUCT_CATEGORY_LABELS[p.category as ProductCategory] ??
                        p.category}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(p.salePrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.stock} minStock={p.minStock} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/inventario/${p.id}/editar`}
                          className="rounded-lg px-3 py-1.5 font-medium text-gray-600 transition hover:bg-gray-100"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          action={deleteProduct.bind(null, p.id)}
                          confirmMessage={`Se quitará "${p.name}" del inventario.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
