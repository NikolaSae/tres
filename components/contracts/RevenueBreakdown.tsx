// Path: /components/contracts/RevenueBreakdown.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Users, 
  ParkingCircle, 
  Calendar,
  MessageSquare,
  Database,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ContractType } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ServiceBreakdownItem {
  id: string;
  name: string;
  revenueAmount: number;
  percentage: number;
  details?: {
    messages: number;
    messageRevenue: number;
    records: number;
    recordRevenue: number;
    monthlyBreakdown?: {
      month: string;
      messages: number;
      messageRate: number;
      messageRevenue: number;
      records: number;
      recordRevenue: number;
      totalRevenue: number;
    }[];
  };
}

interface RevenueData {
  totalGrossRevenue: number;
  platformRevenue: number;
  partnerRevenue: number;
  serviceBreakdown: ServiceBreakdownItem[];
}

interface RevenueBreakdownProps {
  contractId: string;
  contractType: ContractType;
  revenuePercentage: number;
  isRevenueSharing: boolean;
  operatorRevenue: number | null;
  revenueData?: RevenueData;
  calculationStartDate?: Date;
  calculationEndDate?: Date;
}

export function RevenueBreakdown({
  contractId,
  contractType,
  revenuePercentage,
  isRevenueSharing,
  operatorRevenue,
  revenueData,
  calculationStartDate,
  calculationEndDate,
}: RevenueBreakdownProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Simulate loading to allow parent data to fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle potential errors in revenue data
  useEffect(() => {
    if (revenueData && revenueData.serviceBreakdown) {
      try {
        // Test if data is renderable
        revenueData.serviceBreakdown.forEach(service => {
          if (isNaN(service.percentage) || isNaN(service.revenueAmount)) {
            throw new Error(`Invalid data for service ${service.name}`);
          }
        });
      } catch (err) {
        setError("Invalid revenue data format");
      }
    }
  }, [revenueData]);

  const formatCurrency = (amount: number) => {
    // Handle very small amounts
    if (amount < 0.01 && amount > 0) return "< 0.01 RSD";
    
    return new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
      minimumFractionDigits: amount < 1 ? 2 : 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("sr-RS", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
      'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getServiceColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const toggleServiceExpanded = (serviceId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const data = revenueData || {
    totalGrossRevenue: 0,
    platformRevenue: 0,
    partnerRevenue: 0,
    serviceBreakdown: [],
  };

  // Calculate percentages
  const totalRevenue = data.totalGrossRevenue || 0;
  const actualPlatformPercentage = totalRevenue > 0 
    ? (data.platformRevenue / totalRevenue) * 100 
    : 0;
    
  const actualPartnerPercentage = totalRevenue > 0 
    ? (data.partnerRevenue / totalRevenue) * 100 
    : 0;

  // Calculate operator revenue if sharing is enabled
  const operatorRevenueAmount = isRevenueSharing && operatorRevenue !== null
    ? totalRevenue * (operatorRevenue / 100)
    : 0;

  // Adjust partner revenue if operator is taking a share
  const adjustedPartnerRevenue = isRevenueSharing && operatorRevenue !== null
    ? data.partnerRevenue - operatorRevenueAmount
    : data.partnerRevenue;

  // Sort services by revenue descending
  const sortedServiceBreakdown = [...data.serviceBreakdown].sort(
    (a, b) => b.revenueAmount - a.revenueAmount
  );

  // Calculate bulk-specific metrics
  const totalMessages = sortedServiceBreakdown.reduce(
    (sum, service) => sum + (service.details?.messages || 0), 0
  );
  
  const totalRecords = sortedServiceBreakdown.reduce(
    (sum, service) => sum + (service.details?.records || 0), 0
  );
  
  const totalMessageRevenue = sortedServiceBreakdown.reduce(
    (sum, service) => sum + (service.details?.messageRevenue || 0), 0
  );
  
  const totalRecordRevenue = sortedServiceBreakdown.reduce(
    (sum, service) => sum + (service.details?.recordRevenue || 0), 0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
          {contractType === "PARKING" && <Skeleton className="h-4 w-4 rounded-full" />}
          {contractType === "BULK" && <Skeleton className="h-4 w-4 rounded-full" />}
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calculation Period Skeleton */}
        <div className="bg-blue-50 p-4 rounded-lg flex items-start">
          <Skeleton className="h-5 w-5 rounded-full mt-0.5 mr-2" />
          <div className="w-full">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-60" />
            <Skeleton className="h-3 w-72 mt-2" />
          </div>
        </div>

        {/* Service Breakdown Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-60" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Bulk Details Skeleton */}
        {contractType === "BULK" && (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-60" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-700 font-medium">Revenue Calculation Error</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <button 
          className="mt-3 text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Revenue Breakdown</h3>
        {contractType === "PARKING" && <ParkingCircle className="h-4 w-4 text-blue-500" />}
        {contractType === "BULK" && <MessageSquare className="h-4 w-4 text-green-500" />}
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalGrossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total revenue generated by this contract
            </p>
          </CardContent>
        </Card>

        {/* Platform Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.platformRevenue)}
            </div>
            <div className="flex items-center mt-1">
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2">
                {actualPlatformPercentage > 0.01 
                  ? actualPlatformPercentage.toFixed(1) + '%' 
                  : '< 0.1%'}
              </span>
              <span className="text-muted-foreground text-xs">of total revenue</span>
            </div>
          </CardContent>
        </Card>

        {/* Partner Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partner Revenue</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(adjustedPartnerRevenue)}
            </div>
            <div className="flex items-center mt-1">
              <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded mr-2">
                {actualPartnerPercentage > 0.01 
                  ? actualPartnerPercentage.toFixed(1) + '%' 
                  : '< 0.1%'}
              </span>
              <span className="text-muted-foreground text-xs">of total revenue</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operator Revenue Card (if revenue sharing) */}
      {isRevenueSharing && operatorRevenue !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-start-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Operator Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(operatorRevenueAmount)}
              </div>
              <div className="flex items-center mt-1">
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded mr-2">
                  {operatorRevenue}%
                </span>
                <span className="text-muted-foreground text-xs">of total revenue</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculation Period */}
      <div className="bg-blue-50 p-4 rounded-lg flex items-start">
        <Calendar className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-800">Calculation Period</p>
          <p className="text-sm">
            {formatDate(calculationStartDate)} to {formatDate(calculationEndDate)}
          </p>
          <p className="text-xs mt-1 text-blue-600">
            Revenue is calculated based on transactions within this date range
          </p>
        </div>
      </div>

      {/* Bulk Service Metrics */}
      {contractType === "BULK" && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Service Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalMessages.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All messages processed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Senders</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalRecords.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sender records processed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Message Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalMessageRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue from messages
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Sender Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalRecordRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue from senders
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>
            {contractType === "PARKING" 
              ? "Parking Service Revenue" 
              : contractType === "BULK"
                ? "Bulk Service Revenue Breakdown"
                : "Service Revenue Breakdown"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedServiceBreakdown.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {contractType === "PARKING" ? (
                <ParkingCircle className="h-12 w-12 mx-auto text-gray-300" />
              ) : (
                <DollarSign className="h-12 w-12 mx-auto text-gray-300" />
              )}
              <h4 className="mt-2 font-medium">
                {contractType === "PARKING" 
                  ? "No parking revenue data found" 
                  : "No service revenue data found"}
              </h4>
              <p className="text-sm mt-1 max-w-md mx-auto">
                This could be because no transactions have been recorded yet for the selected period.
              </p>
              <div className="mt-4 text-xs text-left bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Period analyzed:</p>
                <p>From: {formatDate(calculationStartDate)}</p>
                <p>To: {formatDate(calculationEndDate)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedServiceBreakdown.map((service, index) => (
                <div key={service.id} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${getServiceColor(index)}`}></div>
                        <span className="font-medium truncate max-w-[150px]">
                          {service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {service.percentage > 0.01 
                            ? service.percentage.toFixed(1) + '%' 
                            : '< 0.1%'}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          {formatCurrency(service.revenueAmount)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleServiceExpanded(service.id)}
                        >
                          {expandedServices[service.id] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </div>
                    {service.percentage > 0 && (
                      <Progress 
                        value={service.percentage} 
                        className="h-2 min-w-[20px]" 
                      />
                    )}
                    
                    {/* Bulk Service Details */}
                    {contractType === "BULK" && service.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-muted-foreground">Messages:</span>{" "}
                            <span className="font-medium">{service.details.messages.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Message Revenue:</span>{" "}
                            <span className="font-medium">{formatCurrency(service.details.messageRevenue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Senders:</span>{" "}
                            <span className="font-medium">{service.details.records.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sender Revenue:</span>{" "}
                            <span className="font-medium">{formatCurrency(service.details.recordRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Monthly Breakdown Section */}
                  {expandedServices[service.id] && service.details?.monthlyBreakdown && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-3">Monthly Revenue Breakdown</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="w-[120px]">Month</TableHead>
                              <TableHead className="text-right">Messages</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="text-right">Message Revenue</TableHead>
                              <TableHead className="text-right">Senders</TableHead>
                              <TableHead className="text-right">Sender Revenue</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {service.details.monthlyBreakdown.map((month, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {formatMonth(month.month)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {month.messages.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {month.messageRate.toFixed(2)} RSD
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(month.messageRevenue)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {month.records.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(month.recordRevenue)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(month.totalRevenue)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Total Row */}
                            <TableRow className="bg-gray-50 font-medium">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right">
                                {service.details.messages.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(service.details.messageRevenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {service.details.records.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(service.details.recordRevenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(service.revenueAmount)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Terms Explanation */}
      <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
        <p className="font-medium">Revenue Sharing Terms:</p>
        <p className="mt-2">
          <span className="font-medium text-indigo-600">Platform Share:</span> {revenuePercentage}% of revenue
          <br />
          <span className="font-medium text-teal-600">Partner Share:</span> {100 - revenuePercentage}% of revenue
          {isRevenueSharing && operatorRevenue !== null && (
            <>
              <br />
              <span className="font-medium text-amber-600">Operator Share:</span> {operatorRevenue}% of revenue
            </>
          )}
        </p>
        
        {contractType === "PARKING" && (
          <p className="mt-2">
            Parking revenue is calculated based on actual transactions recorded in the system.
            Each parking session generates revenue that is allocated according to the contract terms.
          </p>
        )}

        {contractType === "BULK" && (
          <div className="mt-2">
            <p className="font-medium">Bulk Service Pricing:</p>
            <p>
              - Message pricing: Tiered based on monthly volume
              <br />
              - Below 1M messages/month: 1.50 RSD per message
              <br />
              - Above 1M messages/month: 1.20 RSD per message
              <br />
              - Sender processing: 1,000 RSD per sender record
            </p>
          </div>
        )}
      </div>
    </div>
  );
}