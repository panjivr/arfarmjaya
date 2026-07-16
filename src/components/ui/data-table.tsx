"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/page-header";
import { Boxes } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
};

export function DataTable<T>({
  columns,
  rows,
  getKey,
  searchable = true,
  searchPlaceholder = "Cari...",
  searchFields,
  toolbar,
  emptyTitle = "Belum ada data",
  emptyDescription = "Tambahkan data untuk mulai.",
  minWidth = 720,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: number;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      const haystack = searchFields ? searchFields(row) : JSON.stringify(row);
      return haystack.toLowerCase().includes(q);
    });
  }, [rows, query, searchFields]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          {searchable && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={Boxes} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth }}>
            <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={getKey(row)} className="border-t border-border">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""} ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(row) : (row as Record<string, React.ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
