///components/services/category/ParkingServiceCard.tsx

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Service } from '@/lib/types/service-types';

interface ParkingServiceCardProps {
  service: Service;
  parkingProvider?: { id: string; name: string };
}

export function ParkingServiceCard({ service, parkingProvider }: ParkingServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
          <Badge className="bg-amber-100 text-amber-800">PARKING</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {service.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
        )}
        {parkingProvider && (
          <div className="mb-2">
            <p className="text-xs text-gray-500">Parking Provider</p>
            <p className="text-sm font-medium">{parkingProvider.name}</p>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {service.isActive ? 'Active' : 'Inactive'}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-end w-full">
          <Link href={`/services/parking/${service.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}