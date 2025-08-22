// /components/complaints/ServiceCategoryFilter.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
}

interface ServiceCategoryFilterProps {
  services: Service[];
  selectedServiceId?: string;
  onChange: (serviceId: string | null) => void;
}

export default function ServiceCategoryFilter({
  services,
  selectedServiceId,
  onChange,
}: ServiceCategoryFilterProps) {
  return (
    <Select
      value={selectedServiceId || ""}
      onValueChange={(value) => onChange(value || null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="All Services" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Services</SelectItem>
        {services.map((service) => (
          <SelectItem key={service.id} value={service.id}>
            {service.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}