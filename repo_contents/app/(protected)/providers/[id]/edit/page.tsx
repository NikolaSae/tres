// /app/(protected)/providers/[id]/edit/page.tsx
import { Metadata } from "next";
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Provider } from '@prisma/client'; // Uvoz Provider modela

import { ProviderForm } from "@/components/providers/ProviderForm";


interface EditProviderPageProps {
    params: {
        id: string;
    };
}

// Funkcija za dohvatanje detalja provajdera na serveru
async function getProviderDetails(providerId: string): Promise<Provider | null> {
    try {
        const provider = await db.provider.findUnique({
            where: { id: providerId },
            // Za formu za editovanje, obično nam ne trebaju include relacije, samo osnovni podaci
        });

        return provider;

    } catch (error) {
        console.error(`Error fetching provider ${providerId} details for editing from DB:`, error);
        return null;
    }
}

// Generisanje metadata za stranicu
export async function generateMetadata({ params }: EditProviderPageProps): Promise<Metadata> {
     const { id } = await params; // Sačekaj params, pa uzmi id
     const provider = await getProviderDetails(id);

     return {
         title: provider ? `Edit ${provider.name} | Provider Management` : 'Edit Provider',
         description: provider ? `Edit details for provider ${provider.name}.` : 'Edit provider details.',
     };
 }


// Glavna Server Komponenta za stranicu editovanja provajdera
export default async function EditProviderPage({ params }: EditProviderPageProps) {
    const { id: providerId } = await params;

    const provider = await getProviderDetails(providerId);

    if (!provider) {
        notFound();
    }

    const defaultValues = provider;


    return (
        <div className="p-6 space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Provider</h1>
                <p className="text-gray-500">
                     Edit details for provider: {provider.name}
                </p>
             </div>

            <div className="bg-white rounded-lg shadow p-6">

                <ProviderForm provider={defaultValues} isEditing={true} />
            </div>
        </div>
    );
}