// /app/(protected)/humanitarian-orgs/[id]/page.tsx


import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { HumanitarianOrgWithDetails } from '@/lib/types/humanitarian-org-types';
import { HumanitarianOrgDetails } from "@/components/humanitarian-orgs/HumanitarianOrgDetails";
import { HumanitarianOrgContracts } from "@/components/humanitarian-orgs/HumanitarianOrgContracts";

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";


interface HumanitarianOrgDetailsPageProps {
    params: {
        id: string;
    };
}

async function getHumanitarianOrgDetails(orgId: string): Promise<HumanitarianOrgWithDetails | null> {
    try {
        const organization = await db.humanitarianOrg.findUnique({
            where: { id: orgId },
            include: {
                complaints: {
                    select: { id: true, title: true, status: true, createdAt: true },
                },
                renewals: true,
                _count: {
                    select: { contracts: true, complaints: true, renewals: true }
                }
            }
        });

        if (organization && !organization._count) {
             organization._count = { contracts: 0, complaints: 0, renewals: 0 };
        }

        return organization as HumanitarianOrgWithDetails | null;

    } catch (error) {
        console.error(`Error fetching humanitarian organization ${orgId} details from DB:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: HumanitarianOrgDetailsPageProps): Promise<Metadata> {
     const { id } = await params;
     const organization = await db.humanitarianOrg.findUnique({
         where: { id },
         select: { name: true }
     });

     return {
         title: organization ? `${organization.name} | Organization Details` : 'Organization Not Found',
         description: organization ? `Details for humanitarian organization ${organization.name}.` : 'Details for organization.',
     };
}

export default async function HumanitarianOrgDetailsPage({ params }: HumanitarianOrgDetailsPageProps) {
    const { id: orgId } = await params;

    const organization = await getHumanitarianOrgDetails(orgId);

    if (!organization) {
        notFound();
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
                    <p className="text-gray-500">
                        Details for humanitarian organization: {organization.id}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild variant="outline">
                        <Link href="/humanitarian-orgs">
                            Back to Organizations
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/humanitarian-orgs/${organization.id}/edit`}>
                            Edit Organization
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/contracts/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                            Create New Contract
                        </Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={`/complaints/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                            Submit Complaint
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts ({organization._count.contracts})</TabsTrigger>
                    <TabsTrigger value="complaints">Complaints ({organization._count.complaints})</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4">
                    <HumanitarianOrgDetails organization={organization} />
                </TabsContent>
                <TabsContent value="contracts" className="mt-4">
                    <div>
                        <Card>
                            <CardContent className="pt-6">
                                <Suspense fallback={<DetailSkeleton />}>
                                    <HumanitarianOrgContracts organizationId={organization.id} organizationName={organization.name} />
                                </Suspense>
                            </CardContent>
                        </Card>
                        {organization._count.contracts > 0 && (
                            <div className="mt-4 text-right">
                                <Button asChild variant="outline">
                                    <Link href={`/humanitarian-orgs/${organization.id}/contracts`}>
                                        View All Contracts
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="complaints" className="mt-4">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Complaints Associated with {organization.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href={`/complaints/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                                            Submit New Complaint
                                        </Link>
                                    </Button>
                                </div>
                                {organization._count.complaints > 0 && (
                                    <div className="mt-4 text-right">
                                        <Button asChild variant="outline">
                                            <Link href={`/humanitarian-orgs/${organization.id}/complaints`}>
                                                View All Complaints
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p>Placeholder for Complaints List Component.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
