// components/analytics/CombinedFinancialView.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VasFinancialOverview from "./VasFinancialOverview";
import ParkingFinancialOverview from "./ParkingFinancialOverview";
import HumanitarianFinancialOverview from "./HumanitarianFinancialOverview";
import {
  FinancialMetrics,
  ParkingFinancialMetrics,
  HumanitarianFinancialMetrics,
} from "@/app/(protected)/analytics/financials/actions";

interface CombinedFinancialViewProps {
  vasData: FinancialMetrics;
  parkingData: ParkingFinancialMetrics;
  humanitarianData: HumanitarianFinancialMetrics;
}

export default function CombinedFinancialView({
  vasData,
  parkingData,
  humanitarianData,
}: CombinedFinancialViewProps) {
  return (
    <Tabs defaultValue="vas" className="w-full">
      <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
        <TabsTrigger value="vas">VAS Services</TabsTrigger>
        <TabsTrigger value="parking">Parking</TabsTrigger>
        <TabsTrigger value="humanitarian">Humanitarian</TabsTrigger>
      </TabsList>

      <TabsContent value="vas" className="mt-6">
        <VasFinancialOverview data={vasData} />
      </TabsContent>

      <TabsContent value="parking" className="mt-6">
        <ParkingFinancialOverview data={parkingData} />
      </TabsContent>

      <TabsContent value="humanitarian" className="mt-6">
        <HumanitarianFinancialOverview data={humanitarianData} />
      </TabsContent>
    </Tabs>
  );
}