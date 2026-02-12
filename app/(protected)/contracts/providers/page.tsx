///app/(protected)/contracts/providers/page.tsx

import { Suspense } from "react";
import { ContractsList } from "@/components/contracts/ContractList";
import { ContractTypeDistribution } from "@/components/contracts/charts/ContractTypeDistribution";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { ContractType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Provider Contracts | Management Dashboard",
  description: "View all provider contracts",
};

async function ContractTypeDistributionWrapper() {
  // Fetch contract type distribution data
  const contractTypeCounts = await db.contract.groupBy({
    by: ['type'],
    _count: {
      type: true,
    },
  });

  // Transform to the format expected by the component
  const data = contractTypeCounts.map(item => ({
    type: item.type as ContractType,
    count: item._count.type,
  }));

  return <ContractTypeDistribution data={data} />;
}

async function ProviderContractsListWrapper() {
  // Fetch provider contracts
  const contracts = await db.contract.findMany({
    where: {
      type: ContractType.PROVIDER,
    },
    include: {
      provider: { select: { id: true, name: true } },
      humanitarianOrg: { select: { id: true, name: true } },
      parkingService: { select: { id: true, name: true } },
      services: {
        include: {
          service: true,
        },
      },
      _count: { select: { services: true, attachments: true, reminders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform the data to match the expected Contract type
  const transformedContracts = contracts.map(contract => ({
    ...contract,
    provider: contract.provider ?? undefined, // Convert null to undefined
    humanitarianOrg: contract.humanitarianOrg ?? undefined,
    parkingService: contract.parkingService ?? undefined,
    services: contract.services.map(cs => cs.service),
  }));

  return <ContractsList contracts={transformedContracts} serverTime={new Date().toISOString()} />;
}

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
          <ContractTypeDistributionWrapper />
        </Suspense>
      </div>
      
      <Suspense fallback={<div>Loading provider contracts...</div>}>
        <ProviderContractsListWrapper />
      </Suspense>
    </div>
  );
}