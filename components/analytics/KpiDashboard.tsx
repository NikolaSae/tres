///components/analytics/KpiDashboard.tsx


"use client";

import { useEffect, useState } from "react";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    DollarSignIcon,
    ShoppingCartIcon, // Use ShoppingCartIcon for transactions/services
    AlertCircleIcon,
    PercentIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/formatters"; // Assuming formatCurrency exists
// Import the actual types returned by your Server Actions
import { FinancialMetrics } from "@/actions/analytics/get-financial-data";
import { SalesMetrics } from "@/actions/analytics/get-sales-metrics";
import { ComplaintStats } from "@/actions/analytics/get-complaint-stats";

// Update the interface to use the types from your actions
interface KpiDashboardProps {
    financialData: FinancialMetrics; // Use type from get-financial-data.ts
    salesData: SalesMetrics; // Use type from get-sales-metrics.ts
    complaintData: ComplaintStats; // Use type from get-complaint-stats.ts
}

// Define a type for the data structure needed by KpiCard
interface KpiCardData {
    value: number;
    changePercentage: number;
}

// Helper to safely get KPI values, returning defaults if data is missing
function getKpiValue(data: any, valueKey: string, changeKey: string): KpiCardData {
    const value = data?.[valueKey] ?? 0; // Use optional chaining and nullish coalescing
    const change = data?.[changeKey] ?? 0;
    // Handle potential NaN or non-finite numbers from calculations
    const safeValue = typeof value === 'number' && isFinite(value) ? value : 0;
    const safeChange = typeof change === 'number' && isFinite(change) ? change : 0;
    return { value: safeValue, changePercentage: safeChange };
}


export default function KpiDashboard({
    financialData,
    salesData,
    complaintData,
}: KpiDashboardProps) {
    // Use state for client-side updates if filters were applied,
    // otherwise direct props can be used or memoization
    // Keeping state as per original code, assuming it's used with filters later
    const [financial, setFinancial] = useState<FinancialMetrics>(financialData);
    const [sales, setSales] = useState<SalesMetrics>(salesData);
    const [complaints, setComplaints] = useState<ComplaintStats>(complaintData);

    // Update state when props change (e.g., from filter updates)
    useEffect(() => {
        setFinancial(financialData);
        setSales(salesData);
        setComplaints(complaintData);
    }, [financialData, salesData, complaintData]);


    // Safely get data for KpiCards
    const totalRevenueKpi = getKpiValue(financial, 'totalRevenue', 'revenueGrowth'); // Assuming revenueGrowth exists in FinancialMetrics
    const salesKpi = getKpiValue(sales, 'totalTransactions', 'transactionsGrowth'); // Use totalTransactions and transactionsGrowth
    const complaintResolutionKpi = getKpiValue(complaints, 'resolvedComplaints', 'resolutionRateChange'); // Assuming resolutionRateChange exists in ComplaintStats
    const contractRenewalKpi = getKpiValue(financial, 'contractRenewalRate', 'contractRenewalRateChange'); // Assuming contractRenewalRate and contractRenewalRateChange exist in FinancialMetrics

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
                title="Total Revenue"
                // Safely format currency, handle cases where totalRevenue might be null/undefined initially
                value={formatCurrency(totalRevenueKpi.value ?? 0)}
                description={`${totalRevenueKpi.changePercentage >= 0 ? "+" : ""}${totalRevenueKpi.changePercentage.toFixed(1)}% from previous period`} // Format percentage
                icon={<DollarSignIcon className="h-4 w-4" />}
                changeValue={totalRevenueKpi.changePercentage}
            />

            <KpiCard
                title="Transactions" // Changed title to reflect transactions
                // FIX: Use totalTransactions instead of totalServices
                // Safely convert value to string
                value={(salesKpi.value ?? 0).toString()}
                 // Use transactionsGrowth
                description={`${salesKpi.changePercentage >= 0 ? "+" : ""}${salesKpi.changePercentage.toFixed(1)}% from previous period`} // Format percentage
                icon={<ShoppingCartIcon className="h-4 w-4" />}
                changeValue={salesKpi.changePercentage}
            />

            <KpiCard
                title="Resolved Complaints" // Adjusted title
                // Safely get resolved complaints count
                value={(complaints?.resolvedComplaints ?? 0).toString()} // Use resolvedComplaints from ComplaintStats
                // Assuming a 'resolutionRateChange' metric exists in ComplaintStats
                description={`${complaintResolutionKpi.changePercentage >= 0 ? "+" : ""}${complaintResolutionKpi.changePercentage.toFixed(1)}% from previous period`} // Format percentage
                icon={<AlertCircleIcon className="h-4 w-4" />}
                changeValue={complaintResolutionKpi.changePercentage}
            />

            <KpiCard
                title="Contract Renewal Rate"
                // Safely get renewal rate percentage
                value={`${(contractRenewalKpi.value ?? 0).toFixed(1)}%`} // Assuming value is a percentage
                 // Assuming 'contractRenewalRateChange' metric exists in FinancialMetrics
                description={`${contractRenewalKpi.changePercentage >= 0 ? "+" : ""}${contractRenewalKpi.changePercentage.toFixed(1)}% from previous period`} // Format percentage
                icon={<PercentIcon className="h-4 w-4" />}
                changeValue={contractRenewalKpi.changePercentage}
            />
        </div>
    );
}

// KpiCard component seems fine, uses string values
interface KpiCardProps {
    title: string;
    value: string; // Expects string, convert numbers to string before passing
    description: string;
    icon: React.ReactNode;
    changeValue: number;
}

function KpiCard({ title, value, description, icon, changeValue }: KpiCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            {icon}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Key performance indicator</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div> {/* Value is already a string */}
                <p className="text-xs text-muted-foreground flex items-center">
                    {changeValue > 0 ? (
                        <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                    ) : changeValue < 0 ? (
                        <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                        className={cn(
                            changeValue > 0 ? "text-green-500" : "",
                            changeValue < 0 ? "text-red-500" : ""
                        )}
                    >
                        {description}
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}