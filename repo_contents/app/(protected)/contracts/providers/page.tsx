///app/(protected)/contracts/providers/page.tsx


import { Suspense } from "react";
import { ContractList } from "@/components/contracts/ContractList";
import { ContractTypeDistribution } from "@/components/contracts/charts/ContractTypeDistribution";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider Contracts | Management Dashboard",
  description: "View all provider contracts",
};

export default function ProviderContractsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Provider Contracts</h1>
        <p className="text-gray-500">
          View and manage all provider contracts
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <Suspense fallback={<div>Loading contract statistics...</div>}>
          <ContractTypeDistribution type="PROVIDER" />
        </Suspense>
      </div>
      
      <Suspense fallback={<div>Loading provider contracts...</div>}>
        <ContractList filter="provider" />
      </Suspense>
    </div>
  );
}