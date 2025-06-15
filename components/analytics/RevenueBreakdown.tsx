// components/analytics/RevenueBreakdown.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useRevenueBreakdown } from "@/hooks/use-revenue-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceType } from "@prisma/client";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type ServiceTypeLabel = {
  [key in ServiceType]: string;
};

const serviceTypeLabels: ServiceTypeLabel = {
  VAS: "Value Added Services",
  BULK: "Bulk SMS",
  HUMANITARIAN: "Humanitarian",
  PARKING: "Parking"
};

export default function RevenueBreakdown() {
  const { data, isLoading, error } = useRevenueBreakdown();
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Error loading revenue data</CardDescription>
        </CardHeader>
        <CardContent className="text-red-500">
          Failed to load revenue breakdown. Please try again later.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Revenue distribution by service type</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-80 flex items-center justify-center">
            <Skeleton className="w-full h-64" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.map(item => ({
                    ...item,
                    name: serviceTypeLabels[item.type as ServiceType] || item.type
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} RSD`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}