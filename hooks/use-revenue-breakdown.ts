// hooks/use-revenue-breakdown.ts
"use client";

import { useState, useEffect } from "react";
import { getRevenueBreakdown } from "@/lib/analytics/revenue-utils";
import { ServiceType } from "@prisma/client";

type RevenueBreakdownData = {
  type: ServiceType;
  value: number;
}[];

export function useRevenueBreakdown() {
  const [data, setData] = useState<RevenueBreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getRevenueBreakdown();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch revenue breakdown"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
}