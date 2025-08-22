// /components/complaints/StatusBadge.tsx
import { ComplaintStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "ASSIGNED":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "PENDING":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "RESOLVED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "REJECTED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "NEW":
        return "New";
      case "ASSIGNED":
        return "Assigned";
      case "IN_PROGRESS":
        return "In Progress";
      case "PENDING":
        return "Pending";
      case "RESOLVED":
        return "Resolved";
      case "CLOSED":
        return "Closed";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`font-medium ${getVariant()}`}
    >
      {getLabel()}
    </Badge>
  );
}