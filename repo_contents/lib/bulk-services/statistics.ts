///lib/bulk-services/statistics.ts

/**
 * Statistical calculations for bulk services
 * Provides utilities for analyzing bulk service data
 */

import type { BulkService } from "@prisma/client";
import _ from "lodash";

export type BulkServiceStats = {
  totalRequests: number;
  totalMessageParts: number;
  byProvider: Record<string, {
    providerName: string;
    requests: number;
    messageParts: number;
    serviceCount: number;
  }>;
  byService: Record<string, {
    serviceName: string;
    requests: number;
    messageParts: number;
    providerCount: number;
  }>;
  topProviders: {
    providerName: string;
    requests: number;
    messageParts: number;
  }[];
  topServices: {
    serviceName: string;
    requests: number;
    messageParts: number;
  }[];
};

/**
 * Calculate comprehensive statistics from bulk service data
 * @param bulkServices Array of bulk service records
 * @param limit Number of items to include in top lists (default: 5)
 * @returns Object containing calculated statistics
 */
export const calculateBulkServiceStats = (
  bulkServices: BulkService[],
  limit: number = 5
): BulkServiceStats => {
  // Initialize stats object
  const stats: BulkServiceStats = {
    totalRequests: 0,
    totalMessageParts: 0,
    byProvider: {},
    byService: {},
    topProviders: [],
    topServices: []
  };

  // Early return if no data
  if (!bulkServices.length) return stats;

  // Calculate total requests and message parts
  stats.totalRequests = _.sumBy(bulkServices, "requests");
  stats.totalMessageParts = _.sumBy(bulkServices, "message_parts");

  // Group by provider for provider-specific stats
  const groupedByProvider = _.groupBy(bulkServices, "providerId");
  
  // Process each provider group
  Object.entries(groupedByProvider).forEach(([providerId, services]) => {
    if (services.length === 0) return;
    
    const providerName = services[0].provider_name;
    const requests = _.sumBy(services, "requests");
    const messageParts = _.sumBy(services, "message_parts");
    const serviceCount = _.uniqBy(services, "service_name").length;
    
    stats.byProvider[providerId] = {
      providerName,
      requests,
      messageParts,
      serviceCount
    };
  });

  // Group by service for service-specific stats
  const groupedByService = _.groupBy(bulkServices, "serviceId");
  
  // Process each service group
  Object.entries(groupedByService).forEach(([serviceId, services]) => {
    if (services.length === 0) return;
    
    const serviceName = services[0].service_name;
    const requests = _.sumBy(services, "requests");
    const messageParts = _.sumBy(services, "message_parts");
    const providerCount = _.uniqBy(services, "providerId").length;
    
    stats.byService[serviceId] = {
      serviceName,
      requests,
      messageParts,
      providerCount
    };
  });

  // Get top providers by request volume
  stats.topProviders = Object.values(stats.byProvider)
    .sort((a, b) => b.requests - a.requests)
    .slice(0, limit)
    .map(provider => ({
      providerName: provider.providerName,
      requests: provider.requests,
      messageParts: provider.messageParts
    }));

  // Get top services by request volume
  stats.topServices = Object.values(stats.byService)
    .sort((a, b) => b.requests - a.requests)
    .slice(0, limit)
    .map(service => ({
      serviceName: service.serviceName,
      requests: service.requests,
      messageParts: service.messageParts
    }));

  return stats;
};

/**
 * Calculate month-over-month growth for bulk services
 * @param currentMonthData Array of bulk services for current month
 * @param previousMonthData Array of bulk services for previous month
 * @returns Object containing growth metrics
 */
export const calculateMonthlyGrowth = (
  currentMonthData: BulkService[],
  previousMonthData: BulkService[]
) => {
  const currentRequests = _.sumBy(currentMonthData, "requests");
  const previousRequests = _.sumBy(previousMonthData, "requests");
  
  const currentMessageParts = _.sumBy(currentMonthData, "message_parts");
  const previousMessageParts = _.sumBy(previousMonthData, "message_parts");
  
  // Calculate growth percentages
  const requestsGrowth = previousRequests === 0 
    ? 100 
    : ((currentRequests - previousRequests) / previousRequests) * 100;
    
  const messagePartsGrowth = previousMessageParts === 0 
    ? 100 
    : ((currentMessageParts - previousMessageParts) / previousMessageParts) * 100;

  return {
    currentRequests,
    previousRequests,
    requestsGrowth,
    currentMessageParts,
    previousMessageParts,
    messagePartsGrowth,
  };
};

/**
 * Calculate distribution of bulk services by provider
 * @param bulkServices Array of bulk service records
 * @returns Array of provider distribution data
 */
export const calculateProviderDistribution = (bulkServices: BulkService[]) => {
  // Group by provider name
  const groupedByProvider = _.groupBy(bulkServices, "provider_name");
  
  // Calculate total requests for percentage calculation
  const totalRequests = _.sumBy(bulkServices, "requests");
  
  // Process each provider group
  return Object.entries(groupedByProvider).map(([providerName, services]) => {
    const requests = _.sumBy(services, "requests");
    const percentage = totalRequests === 0 ? 0 : (requests / totalRequests) * 100;
    
    return {
      providerName,
      requests,
      percentage: parseFloat(percentage.toFixed(2))
    };
  }).sort((a, b) => b.requests - a.requests);
};

/**
 * Calculate usage trends over time
 * @param bulkServices Array of bulk service records
 * @param timeField Field to use for time grouping (default: createdAt)
 * @param interval Time interval for grouping (day, week, month)
 * @returns Array of trend data points
 */
export const calculateTrends = (
  bulkServices: (BulkService & { [key: string]: any })[],
  timeField: string = "createdAt",
  interval: "day" | "week" | "month" = "month"
) => {
  // Early return if no data
  if (!bulkServices.length) return [];
  
  // Ensure all records have the timeField
  const validServices = bulkServices.filter(service => service[timeField]);
  
  // Get the time grouping function
  const getTimeGroup = (date: Date) => {
    switch (interval) {
      case "day":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case "week":
        // Get the Monday of the week
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      case "month":
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };
  
  // Group by time interval
  const groupedByTime = _.groupBy(validServices, service => {
    const date = new Date(service[timeField]);
    return getTimeGroup(date);
  });
  
  // Convert grouped data to array and sort by time
  return Object.entries(groupedByTime)
    .map(([timeKey, services]) => ({
      timeKey,
      requests: _.sumBy(services, "requests"),
      messageParts: _.sumBy(services, "message_parts"),
      count: services.length
    }))
    .sort((a, b) => a.timeKey.localeCompare(b.timeKey));
};