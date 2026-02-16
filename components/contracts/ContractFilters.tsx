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
import { Contract } from "@/lib/types/contract-types";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const serverDate = serverTime ? new Date(serverTime) : new Date();

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

  useEffect(() => {
    if (!mounted) return;
    
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
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="HUMANITARIAN">Humanitarian</SelectItem>
                <SelectItem value="PARKING">Parking</SelectItem>
                <SelectItem value="BULK">Bulk</SelectItem>
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="RENEWAL_IN_PROGRESS">Renewal In Progress</SelectItem>
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