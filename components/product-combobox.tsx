"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/currency";

export type ComboboxProduct = {
  id: number;
  name: string;
  stock: number;
  salePrice: number;
  costPrice: number;
};

export function ProductCombobox({
  products,
  onSelect,
  placeholder = "Buscar producto…",
  priceField = "salePrice",
  showStock = true,
}: {
  products: ComboboxProduct[];
  onSelect: (product: ComboboxProduct) => void;
  placeholder?: string;
  priceField?: "salePrice" | "costPrice";
  showStock?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? products
        .filter((p) => p.name.toLowerCase().includes(normalized))
        .slice(0, 8)
    : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(product: ComboboxProduct) {
    onSelect(product);
    setQuery("");
    setOpen(false);
    setHighlighted(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(matches[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
      />
      {open && normalized && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              Sin resultados para “{query}”
            </li>
          ) : (
            matches.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => select(p)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    i === highlighted ? "bg-primary-50" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {p.name}
                    </span>
                    {showStock && (
                      <span
                        className={`text-xs ${
                          p.stock === 0 ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        Stock: {p.stock}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-primary-700 tabular-nums">
                    {formatCurrency(p[priceField])}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
