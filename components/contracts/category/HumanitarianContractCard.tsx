///components/contracts/category/HumanitarianContractCard.tsx


"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ExpiryWarning } from "@/components/contracts/ExpiryWarning";
import { HumanitarianRenewalSubStatus } from "@prisma/client";

interface HumanitarianContractCardProps {
  contract: {
    id: string;
    name: string;
    contractNumber: string;
    status: string;
    startDate: Date;
    endDate: Date;
    revenuePercentage: number;
    description?: string;
    humanitarianOrg?: {
      id: string;
      name: string;
      contactName?: string;
      email?: string;
      phone?: string;
    } | null;
    humanitarianRenewals?: {
      id: string;
      subStatus: HumanitarianRenewalSubStatus;
      renewalStartDate: Date;
      proposedStartDate: Date;
      proposedEndDate: Date;
      proposedRevenue: number;
      documentsReceived: boolean;
      legalApproved: boolean;
      financialApproved: boolean;
      signatureReceived: boolean;
    }[];
  };
}

export function HumanitarianContractCard({ contract }: HumanitarianContractCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const latestRenewal = contract.humanitarianRenewals && 
    contract.humanitarianRenewals.length > 0 ? 
    contract.humanitarianRenewals.sort((a, b) => 
      new Date(b.renewalStartDate).getTime() - new Date(a.renewalStartDate).getTime()
    )[0] : null;
  
  const getRenewalStatusText = (subStatus: HumanitarianRenewalSubStatus) => {
    const statusMap = {
      DOCUMENT_COLLECTION: "Collecting Documents",
      LEGAL_REVIEW: "Legal Review",
      FINANCIAL_APPROVAL: "Financial Approval",
      AWAITING_SIGNATURE: "Awaiting Signature",
      FINAL_PROCESSING: "Final Processing"
    };
    return statusMap[subStatus] || subStatus;
  };
  
  const getRenewalProgressPercentage = (renewal: any) => {
    const steps = [
      renewal.documentsReceived,
      renewal.legalApproved,
      renewal.financialApproved,
      renewal.signatureReceived
    ];
    
    const completedSteps = steps.filter(step => step).length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">
              <Link href={`/contracts/${contract.id}`} className="hover:underline text-blue-600">
                {contract.name}
              </Link>
            </h3>
            <p className="text-sm text-gray-500">Contract #{contract.contractNumber}</p>
          </div>
          <ContractStatusBadge status={contract.status} />
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Organization</p>
            <p>{contract.humanitarianOrg?.name || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Contact</p>
            <p>{contract.humanitarianOrg?.contactName || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Start Date</p>
            <p>{format(new Date(contract.startDate), "PPP")}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">End Date</p>
            <p className="flex items-center">
              {format(new Date(contract.endDate), "PPP")}
              {new Date(contract.endDate) > new Date() && 
                new Date(contract.endDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 && (
                <ExpiryWarning endDate={contract.endDate} />
              )}
            </p>
          </div>
        </div>
        
        {/* Renewal Status */}
        {latestRenewal && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-700">Renewal in Progress</h4>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{getRenewalStatusText(latestRenewal.subStatus)}</span>
                <span>{Math.round(getRenewalProgressPercentage(latestRenewal))}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${getRenewalProgressPercentage(latestRenewal)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toggle for additional details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-sm text-blue-600 hover:underline flex items-center"
        >
          {isExpanded ? "Show less" : "Show more"}
          <svg
            className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? "transform rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenue Percentage</p>
                <p>{contract.revenuePercentage}%</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{contract.humanitarianOrg?.email || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p>{contract.humanitarianOrg?.phone || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Contract Status</p>
                <ContractStatusBadge status={contract.status} />
              </div>
            </div>
            
            {contract.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-sm mt-1">{contract.description}</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <Link 
                href={`/contracts/${contract.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}