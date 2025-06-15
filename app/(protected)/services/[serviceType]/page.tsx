// /app/(protected)/services/[serviceType]/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { ServiceList } from "@/components/services/ServiceList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ServiceType } from "@prisma/client";


interface ServicesByTypePageProps {
    params: {
        serviceType: string;
    };
}

export async function generateMetadata(
    { params }: ServicesByTypePageProps,
): Promise<Metadata> {
    const { serviceType: paramServiceType } = await params;

    const getServiceTypeLabel = (type: ServiceType) => {
         return type.replace(/_/g, ' ');
     };

    const type = paramServiceType.toUpperCase() as ServiceType;


     const formattedType = Object.values(ServiceType).includes(type) ? getServiceTypeLabel(type) : 'Unknown';


    return {
        title: `${formattedType} Services | Management Dashboard`,
        description: `List and manage ${formattedType} services.`,
    };
}


export default async function ServicesByTypePage({ params }: ServicesByTypePageProps) {

    const { serviceType: urlServiceType } = await params;


    const requestedType = urlServiceType.toUpperCase();


     if (!Object.values(ServiceType).includes(requestedType as ServiceType)) {
          return (
              <div className="p-6 text-center text-red-500">
                  Invalid service type: {urlServiceType}
              </div>
          );
     }

     const serviceType = requestedType as ServiceType;


     const getServiceTypeLabel = (type: ServiceType) => {
         return type.replace(/_/g, ' ');
     };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{getServiceTypeLabel(serviceType)} Services</h1>
                    <p className="text-gray-500">
                        Manage services of type {getServiceTypeLabel(serviceType)}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Button asChild>
                        <Link href={`/services/new?type=${serviceType}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New {getServiceTypeLabel(serviceType)}
                        </Link>
                     </Button>
                </div>
            </div>

            <ServiceList initialFilters={{ type: serviceType }} />

        </div>
    );
}