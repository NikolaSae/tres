// /app/(protected)/humanitarian-orgs/[id]/edit/page.tsx

import { Metadata } from "next";
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { HumanitarianOrg } from '@prisma/client';
import { HumanitarianOrgForm } from "@/components/humanitarian-orgs/HumanitarianOrgForm";

interface EditHumanitarianOrgPageProps {
    params: {
        id: string;
    };
}

async function getHumanitarianOrgDetails(orgId: string): Promise<HumanitarianOrg | null> {
    try {
        return await db.humanitarianOrg.findUnique({
            where: { id: orgId },
        });
    } catch (error) {
        console.error(`Error fetching humanitarian organization ${orgId} details for editing from DB:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: EditHumanitarianOrgPageProps): Promise<Metadata> {
     const { id } = await params;
     const organization = await getHumanitarianOrgDetails(id);

     return {
         title: organization ? `Edit ${organization.name} | Organization Management` : 'Edit Organization',
         description: organization ? `Edit details for humanitarian organization ${organization.name}.` : 'Edit organization details.',
     };
 }

export default async function EditHumanitarianOrgPage({ params }: EditHumanitarianOrgPageProps) {
    const { id: orgId } = await params;
    const organization = await getHumanitarianOrgDetails(orgId);

    if (!organization) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Humanitarian Organization</h1>
                <p className="text-gray-500">
                     Edit details for organization: {organization.name}
                </p>
             </div>

            <div className="bg-white rounded-lg shadow p-6">
                <HumanitarianOrgForm organization={organization} isEditing={true} />
            </div>
        </div>
    );
}