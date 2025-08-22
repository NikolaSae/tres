///components/services/category/VasServiceCard.tsx


import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { VasServiceWithRelations } from '@/lib/types/service-types';

interface VasServiceCardProps {
  vasService: VasServiceWithRelations;
}

export function VasServiceCard({ vasService }: VasServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{vasService.proizvod}</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">VAS</Badge>
        </div>
        <p className="text-gray-500 text-sm">
          {format(new Date(vasService.mesec_pruzanja_usluge), 'MMMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500">Provider</p>
            <p className="text-sm font-medium">{vasService.provider?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Transactions</p>
            <p className="text-sm font-medium">{vasService.broj_transakcija.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Unit Price</p>
            <p className="text-sm font-medium">{formatCurrency(vasService.jedinicna_cena)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Invoiced Amount</p>
            <p className="text-sm font-medium">{formatCurrency(vasService.fakturisan_iznos)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <div>
            <p className="text-xs text-gray-500">Collected</p>
            <p className="text-sm font-medium text-green-600">{formatCurrency(vasService.naplacen_iznos)}</p>
          </div>
          <Link href={`/services/vas/${vasService.id}`} passHref>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}