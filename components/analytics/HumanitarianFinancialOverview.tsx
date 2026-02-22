// components/analytics/HumanitarianFinancialOverview.tsx
"use client";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { HumanitarianFinancialMetrics } from "@/app/(protected)/analytics/financials/actions";
import { formatCurrency } from "@/lib/formatters";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function safeArray(arr: any): any[] {
  return Array.isArray(arr) ? arr : [];
}

interface Props {
  data: HumanitarianFinancialMetrics;
}

export default function HumanitarianFinancialOverview({ data }: Props) {
  const monthlyData = safeArray(data?.revenueByMonth);
  const orgData = safeArray(data?.orgBreakdown);
  const billingData = safeArray(data?.billingTypeBreakdown);

  const totalAmount = data?.totalAmount || 0;
  const totalTransactions = data?.totalTransactions || 0;
  const prepaidAmount = data?.prepaidAmount || 0;
  const postpaidAmount = data?.postpaidAmount || 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Humanitarian Organizations Financial Overview</CardTitle>
        <CardDescription>
          Revenue from humanitarian organization transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">Combined prepaid + postpaid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prepaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(prepaidAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAmount > 0 ? ((prepaidAmount / totalAmount) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Postpaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(postpaidAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAmount > 0 ? ((postpaidAmount / totalAmount) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total imported records</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="monthly">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Performance</TabsTrigger>
            <TabsTrigger value="organizations">By Organization</TabsTrigger>
            <TabsTrigger value="billing">Billing Type</TabsTrigger>
          </TabsList>

          {/* Monthly */}
          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Prepaid vs Postpaid revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="prepaid" stroke="#4f46e5" name="Prepaid" strokeWidth={2} />
                      <Line type="monotone" dataKey="postpaid" stroke="#10b981" name="Postpaid" strokeWidth={2} />
                      <Line type="monotone" dataKey="amount" stroke="#f59e0b" name="Total" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations */}
          <TabsContent value="organizations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Organization</CardTitle>
                <CardDescription>Top 15 humanitarian organizations by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orgData} layout="vertical" margin={{ left: 160 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="orgName" width={160} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="prepaid" fill="#4f46e5" name="Prepaid" stackId="a" />
                      <Bar dataKey="postpaid" fill="#10b981" name="Postpaid" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Type */}
          <TabsContent value="billing" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Type Distribution</CardTitle>
                  <CardDescription>Prepaid vs Postpaid split</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={billingData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
                          outerRadius={100}
                          dataKey="amount"
                          nameKey="type"
                        >
                          {billingData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Type Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={billingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="amount" name="Revenue">
                          {billingData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}