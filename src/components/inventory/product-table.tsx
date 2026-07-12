"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Filter, Plus, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Product, products } from "@/lib/data";
import { currency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ProductTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "barcode", header: "Barcode" },
      { accessorKey: "name", header: "Product Name" },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "warehouse", header: "Warehouse" },
      { accessorKey: "rack", header: "Rack" },
      {
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => `${row.original.currentStock} ${row.original.unit}`,
      },
      {
        accessorKey: "retailPrice",
        header: "Retail Price",
        cell: ({ row }) => currency.format(row.original.retailPrice),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              row.original.status === "Available" && "bg-green-50 text-primary",
              row.original.status === "Low Stock" && "bg-amber-50 text-amber-700",
              row.original.status === "Expiring" && "bg-orange-50 text-orange-700",
              row.original.status === "Quarantine" && "bg-red-50 text-danger",
            )}
          >
            {row.original.status}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search product, SKU, barcode, rack, supplier..."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary"><Filter className="h-4 w-4" /> Filter</Button>
          <Button variant="secondary"><Upload className="h-4 w-4" /> Import</Button>
          <Button variant="secondary"><Download className="h-4 w-4" /> Export</Button>
          <Button><Plus className="h-4 w-4" /> Product</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted dark:bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3 font-semibold">
                    <button className="inline-flex items-center gap-2" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
