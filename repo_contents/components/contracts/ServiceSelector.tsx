// components/contracts/ServiceSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { ContractType, ServiceType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast/toast-context";
import { XCircle } from "lucide-react";
import { getServicesByType } from '@/actions/services/get';

interface Service {
  id: string;
  name: string;
  type: ServiceType;
}

interface SelectedService {
  serviceId: string;
  specificTerms?: string;
}

interface ServiceSelectorProps {
  contractId?: string;
  contractType: ContractType;
  selectedServices: SelectedService[];
  onChange: (services: SelectedService[]) => void;
  readOnly?: boolean;
  error?: string;
  disabled?: boolean;
}

export function ServiceSelector({
  contractType,
  selectedServices,
  onChange,
  readOnly = false,
  error,
  disabled = false
}: ServiceSelectorProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]); // Store all services for name lookup
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceToAddId, setServiceToAddId] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      
      const serviceTypes = getServiceTypesForContract(contractType);
      if (!serviceTypes.length) {
        setAvailableServices([]);
        setLoading(false);
        return;
      }

      try {
        const result = await getServicesByType(serviceTypes);
        if (result.data) {
          // Store all services for reference
          setAllServices(result.data);
          
          // Filter out already selected services
          const filtered = result.data.filter(service => 
            !selectedServices.some(s => s.serviceId === service.id)
          );
          setAvailableServices(filtered);
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load services", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (contractType && !readOnly) fetchServices();
  }, [contractType, selectedServices, readOnly]);

  // Get service name by ID
  const getServiceName = (serviceId: string): string => {
    const service = allServices.find(s => s.id === serviceId);
    return service ? `${service.name} (${service.type})` : "Unknown Service";
  };

  const handleAddService = () => {
    if (!serviceToAddId) {
      toast({ title: "Error", description: "Select a service first", variant: "destructive" });
      return;
    }

    const service = availableServices.find(s => s.id === serviceToAddId);
    if (!service) return;

    const newService: SelectedService = {
      serviceId: service.id,
      specificTerms: ""
    };

    onChange([...selectedServices, newService]);
    setServiceToAddId("");
    setSearchTerm("");
  };

  const handleRemoveService = (serviceId: string) => {
    onChange(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  const handleTermsChange = (serviceId: string, terms: string) => {
    onChange(selectedServices.map(s => 
      s.serviceId === serviceId ? { ...s, specificTerms: terms } : s
    ));
  };

  const filteredServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Service</Label>
              <Select
                value={serviceToAddId}
                onValueChange={setServiceToAddId}
                disabled={loading || readOnly || disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select service"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading || disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Add Service</Label>
              <Button 
                onClick={handleAddService}
                disabled={!serviceToAddId || loading || disabled}
                className="w-full"
              >
                Add Service
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Selected Services ({selectedServices.length})</Label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        
        {selectedServices.length === 0 ? (
          <div className="text-muted-foreground text-sm p-2 border rounded">
            No services selected
          </div>
        ) : (
          <div className="space-y-2">
            {selectedServices.map((service) => (
              <div key={service.serviceId} className="flex items-center gap-4 p-2 border rounded bg-background">
                <div className="flex-1">
                  <div className="font-medium">
                    {getServiceName(service.serviceId)}
                  </div>
                  <Input
                    placeholder="Specific terms..."
                    value={service.specificTerms || ""}
                    onChange={(e) => handleTermsChange(service.serviceId, e.target.value)}
                    disabled={readOnly || disabled}
                    className="mt-1"
                  />
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveService(service.serviceId)}
                    disabled={disabled}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to map contract types to service types
const getServiceTypesForContract = (contractType: ContractType): ServiceType[] => {
  switch (contractType) {
    case ContractType.PROVIDER:
      return [ServiceType.VAS, ServiceType.BULK];
    case ContractType.HUMANITARIAN:
      return [ServiceType.HUMANITARIAN];
    case ContractType.PARKING:
      return [ServiceType.PARKING];
    default:
      return [];
  }
};