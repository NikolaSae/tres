///components/contracts/category/ParkingContractCard.tsx


"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ExpiryWarning } from "@/components/contracts/ExpiryWarning";

interface ParkingContractCardProps {
  contract: {
    id: string;
    name: string;
    contractNumber: string;
    status: string;
    startDate: Date;
    endDate: Date;
    revenuePercentage: number;
    description?: string;
    parkingService?: {
      id: string;
      name: string;
      description?: string;
      contactName?: string;
      email?: string;
      phone?: string;
    } | null;
    services?: {
      serviceId: string;
      service: {
        id: string;
        name: string;
        type: string;
      };
    }[];
  };
}

export function ParkingContractCard({ contract }: ParkingContractCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
            <p className="text-sm font-medium text-gray-500">Parking Service</p>
            <p>{contract.parkingService?.name || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Contact</p>
            <p>{contract.parkingService?.contactName || "N/A"}</p>
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
        
        {/* Service count summary */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Services:</span> {contract.services?.length || 0} parking services included
          </p>
        </div>
        
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
                <p>{contract.parkingService?.email || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p>{contract.parkingService?.phone || "N/A"}</p>
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
            
            {contract.services && contract.services.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Included Services</p>
                <ul className="space-y-1">
                  {contract.services.map((serviceContract) => (
                    <li key={serviceContract.serviceId} className="text-sm pl-3 border-l-2 border-gray-200">
                      {serviceContract.service.name}
                    </li>
                  ))}
                </ul>
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