////app/(protected)/analytics/layout.tsx

import { Sidebar } from "../_components/sidebar";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

// Definišite linkove specifične za Analytics sekciju
const analyticsLinks = [
  { href: "/analytics", label: "Overview" }, // Link ka /analytics/page.tsx
  { href: "/analytics/financials", label: "Financials" },
  { href: "/analytics/providers", label: "Providers" },
  { href: "/analytics/sales", label: "Sales" },
  { href: "/analytics/complaints", label: "Complaints" },
];

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return (
    <div className="flex h-full"> 
      <Sidebar links={analyticsLinks} /> 
      <main className="flex-1 p-6 overflow-y-auto top-0">
        {children} 
      </main>
    </div>
  );
}