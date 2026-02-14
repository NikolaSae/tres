// /components/EmptyState.tsx
"use client";

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode; // ✅ Uncommented
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionButton }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
      {actionButton && <div className="mt-4">{actionButton}</div>} {/* ✅ Uncommented */}
    </div>
  );
}

export default EmptyState;