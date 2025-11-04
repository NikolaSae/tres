// components/analytics/CombinedFinancialView.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VasFinancialOverview from "./VasFinancialOverview";
import ParkingFinancialOverview from "./ParkingFinancialOverview";
import { FinancialMetrics, ParkingFinancialMetrics } from "@/app/(protected)/analytics/financials/actions";

interface CombinedFinancialViewProps {
    vasData: FinancialMetrics;
    parkingData: ParkingFinancialMetrics;
}

export default function CombinedFinancialView({ 
    vasData, 
    parkingData 
}: CombinedFinancialViewProps) {
    return (
        <Tabs defaultValue="vas" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="vas">VAS Services</TabsTrigger>
                <TabsTrigger value="parking">Parking Services</TabsTrigger>
            </TabsList>

            <TabsContent value="vas" className="mt-6">
                <VasFinancialOverview data={vasData} />
            </TabsContent>

            <TabsContent value="parking" className="mt-6">
                <ParkingFinancialOverview data={parkingData} />
            </TabsContent>
        </Tabs>
    );
}