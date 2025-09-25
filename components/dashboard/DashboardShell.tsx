// components/dashboard/DashboardShell.tsx


// Path: components/dashboard/DashboardShell.tsx
import React from 'react';
import { cn } from "@/lib/utils"; // Pretpostavljamo da imate utility funkciju za spajanje klasa

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

// Komponenta za osnovni layout strukturu stranice unutar dashboard-a
export default function DashboardShell({ children, className, ...props }: DashboardShellProps) {
  return (
    <div className={cn("grid items-start gap-8", className)} {...props}>
      {children}
    </div>
  );
}
