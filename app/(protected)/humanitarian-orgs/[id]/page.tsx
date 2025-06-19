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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Badge } from '@/components/ui/badge'; // Added Badge import
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";
import { Banknote, FileText, ClipboardList, AlertCircle } from 'lucide-react'; // Added Banknote

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
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        {organization.name}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Organization ID: {organization.id}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link href={`/contracts/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            New Contract
                        </Link>
                    </Button>
                    <Button asChild variant="destructive">
                        <Link href={`/complaints/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Submit Complaint
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Financial Summary Bar */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> PIB
                    </span>
                    <span className="font-mono">{organization.pib || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Matični broj
                    </span>
                    <span className="font-mono">{organization.registrationNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Banka
                    </span>
                    <span>{organization.bank || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Tekući račun
                    </span>
                    <span className="font-mono">{organization.accountNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Kratki broj
                    </span>
                    <span className="font-mono">{organization.shortNumber || 'N/A'}</span>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="contracts">
                        <span className="flex items-center gap-1">
                            Contracts <Badge variant="secondary">{organization._count.contracts}</Badge>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="complaints">
                        <span className="flex items-center gap-1">
                            Complaints <Badge variant="secondary">{organization._count.complaints}</Badge>
                        </span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-6">
                    <HumanitarianOrgDetails organization={organization} />
                </TabsContent>
                
                <TabsContent value="contracts" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Contracts
                            </CardTitle>
                            <Button asChild size="sm">
                                <Link href={`/contracts/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                                    New Contract
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Suspense fallback={<DetailSkeleton />}>
                                <HumanitarianOrgContracts 
                                    organizationId={organization.id} 
                                    organizationName={organization.name} 
                                />
                            </Suspense>
                        </CardContent>
                        {organization._count.contracts > 0 && (
                            <CardFooter className="justify-end pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={`/humanitarian-orgs/${organization.id}/contracts`}>
                                        View All Contracts
                                    </Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>
                
                <TabsContent value="complaints" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Complaints
                            </CardTitle>
                            <Button asChild variant="destructive" size="sm">
                                <Link href={`/complaints/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
                                    Submit Complaint
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <p className="text-yellow-700">Complaints management is coming soon!</p>
                                <p className="text-sm text-yellow-600 mt-2">
                                    We're currently developing this feature. In the meantime, you can submit new complaints.
                                </p>
                            </div>
                        </CardContent>
                        {organization._count.complaints > 0 && (
                            <CardFooter className="justify-end pt-4 border-t">
                                <Button asChild variant="outline">
                                    <Link href={`/humanitarian-orgs/${organization.id}/complaints`}>
                                        View All Complaints
                                    </Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}