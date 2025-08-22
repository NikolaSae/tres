// components/analytics/ContractAnalytics.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useContractAnalytics } from "@/hooks/use-contract-analytics";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContractAnalytics() {
  const { data, activeContracts, expiringContracts, isLoading, error } = useContractAnalytics();
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Analytics</CardTitle>
          <CardDescription>Error loading contract data</CardDescription>
        </CardHeader>
        <CardContent className="text-red-500">
          Failed to load contract analytics. Please try again later.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Contract Analytics</CardTitle>
        <CardDescription>Contract trend and upcoming expirations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{activeContracts}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{expiringContracts.thirtyDays}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 60 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{expiringContracts.sixtyDays}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 90 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">{expiringContracts.ninetyDays}</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newContracts" stroke="#8884d8" name="New Contracts" />
              <Line type="monotone" dataKey="expiringContracts" stroke="#ff7300" name="Expiring Contracts" />
              <Line type="monotone" dataKey="renewedContracts" stroke="#82ca9d" name="Renewed Contracts" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}