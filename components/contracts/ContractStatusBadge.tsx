///components/contracts/ContractStatusBadge.tsx

import { Badge } from "@/components/ui/badge";
import { ContractStatus } from "@prisma/client";

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const getStatusConfig = (status: ContractStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          variant: "success" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-100"
        };
      case "EXPIRED":
        return {
          label: "Expired",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-100"
        };
      case "PENDING":
        return {
          label: "Pending",
          variant: "warning" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        };
      case "RENEWAL_IN_PROGRESS":
        return {
          label: "Renewal In Progress",
          variant: "outline" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100"
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: ""
        };
    }
  };

  const { label, className } = getStatusConfig(status);

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
}