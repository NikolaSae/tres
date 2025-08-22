///components/services/category/HumanServiceCard.tsx

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Service } from '@/lib/types/service-types';

interface HumanServiceCardProps {
  service: Service;
  humanitarianOrg?: { id: string; name: string };
}

export function HumanServiceCard({ service, humanitarianOrg }: HumanServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
          <Badge className="bg-purple-100 text-purple-800">HUMANITARIAN</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {service.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
        )}
        {humanitarianOrg && (
          <div className="mb-2">
            <p className="text-xs text-gray-500">Organization</p>
            <Link href={`/humanitarian-orgs/${humanitarianOrg.id}`} className="text-sm font-medium text-blue-600 hover:underline">
              {humanitarianOrg.name}
            </Link>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {service.isActive ? 'Active' : 'Inactive'}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-end w-full">
          <Link href={`/services/humanitarian/${service.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}