///app/(protected)/contracts/[id]/page.tsx

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContractDetails } from "@/components/contracts/ContractDetails";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { AttachmentList } from "@/components/contracts/AttachmentList";
import { ExpiryWarning } from "@/components/contracts/ExpiryWarning";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { calculateContractRevenue } from "@/lib/contracts/revenue-calculator";
import { RevenueBreakdown } from "@/components/contracts/RevenueBreakdown";


export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const { id } = await params;

    const contract = await db.contract.findUnique({
      where: { id },
      select: {
        name: true,
        contractNumber: true
      }
    });

    if (!contract) {
      return {
        title: "Contract Not Found",
        description: "The requested contract could not be found",
      };
    }

    return {
      title: `${contract.name} | Contract Details`,
      description: `View details for contract ${contract.contractNumber}`,
    };
  } catch (error) {
    console.error("[METADATA_ERROR]", error);
    return {
      title: "Error Loading Contract Metadata",
      description: "There was an error loading contract information for metadata",
    };
  }
}

interface ContractPageProps {
  params: {
    id: string;
  };
}

async function getContract(id: string) {
  try {
    console.log(`[GET_CONTRACT] Fetching contract with ID: ${id}`);

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        reminders: {
           orderBy: { reminderDate: 'asc' }
        },
        provider: true,
        humanitarianOrg: true,
        parkingService: true,
        operator: true,
        services: {
          include: {
            service: true,
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { name: true }
            },
          },
        },
        createdBy: {
           select: { name: true }
        },
        lastModifiedBy: {
           select: { name: true }
        },
      },
    });

    if (!contract) {
      console.warn(`[GET_CONTRACT] Contract with ID ${id} not found.`);
      notFound();
    }

     console.log(`[GET_CONTRACT] Contract found:`, {
       id: contract.id,
       name: contract.name,
       contractNumber: contract.contractNumber,
       type: contract.type,
       providerId: contract.providerId,
       provider: contract.provider ? contract.provider.name : "No provider data",
       operatorId: contract.operatorId,
       operator: contract.operator ? contract.operator.name : "No operator data",
       serviceCount: contract.services?.length || 0,
       reminderCount: contract.reminders?.length || 0,
       attachmentCount: contract.attachments?.length || 0
     });


    return contract;
  } catch (error) {
    console.error(`[GET_CONTRACT_ERROR] Failed to fetch contract with ID ${id}:`, error);
    notFound();
  }
}


export default async function ContractPage({ params }: ContractPageProps) {
  const { id } = await params;

  const contract = await getContract(id);

  const contractRevenueData = await calculateContractRevenue(contract.id);


  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{contract.name}</h1>
          <ContractStatusBadge status={contract.status} />
        </div>
        <p className="text-gray-500">
          Contract #{contract.contractNumber}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={`/contracts/${contract.id}/edit`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 py-2 px-4"
        >
          Edit Contract
        </a>
      </div>

      {contract.status === "ACTIVE" && (
        <Suspense fallback={<div>Checking expiry...</div>}>
          <ExpiryWarning contractId={contract.id} endDate={contract.endDate} />
        </Suspense>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <RevenueBreakdown
                contractId={contract.id}
                contractType={contract.type}
                revenuePercentage={contract.revenuePercentage}
                revenueData={contractRevenueData || undefined}
            />

            <ContractDetails contract={contract} />

          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Attachments</h2>
            <AttachmentList contractId={contract.id} attachments={contract.attachments || []} />
          </div>
        </div>
      </div>
    </div>
  );
}