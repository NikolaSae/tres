//components/providers/ProviderServicesOverview.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, PlusCircle, Link as LinkIcon, Eye, EyeOff } from "lucide-react"; // Dodat Eye, EyeOff
import EmptyState from "@/components/EmptyState";
import { ServiceType } from "@prisma/client";

import { getServicesForNewContracts } from "@/actions/providers/getServicesForNewContracts";
import ServiceLinkToContractModal from "@/components/contracts/ServiceLinkToContractModal";

interface ServiceForContract {
  id: string;
  name: string;
  type: ServiceType;
  description: string | null;
}

interface ProviderServicesOverviewProps {
  providerId: string;
  providerName: string;
}

export default function ProviderServicesOverview({ providerId, providerName }: ProviderServicesOverviewProps) {
  const [services, setServices] = useState<ServiceForContract[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false); // NOVO STANJE

  // Stanje za modal za povezivanje servisa
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedServiceForLink, setSelectedServiceForLink] = useState<{ id: string; name: string } | null>(null);


  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // PROSLEĐUJEMO NOVI PARAMETAR
      const result = await getServicesForNewContracts(providerId, showAllServices);
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
  }, [providerId, showAllServices]); // Dodat showAllServices u dependency array

  useEffect(() => {
    if (providerId) {
      fetchServices();
    } else {
      setIsLoading(false);
      setError("Provider ID is missing.");
    }
  }, [providerId, fetchServices]);

  const handleOpenLinkModal = (service: ServiceForContract) => {
    setSelectedServiceForLink({ id: service.id, name: service.name });
    setIsLinkModalOpen(true);
  };

  const handleLinkModalClose = () => {
    setIsLinkModalOpen(false);
    setSelectedServiceForLink(null);
  };

  const handleLinkSuccess = () => {
    // Osveži listu servisa nakon uspešnog povezivanja
    fetchServices();
  };

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
        title={showAllServices ? "No Services Found" : "No Unlinked Services Found"}
        description={showAllServices ? "This provider does not have any associated services." : "All services for this provider are already linked to a contract."}
        actionLabel="Refresh Services"
        actionOnClick={fetchServices}
      >
        {/* Dugme za prebacivanje prikaza */}
        <Button
          variant="outline"
          onClick={() => setShowAllServices(prev => !prev)}
          className="mt-4"
        >
          {showAllServices ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" /> Show Only Unlinked
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" /> Show All Services
            </>
          )}
        </Button>
      </EmptyState>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"> {/* Dodat flex za dugme */}
          <CardTitle className="text-lg">Provider Services Overview</CardTitle>
          {/* Dugme za prebacivanje prikaza */}
          <Button
            variant="outline"
            onClick={() => setShowAllServices(prev => !prev)}
            size="sm"
          >
            {showAllServices ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" /> Show Only Unlinked
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" /> Show All Services
              </>
            )}
          </Button>
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
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Link
                        href={`/contracts/new?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}&serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceType=${service.type}`}
                        passHref
                      >
                        <Button variant="outline" size="sm">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          New Contract
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenLinkModal(service)}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Link to Existing
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedServiceForLink && (
        <ServiceLinkToContractModal
          isOpen={isLinkModalOpen}
          onClose={handleLinkModalClose}
          serviceId={selectedServiceForLink.id}
          serviceName={selectedServiceForLink.name}
          providerId={providerId}
          onLinkSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}
