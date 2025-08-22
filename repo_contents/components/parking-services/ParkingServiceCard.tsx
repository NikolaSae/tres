//components/parking-services/ParkingServiceCard.tsx

"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParkingServiceItem } from "@/lib/types/parking-service-types";
import { formatDate } from "@/lib/utils";

interface ParkingServiceCardProps {
  service: ParkingServiceItem;
}

export default function ParkingServiceCard({ service }: ParkingServiceCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        {service.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {service.description}
          </p>
        )}
        
        <div className="space-y-2 mt-3">
          {service.contactName && (
            <div className="text-sm">
              <span className="font-medium">Contact:</span> {service.contactName}
            </div>
          )}
          
          <div className="space-y-1">
            {service.email && (
              <div className="flex items-center text-sm gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{service.email}</span>
              </div>
            )}
            
            {service.phone && (
              <div className="flex items-center text-sm gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{service.phone}</span>
              </div>
            )}
            
            {service.address && (
              <div className="flex items-center text-sm gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{service.address}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center text-xs gap-1.5 text-muted-foreground mt-4">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(service.createdAt)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            asChild
          >
            <Link href={`/parking-services/${service.id}/edit`}>
              Edit
            </Link>
          </Button>
          <Button 
            size="sm" 
            className="w-full" 
            asChild
          >
            <Link href={`/parking-services/${service.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}