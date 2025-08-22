///components/services/ServiceCard.tsx


import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ServiceType } from '@prisma/client';
import { Service } from '@/lib/types/service-types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const getTypeColor = (type: ServiceType) => {
    switch (type) {
      case 'VAS':
        return 'bg-blue-100 text-blue-800';
      case 'BULK':
        return 'bg-green-100 text-green-800';
      case 'HUMANITARIAN':
        return 'bg-purple-100 text-purple-800';
      case 'PARKING':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
          <Badge className={getTypeColor(service.type)}>{service.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {service.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.description}</p>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {service.isActive ? 'Active' : 'Inactive'}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-end w-full">
          <Link href={`/services/${service.type.toLowerCase()}/${service.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}