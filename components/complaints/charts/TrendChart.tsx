// components/complaints/charts/TrendChart.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ComplaintStatus } from "@/lib/types/enums";

interface TrendDataPoint {
  date: string;
  new: number;
  resolved: number;
  closed: number;
  total: number;
}

interface TrendChartProps {
  data?: TrendDataPoint[];
  isLoading?: boolean;
  period?: "week" | "month" | "quarter" | "year";
  title?: string;
}

export function TrendChart({ 
  data = [], 
  isLoading = false,
  period = "month",
  title = "Complaint Trends"
}: TrendChartProps) {
  const [periodDescription, setPeriodDescription] = useState("last 30 days");

  useEffect(() => {
    switch (period) {
      case "week":
        setPeriodDescription("last 7 days");
        break;
      case "month":
        setPeriodDescription("last 30 days");
        break;
      case "quarter":
        setPeriodDescription("last 90 days");
        break;
      case "year":
        setPeriodDescription("last 12 months");
        break;
    }
  }, [period]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Showing data for the {periodDescription}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Showing data for the {periodDescription}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Showing data for the {periodDescription}</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="new" 
              name="New" 
              stroke="#0ea5e9" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="resolved" 
              name="Resolved" 
              stroke="#10b981" 
            />
            <Line 
              type="monotone" 
              dataKey="closed" 
              name="Closed" 
              stroke="#64748b" 
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Total" 
              stroke="#8b5cf6" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}