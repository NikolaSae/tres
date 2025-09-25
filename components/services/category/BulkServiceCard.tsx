///components/services/category/BulkServiceCard.tsx

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BulkServiceWithRelations } from '@/lib/types/service-types';

interface BulkServiceCardProps {
  bulkService: BulkServiceWithRelations;
}

export function BulkServiceCard({ bulkService }: BulkServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{bulkService.service_name}</CardTitle>
          <Badge className="bg-green-100 text-green-800">BULK</Badge>
        </div>
        <p className="text-gray-500 text-sm">
          {bulkService.agreement_name}
        </p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500">Provider</p>
            <p className="text-sm font-medium">{bulkService.provider_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Step</p>
            <p className="text-sm font-medium">{bulkService.step_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sender</p>
            <p className="text-sm font-medium">{bulkService.sender_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Message Parts</p>
            <p className="text-sm font-medium">{bulkService.message_parts.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <div>
            <p className="text-xs text-gray-500">Requests</p>
            <p className="text-sm font-medium">{bulkService.requests.toLocaleString()}</p>
          </div>
          <Link href={`/services/bulk/${bulkService.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}