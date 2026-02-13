// /components/PageHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, backLink }) => {
  return (
    <div className="pb-4 mb-6 border-b border-gray-200">
      {backLink && (
        <div className="mb-4">
          <Link href={backLink.href}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLink.label}
            </Button>
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;