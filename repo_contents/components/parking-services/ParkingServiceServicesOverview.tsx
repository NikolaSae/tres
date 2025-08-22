//components/parking-services/ParkingServiceServicesOverview.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Link as LinkIcon, Eye, EyeOff } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { ServiceType } from "@prisma/client";
import ServiceLinkToContractModal from "@/components/contracts/ServiceLinkToContractModal";

import { getServicesForParkingServiceContracts } from "@/actions/parking-services/getServicesForParkingServiceContracts";

interface ServiceForContract {
  id: string;
  name: string;
  type: ServiceType;
  description: string | null;
  contractCount: number;
}

interface ParkingServiceServicesOverviewProps {
  parkingServiceId: string;
  parkingServiceName: string;
}

export default function ParkingServiceServicesOverview({ 
  parkingServiceId, 
  parkingServiceName 
}: ParkingServiceServicesOverviewProps) {
  const [services, setServices] = useState<ServiceForContract[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedServiceForLink, setSelectedServiceForLink] = useState<{ id: string; name: string } | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getServicesForParkingServiceContracts(parkingServiceId, showAllServices);
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        setError(result.error || "Failed to fetch services.");
        setServices(null);
      }
    } catch (err) {
      console.error("Error fetching services for parking service:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setServices(null);
    } finally {
      setIsLoading(false);
    }
  }, [parkingServiceId, showAllServices]);

  useEffect(() => {
    if (parkingServiceId) {
      fetchServices();
    } else {
      setIsLoading(false);
      setError("Parking Service ID is missing.");
    }
  }, [parkingServiceId, fetchServices]);

  const handleOpenLinkModal = (service: ServiceForContract) => {
    setSelectedServiceForLink({ id: service.id, name: service.name });
    setIsLinkModalOpen(true);
  };

  const handleLinkModalClose = () => {
    setIsLinkModalOpen(false);
    setSelectedServiceForLink(null);
  };

  const handleLinkSuccess = () => {
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
        description={showAllServices 
          ? "This parking service does not have any associated services." 
          : "All services for this parking service are already linked to a contract."}
        actionLabel="Refresh Services"
        actionOnClick={fetchServices}
      >
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Parking Service Services Overview</CardTitle>
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
                  <TableHead>Contracts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.type}</TableCell>
                    <TableCell>{service.description || '-'}</TableCell>
                    <TableCell>{service.contractCount}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Link
                        href={`/contracts/new?parkingServiceId=${parkingServiceId}&parkingServiceName=${encodeURIComponent(parkingServiceName)}&serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}&serviceType=${service.type}`}
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
                        disabled={service.contractCount > 0}
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
          parkingServiceId={parkingServiceId}
          onLinkSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}