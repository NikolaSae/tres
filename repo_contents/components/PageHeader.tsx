// /components/PageHeader.tsx
"use client"; // This is a Client Component

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string; // Optional description
  // You can add more props here for actions, etc.
  // actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description /*, actions */ }) => {
  return (
    <div className="pb-4 mb-6 border-b border-gray-200"> {/* Basic styling */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {/* {actions && <div>{actions}</div>} */}
      </div>
    </div>
  );
}

export default PageHeader;