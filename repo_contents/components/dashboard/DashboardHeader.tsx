// components/dashboard/DashboardHeader.tsx

// Path: components/dashboard/DashboardHeader.tsx
import React from 'react';

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

// Komponenta za zaglavlje stranice unutar dashboard-a
export default function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">
          {heading}
        </h1>
        {text && (
          <p className="text-lg text-muted-foreground">
            {text}
          </p>
        )}
      </div>
      {children} {/* Ovde se renderuju dugmad ili drugi elementi */}
    </div>
  );
}
