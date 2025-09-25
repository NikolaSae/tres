// /components/complaints/ProviderFilter.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Provider {
  id: string;
  name: string;
}

interface ProviderFilterProps {
  providers: Provider[];
  selectedProviderId?: string;
  onChange: (providerId: string | null) => void;
  disabled?: boolean;
}

export default function ProviderFilter({
  providers,
  selectedProviderId,
  onChange,
  disabled = false,
}: ProviderFilterProps) {
  return (
    <Select
      value={selectedProviderId || ""}
      onValueChange={(value) => onChange(value || null)}
      disabled={disabled || providers.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={disabled ? "Select a service first" : "All Providers"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Providers</SelectItem>
        {providers.map((provider) => (
          <SelectItem key={provider.id} value={provider.id}>
            {provider.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}