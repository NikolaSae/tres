// hooks/use-service-performance.ts
"use client";

import { useState, useEffect } from "react";
import { Service, VasService, BulkService } from "@prisma/client";

// Define the return type for service performance data
type ServicePerformanceData = {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  transactionCount: number;
  revenue: number;
  requests?: number;
  messageParts?: number;
  conversion?: number; // For VAS services: naplacen_iznos / fakturisan_iznos
  growth?: number; // Percentage growth from previous period
  serviceData: VasService[] | BulkService[];
};

export function useServicePerformance(
  period: "month" | "quarter" | "year" = "month",
  serviceType?: "VAS" | "BULK" | "HUMANITARIAN" | "PARKING",
  startDate?: Date,
  endDate?: Date
) {
  const [performanceData, setPerformanceData] = useState<ServicePerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicePerformance = async () => {
      try {
        setIsLoading(true);
        
        // Construct query params
        const params = new URLSearchParams();
        if (period) params.append("period", period);
        if (serviceType) params.append("serviceType", serviceType);
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        
        const response = await fetch(`/api/analytics/service-performance?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching service performance: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPerformanceData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching service performance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServicePerformance();
  }, [period, serviceType, startDate, endDate]);

  // Calculate additional metrics
  const enrichedPerformanceData = performanceData.map(service => {
    if (service.serviceType === 'VAS' && Array.isArray(service.serviceData)) {
      // Calculate conversion rate for VAS services
      const vasData = service.serviceData as VasService[];
      const totalBilled = vasData.reduce((sum, item) => sum + item.fakturisan_iznos, 0);
      const totalCollected = vasData.reduce((sum, item) => sum + item.naplacen_iznos, 0);
      
      const conversion = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
      
      return {
        ...service,
        conversion: parseFloat(conversion.toFixed(2))
      };
    }
    
    return service;
  });

  return {
    performanceData: enrichedPerformanceData,
    isLoading,
    error
  };
}