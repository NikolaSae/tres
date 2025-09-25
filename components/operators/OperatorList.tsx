// components/operators/OperatorList.tsx

"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Operator } from "@prisma/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OperatorFilters } from "./OperatorFilters";
import { PlusCircle } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { formatDate } from "@/lib/utils";

interface DataTableProps {
  data: Operator[] | any; // Allow any type temporarily for robustness
  canCreate?: boolean;
}

export function OperatorList({ data, canCreate = false }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const searchParams = useSearchParams();
  const initialGlobalFilter = searchParams.get("search") || "";
  const [globalFilter, setGlobalFilter] = useState<string>(initialGlobalFilter);
  const filterStatus = searchParams.get("active") || "all";
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) {
        console.warn("OperatorList received non-array data:", data);
        return [];
    }
    return data.filter((item) => {
      const matchesSearch =
        !globalFilter ||
        (item && typeof item === 'object' && Object.values(item).some((value) => {
          if (value !== null && value !== undefined && typeof value === "string") {
            return value.toLowerCase().includes(globalFilter.toLowerCase());
          }
           if (typeof value === 'boolean') {
               // return String(value).toLowerCase().includes(globalFilter.toLowerCase());
           }
          return false;
        }));
      const itemActiveStatus = item && typeof item === 'object' ? item.active : undefined;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && itemActiveStatus === true) ||
        (filterStatus === "inactive" && itemActiveStatus === false);

      return matchesSearch && matchesStatus;
    });
  }, [data, globalFilter, filterStatus]);
  const columns: ColumnDef<Operator>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link href={`/operators/${row.original?.id}`} className="font-medium hover:underline">
          {row.original?.name}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => row.original?.code,
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => {
        const website = row.original?.website;
        return website ? (
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {website}
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        );
      },
    },
    {
      accessorKey: "contactEmail",
      header: "Contact Email",
      cell: ({ row }) => {
        const email = row.original?.contactEmail;
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-blue-600 hover:underline"
          >
            {email}
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original?.active ? "success" : "destructive"}>
          {row.original?.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => row.original?.createdAt ? formatDate(new Date(row.original.createdAt)) : 'N/A',
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/operators/${row.original?.id}`}>View</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/operators/${row.original?.id}/edit`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData, // Use the filtered data
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Enable pagination
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(), // Enable sorting
    state: {
      sorting,
      // Add globalFilter state to the table state if you want react-table to handle it
      // globalFilter: globalFilter,
    },
    // Add manualPagination and pageCount if fetching paginated data from the server
    // manualPagination: true,
    // pageCount: totalPages, // You would need totalPages prop from parent
    // onPaginationChange: onPageChange, // You would need onPageChange prop from parent
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search operators..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9"
          />
        </div>
         <div className="flex flex-row items-center gap-2">
            <OperatorFilters />
            {canCreate && (
              <Button asChild size="sm">
                <Link href="/operators/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Operator
                </Link>
              </Button>
            )}
         </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                    <TableCell key={cell.id}>
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
                  No operators found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}