///components/ui/heading.tsx

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
}

export const Heading = ({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  children,
}: HeadingProps) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2 className={cn("text-3xl font-bold tracking-tight", titleClassName)}>
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "text-sm text-muted-foreground mt-1",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};