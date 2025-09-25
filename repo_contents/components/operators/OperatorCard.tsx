// components/operators/OperatorCard.tsx


"use client";

import { Operator } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Globe, Mail, Phone } from "lucide-react";
import Image from "next/image";

interface OperatorCardProps {
  operator: Operator;
}

export function OperatorCard({ operator }: OperatorCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col pt-6">
        <div className="mb-4 flex items-center justify-between">
          {operator.logoUrl ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-md">
              <Image
                src={operator.logoUrl}
                alt={`${operator.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-xl font-bold text-gray-500">
              {operator.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <Badge variant={operator.active ? "success" : "destructive"}>
            {operator.active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <h3 className="mb-1 text-lg font-semibold">{operator.name}</h3>
        <p className="mb-3 text-sm text-gray-500">Code: {operator.code}</p>

        {operator.description && (
          <p className="mb-4 line-clamp-3 text-sm text-gray-600">
            {operator.description}
          </p>
        )}

        <div className="mt-auto space-y-2">
          {operator.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-gray-500" />
              <a
                href={operator.website.startsWith('http') ? operator.website : `https://${operator.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {operator.website.replace(/(^\w+:|^)\/\//, '')}
              </a>
            </div>
          )}

          {operator.contactEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <a
                href={`mailto:${operator.contactEmail}`}
                className="text-blue-600 hover:underline"
              >
                {operator.contactEmail}
              </a>
            </div>
          )}

          {operator.contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <a
                href={`tel:${operator.contactPhone}`}
                className="text-blue-600 hover:underline"
              >
                {operator.contactPhone}
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-gray-50 px-6 py-3">
        <div className="flex w-full justify-between gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/operators/${operator.id}`}>View Details</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/operators/${operator.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}