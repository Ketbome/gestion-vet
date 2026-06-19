"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchEntities, type SearchResult } from "@/lib/actions/search";

export function GlobalSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(
      () => {
        if (q.length < 2) {
          setResults([]);
          return;
        }
        startTransition(async () => {
          const res = await searchEntities(q);
          setResults(res);
          setHighlighted(0);
        });
      },
      q.length < 2 ? 0 : 200
    );
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(item: SearchResult) {
    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlighted(0);
    router.push(item.href);
  }

  let lastGroup = "";

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(results[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        aria-label="Buscar"
      />
      {open && query.trim().length >= 2 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              Sin resultados para “{query.trim()}”
            </li>
          ) : (
            results.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <li key={item.key}>
                  {showGroup && (
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => go(item)}
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
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
