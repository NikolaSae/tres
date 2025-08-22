// /components/EmptyState.tsx
"use client"; // This is likely a Client Component

import React from 'react';
// You might use Button component from your UI library if you want an action
// import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  // You can add a prop for an action button if needed
  // actionButton?: React.ReactNode; // Example: <Button onClick={...}>Add Item</Button>
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description /*, actionButton */ }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
      {/* {actionButton && <div className="mt-4">{actionButton}</div>} */}
    </div>
  );
}

export default EmptyState;