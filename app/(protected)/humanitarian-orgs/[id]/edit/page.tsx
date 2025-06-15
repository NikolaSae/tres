// /app/(protected)/humanitarian-orgs/[id]/edit/page.tsx

import { Metadata } from "next";
import { notFound } from 'next/navigation';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
// Uvozimo model Humanitarne Organizacije iz Prisma klijenta za tipizaciju
import { HumanitarianOrg } from '@prisma/client';
// Uvozimo komponentu forme koju ćemo koristiti na ovoj stranici
// Ova komponenta će biti kreirana u sledećim koracima
import { HumanitarianOrgForm } from "@/components/humanitarian-orgs/HumanitarianOrgForm";


interface EditHumanitarianOrgPageProps {
    params: {
        id: string; // ID humanitarne organizacije iz dinamičkog segmenta rute
    };
}

// Funkcija za dohvatanje detalja humanitarne organizacije za potrebe editovanja na serveru
// Ne uključujemo duboke relacije ovde, samo osnovne podatke za formu
async function getHumanitarianOrgDetails(orgId: string): Promise<HumanitarianOrg | null> {
    try {
        const organization = await db.humanitarianOrg.findUnique({
            where: { id: orgId },
            // Za formu za editovanje, obično nam ne trebaju include relacije, samo osnovni podaci
        });

        return organization;

    } catch (error) {
        console.error(`Error fetching humanitarian organization ${orgId} details for editing from DB:`, error);
        return null; // Vraća null u slučaju greške
    }
}

// Generisanje metadata za stranicu
export async function generateMetadata({ params }: EditHumanitarianOrgPageProps): Promise<Metadata> {
     // Sačekaj params pre pristupanja svojstvima
     const { id } = await params;
     const organization = await getHumanitarianOrgDetails(id);

     return {
         title: organization ? `Edit ${organization.name} | Organization Management` : 'Edit Organization',
         description: organization ? `Edit details for humanitarian organization ${organization.name}.` : 'Edit organization details.',
     };
 }


// Glavna Server Komponenta za stranicu editovanja humanitarne organizacije
export default async function EditHumanitarianOrgPage({ params }: EditHumanitarianOrgPageProps) {
    // Sačekaj params pre pristupanja svojstvima
    const { id: orgId } = await params;

    const organization = await getHumanitarianOrgDetails(orgId);

    // Ako organizacija nije pronađena, prikaži 404 stranicu
    if (!organization) {
        notFound();
    }

    // Priprema default vrednosti za formu
    // Koristimo direktno organization objekat, HumanitarianOrgForm će ga mapirati
    const defaultValues = organization;

    return (
        <div className="p-6 space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Humanitarian Organization</h1>
                <p className="text-gray-500">
                     Edit details for organization: {organization.name}
                </p>
             </div>

            <div className="bg-white rounded-lg shadow p-6">
                // Renderujemo komponentu forme za editovanje organizacije
                // Prosleđujemo postojeće podatke i isEditing flag
                <HumanitarianOrgForm organization={defaultValues} isEditing={true} />
            </div>
        </div>
    );
}