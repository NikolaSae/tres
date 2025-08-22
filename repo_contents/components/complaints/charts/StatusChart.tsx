// components/complaints/charts/StatusChart.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ComplaintStatus } from "@/lib/types/enums";

interface StatusChartProps {
  data?: { status: ComplaintStatus; count: number }[];
  isLoading?: boolean;
  title?: string;
}

const STATUS_COLORS = {
  [ComplaintStatus.NEW]: "#0ea5e9", // sky-500
  [ComplaintStatus.ASSIGNED]: "#8b5cf6", // violet-500
  [ComplaintStatus.IN_PROGRESS]: "#f59e0b", // amber-500
  [ComplaintStatus.PENDING]: "#6b7280", // gray-500
  [ComplaintStatus.RESOLVED]: "#10b981", // emerald-500
  [ComplaintStatus.CLOSED]: "#64748b", // slate-500
  [ComplaintStatus.REJECTED]: "#ef4444", // red-500
};

const STATUS_LABELS = {
  [ComplaintStatus.NEW]: "New",
  [ComplaintStatus.ASSIGNED]: "Assigned",
  [ComplaintStatus.IN_PROGRESS]: "In Progress",
  [ComplaintStatus.PENDING]: "Pending",
  [ComplaintStatus.RESOLVED]: "Resolved",
  [ComplaintStatus.CLOSED]: "Closed",
  [ComplaintStatus.REJECTED]: "Rejected",
};

export function StatusChart({ data = [], isLoading = false, title = "Complaints by Status" }: StatusChartProps) {
  const [chartData, setChartData] = useState<{ name: string; value: number; status: ComplaintStatus }[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      const formattedData = data.map(item => ({
        name: STATUS_LABELS[item.status],
        value: item.count,
        status: item.status
      }));
      setChartData(formattedData);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} complaints`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}