"use client";

import { useEffect, useRef, useState } from "react";

export type ComboboxItem = { id: number; label: string; sublabel?: string };

export function EntityCombobox({
  items,
  onSelect,
  placeholder = "Buscar…",
  disabled = false,
}: {
  items: ComboboxItem[];
  onSelect: (item: ComboboxItem) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? items
        .filter(
          (i) =>
            i.label.toLowerCase().includes(normalized) ||
            i.sublabel?.toLowerCase().includes(normalized)
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(item: ComboboxItem) {
    onSelect(item);
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
        disabled={disabled}
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
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />
      {open && normalized && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              Sin resultados para “{query}”
            </li>
          ) : (
            matches.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => select(item)}
                  className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                    i === highlighted ? "bg-primary-50" : ""
                  }`}
                >
                  <span className="font-medium text-gray-900">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-xs text-gray-500">{item.sublabel}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
