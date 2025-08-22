// components/analytics/ServicePerformance.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useServicePerformance } from "@/hooks/use-service-performance";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicePerformance() {
  const [serviceType, setServiceType] = useState<string>("all");
  const { data, isLoading, error } = useServicePerformance(serviceType);
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Performance</CardTitle>
          <CardDescription>Error loading performance data</CardDescription>
        </CardHeader>
        <CardContent className="text-red-500">
          Failed to load service performance data. Please try again later.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Service Performance</CardTitle>
          <CardDescription>Transaction metrics by service</CardDescription>
        </div>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="VAS">Value Added Services</SelectItem>
            <SelectItem value="BULK">Bulk SMS</SelectItem>
            <SelectItem value="HUMANITARIAN">Humanitarian</SelectItem>
            <SelectItem value="PARKING">Parking</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-64" />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#8884d8" name="Transactions" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (RSD)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}