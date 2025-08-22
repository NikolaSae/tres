// /app/(protected)/services/[serviceType]/[id]/page.tsx
import { Metadata } from "next";
import { ServiceDetails } from "@/components/services/ServiceDetails";
import { getServiceById } from '@/actions/services/get';
// ServiceType import je uklonjen jer nije korišćen direktno u ovom delu koda


interface ServiceDetailsPageProps {
    // params je Promise u async Server Komponentama
    params: Promise<{
        serviceType: string;
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: ServiceDetailsPageProps,
): Promise<Metadata> {
    // Awaitujte params prop
    const resolvedParams = await params;
    // Sada pristupite svojstvima
    const { id: paramId } = resolvedParams;

    const result = await getServiceById(paramId);
    const service = result.data;
    
    return {
        title: service ? `${service.name} Details | Management Dashboard` : "Service Details | Management Dashboard",
        description: service ? `Details for service: ${service.name}` : "Service details page.",
    };
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
    // Awaitujte params prop
    const resolvedParams = await params;
    // Sada pristupite svojstvima
    const { serviceType: urlServiceType, id } = resolvedParams;
    
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Service Details</h1>
                    <p className="text-gray-500">
                       View the details for this service
                    </p>
                </div>
            </div>
            <ServiceDetails serviceId={id} />
        </div>
    );
}