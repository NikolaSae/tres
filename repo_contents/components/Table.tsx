// components/Table.tsx
"use client";

import { useState } from "react";
import { Complaint } from "@prisma/client";
import { ArrowDown, ArrowUp } from "lucide-react";

type Service = {
  id: string;
  kpi?: string | null;
  status?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  complaints: Complaint[];
  [key: string]: any;
};

interface TableProps {
  services: Service[];
  serviceType: string;
}

export function Table({ services, serviceType }: TableProps) {
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const toggleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedServices = [...services].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === undefined || bVal === undefined) return 0;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return (
    <div className="overflow-x-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">{serviceType} Services</h2>
      <table className="w-full border-collapse border border-gray-300 rounded">
        <thead>
          <tr className="bg-gray-100">
            {["kpi", "status", "remarks", "createdAt", "updatedAt", "complaints"].map((field) => (
              <th
                key={field}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => toggleSort(field)}
              >
                {field}
                {sortField === field ? (
                  sortOrder === "asc" ? (
                    <ArrowUp className="inline w-4 h-4 ml-1" />
                  ) : (
                    <ArrowDown className="inline w-4 h-4 ml-1" />
                  )
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedServices.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{s.kpi ?? "-"}</td>
              <td className="border px-4 py-2">{s.status ?? "-"}</td>
              <td className="border px-4 py-2">{s.remarks ?? "-"}</td>
              <td className="border px-4 py-2">{new Date(s.createdAt).toLocaleDateString()}</td>
              <td className="border px-4 py-2">{new Date(s.updatedAt).toLocaleDateString()}</td>
              <td className="border px-4 py-2 text-center">{s.complaints?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
