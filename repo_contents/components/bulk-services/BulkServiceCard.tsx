//components/bulk-services/BulkServiceCard.ts

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkService } from "@prisma/client";
import { CalendarIcon, BarChart2, MessageSquare, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BulkServiceCardProps {
  bulkService: BulkService & {
    provider: { name: string };
    service: { name: string };
  };
}

export function BulkServiceCard({ bulkService }: BulkServiceCardProps) {
  return (
    <Card className="h-full overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {bulkService.service_name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {bulkService.step_name}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" />
          {bulkService.provider.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Agreement:</span>
            <span className="font-medium">{bulkService.agreement_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sender:</span>
            <span className="font-medium">{bulkService.sender_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex flex-col bg-muted/30 p-2 rounded-md">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-3 w-3" /> Requests
              </span>
              <span className="font-semibold">{bulkService.requests.toLocaleString()}</span>
            </div>
            <div className="flex flex-col bg-muted/30 p-2 rounded-md">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Messages
              </span>
              <span className="font-semibold">{bulkService.message_parts.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1 flex justify-between items-center">
        <div className="text-xs text-muted-foreground flex items-center">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {formatDate(bulkService.createdAt)}
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/bulk-services/${bulkService.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default BulkServiceCard;