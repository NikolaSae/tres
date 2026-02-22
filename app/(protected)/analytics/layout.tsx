// app/(protected)/analytics/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "../_components/sidebar";
import React from "react";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

const analyticsLinks = [
  { href: "/analytics", label: "Overview" },
  { href: "/analytics/financials", label: "Financials" },
  { href: "/analytics/providers", label: "Providers" },
  { href: "/analytics/sales", label: "Sales" },
  { href: "/analytics/complaints", label: "Complaints" },
];

export default async function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const session = await auth();

  // Protected layout već proverava login i isActive,
  // ali ovde dodajemo role proveru specifičnu za Analytics
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    redirect("/403");
  }

  return (
    <div className="flex h-full">
      <Sidebar links={analyticsLinks} />
      <main className="flex-1 p-6 overflow-y-auto top-0">
        {children}
      </main>
    </div>
  );
}