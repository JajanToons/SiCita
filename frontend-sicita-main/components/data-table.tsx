// components/ui/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState, // Pastikan SortingState diimpor
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel, // Penting untuk sorting
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableViewOptions } from "./data-table-column-toggle"; // Pastikan path benar
import { DataTablePagination } from "./data-table-pagination"; // Pastikan path benar
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  // Prop opsional untuk menentukan ID kolom yang akan dijadikan default sort di tabel ini
  defaultSortColumnId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  // Default ID kolom untuk sorting awal adalah "timestamp"
  defaultSortColumnId = "timestamp",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    // Atur state sorting awal di sini juga agar konsisten dengan initialState
    // Ini akan menjadi state yang dikontrol tabel setelah interaksi pengguna.
    // Jika defaultSortColumnId disediakan, set initial sorting state.
    defaultSortColumnId ? [{ id: defaultSortColumnId, desc: true }] : [] // Jika tidak, biarkan kosong (tidak ada sort awal yang dikontrol state ini secara eksplisit)
    // Namun, initialState di bawah akan tetap berlaku untuk load pertama tabel.
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // Diperlukan agar sorting client-side bekerja
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting, // Memungkinkan pengguna mengubah sorting melalui UI tabel
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting, // State sorting yang dikontrol oleh tabel (termasuk interaksi pengguna)
      columnVisibility,
    },
    initialState: {
      // initialState hanya diterapkan saat tabel pertama kali diinisialisasi
      pagination: {
        pageSize: 10,
      },
      // MODIFIKASI UTAMA DI SINI:
      // Mengatur sorting default untuk komponen DataTable ini.
      // Tabel akan mengurutkan data yang diterimanya secara client-side
      // berdasarkan kolom 'defaultSortColumnId' (default "timestamp") secara descending.
      sorting: defaultSortColumnId
        ? [
            {
              id: defaultSortColumnId, // ID kolom timestamp Anda (atau dari prop)
              desc: true, // true untuk descending (data terbaru dulu)
            },
          ]
        : [],
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar: Column Visibility */}
      {/* Layout toolbar ini akan mengikuti kode Anda sebelumnya, yang sudah dikonfirmasi baik */}
      <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-start">
        <div className="w-full md:w-auto flex justify-start">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Tabel dengan Horizontal Scroll */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    // Rendering TableHead akan menggunakan implementasi Anda yang sudah ada
                    // (kemungkinan melalui DataTableColumnHeader di columns.tsx)
                    // Tidak ada penambahan onClick atau indikator sorting manual di sini.
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                      className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                      }}
                      className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
