
//components/providers/ProviderServicesForContracts.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, PlusCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { ServiceType } from "@prisma/client"; // Uvezite ServiceType

// Uvezite novu server akciju
import { getServicesForNewContracts } from "@/actions/providers/getServicesForNewContracts";

interface ServiceForContract {
  id: string;
  name: string;
  type: ServiceType;
  description: string | null;
}

interface ProviderServicesForContractsProps {
  providerId: string;
  providerName: string; // Dodajte providerName za pre-popunjavanje forme za ugovor
}

export default function ProviderServicesForContracts({ providerId, providerName }: ProviderServicesForContractsProps) {
  const [services, setServices] = useState<ServiceForContract[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getServicesForNewContracts(providerId);
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        setError(result.error || "Failed to fetch services.");
        setServices(null);
      }
    } catch (err) {
      console.error("Error fetching services for contracts:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setServices(null);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      fetchServices();
    } else {
      setIsLoading(false);
      setError("Provider ID is missing.");
    }
  }, [providerId, fetchServices]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchServices} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!services || services.length === 0) {
    return (
      <EmptyState
        title="No Services Found"
        description="This provider does not have any associated services for creating new contracts."
        actionLabel="Refresh Services"
        actionOnClick={fetchServices}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Services for New Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.type}</TableCell>
                  <TableCell>{service.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/contracts/new?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}&serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceType=${service.type}`}
                      passHref
                    >
                      <Button variant="outline" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Contract
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
