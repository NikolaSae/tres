// /app/(protected)/services/[serviceType]/[id]/edit/page.tsx

import { Metadata } from "next";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getServiceById } from '@/actions/services/get';
import { ServiceType } from "@prisma/client";


interface EditServicePageProps {
    params: {
        serviceType: string;
        id: string;
    };
}

export async function generateMetadata(
    { params }: EditServicePageProps,
): Promise<Metadata> {
    const { id: paramId } = await params;

    const result = await getServiceById(paramId);
    const service = result.data;

    return {
        title: service ? `Edit ${service.name} | Management Dashboard` : "Edit Service | Management Dashboard",
        description: service ? `Edit details for service: ${service.name}` : "Edit service details page.",
    };
}


export default async function EditServicePage({ params }: EditServicePageProps) {

    const { serviceType: urlServiceType, id } = await params;


    const result = await getServiceById(id);


    if (result.error || !result.data) {
         return (
             <div className="p-6 text-center text-red-500">
                 {result.error || "Service not found."}
             </div>
         );
    }

    const service = result.data;


     if (service.type.toLowerCase() !== urlServiceType.toLowerCase()) {
         console.warn(`Service type mismatch in URL. Expected ${service.type}, got ${urlServiceType}.`);
     }


    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Service</h1>
                    <p className="text-gray-500">
                       Edit details for service: <span className="font-medium">{service.name}</span>
                    </p>
                </div>
            </div>

            <ServiceForm initialData={service} serviceId={id} />

        </div>
    );
}