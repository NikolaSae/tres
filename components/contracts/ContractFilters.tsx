// /components/contracts/ContractFilters.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContractType, ContractStatus } from "@prisma/client";

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  revenuePercentage: number;
  provider?: { id: string; name: string } | null;
  humanitarianOrg?: { id: string; name: string } | null;
  parkingService?: { id: string; name: string } | null;
  createdAt: Date;
}

interface ContractFiltersProps {
  contracts: Contract[] | undefined | null;
  onFilterChange: (filtered: Contract[]) => void;
  serverTime?: string; 
}

export function ContractFilters({ contracts, onFilterChange, serverTime }: ContractFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expiringSoon, setExpiringSoon] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Fix for hydration mismatch - only render the component when mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse the server time only once when component mounts
  const serverDate = serverTime ? new Date(serverTime) : new Date();

  // Define the filtering function with useCallback to prevent recreations
  const applyFilters = useCallback(() => {
    const contractsToFilter = Array.isArray(contracts) ? contracts : [];
    let filtered = [...contractsToFilter];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        contract =>
          contract.name.toLowerCase().includes(term) ||
          contract.contractNumber.toLowerCase().includes(term)
      );
    }

    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter(contract => contract.type === selectedType);
    }

    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(contract => contract.status === selectedStatus);
    }

    if (expiringSoon) {
      const today = new Date(serverDate);
      const thirtyDaysFromNow = new Date(serverDate);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter(contract => {
        const endDate = new Date(contract.endDate);
        return !isNaN(endDate.getTime()) && endDate > today && endDate <= thirtyDaysFromNow;
      });
    }

    return filtered;
  }, [searchTerm, selectedType, selectedStatus, expiringSoon, contracts, serverDate]);

  // Apply filters when filter criteria or contracts change
  useEffect(() => {
    if (!mounted) return;
    
    // Use requestAnimationFrame to ensure filtering happens after rendering
    const timeoutId = setTimeout(() => {
      const filteredResults = applyFilters();
      onFilterChange(filteredResults);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [applyFilters, onFilterChange, mounted]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedStatus("all");
    setExpiringSoon(false);
  };

  // Don't render until client-side
  if (!mounted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>Loading filters...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search by name or number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(ContractType).map(type => (
                  <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(ContractStatus).map(status => (
                  <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="expiringSoon"
              checked={expiringSoon}
              onChange={(e) => setExpiringSoon(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="expiringSoon" className="text-sm">Expiring within 30 days</label>

            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}