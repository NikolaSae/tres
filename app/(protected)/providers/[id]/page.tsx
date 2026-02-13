// /app/(protected)/providers/[id]/page.tsx
 
import { Metadata } from "next";
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getProviderDetails } from '@/actions/providers/getProviderDetails';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";

import ProviderDetails from "@/components/providers/ProviderDetails";
import ProviderContracts from "@/components/providers/ProviderContracts";
import ProviderServicesOverview from "@/components/providers/ProviderServicesOverview";


interface ProviderDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({ params }: ProviderDetailsPageProps): Promise<Metadata> {
     const { id } = await params;
     const providerResult = await getProviderDetails(id);

     return {
         title: providerResult.success && providerResult.data ? `${providerResult.data.name} | Provider Details` : 'Provider Not Found',
         description: providerResult.success && providerResult.data ? `Details for provider ${providerResult.data.name}.` : 'Details for provider.',
     };
}

async function ProviderDetailsFetcher({ providerId }: { providerId: string }) {
    const providerResult = await getProviderDetails(providerId);

    if (!providerResult.success || !providerResult.data) {
        notFound();
    }

    const provider = providerResult.data;
    return <ProviderDetails provider={provider} />;
}

async function ProviderServicesOverviewFetcher({ providerId, providerName }: { providerId: string; providerName: string }) {
    return <ProviderServicesOverview providerId={providerId} providerName={providerName} />;
}


export default async function ProviderDetailsPage({ params }: ProviderDetailsPageProps) {
    const { id: providerId } = await params;

    const providerHeaderResult = await getProviderDetails(providerId);

     if (!providerHeaderResult.success || !providerHeaderResult.data) {
         notFound();
     }

     const providerForHeader = providerHeaderResult.data;


    return (
        <div className="container mx-auto py-6 space-y-6">
            <PageHeader
                title={providerForHeader.name}
                description={`Details for provider: ${providerId}`}
                actions={
                    <Link href={`/providers/${providerId}/edit`} passHref>
                        <Button>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Provider
                        </Button>
                    </Link>
                }
                backLink={{
                    href: "/providers",
                    label: "Back to Providers",
                }}
            />

            <Tabs defaultValue="details">
                <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="services-overview">Services Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <Card>
                        <CardContent className="pt-6">
                            <Suspense fallback={<DetailSkeleton />}>
                                <ProviderDetailsFetcher providerId={providerId} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contracts">
                     <Card>
                        <CardContent className="pt-6">
                            <Suspense fallback={<DetailSkeleton />}>
                                <ProviderContracts providerId={providerId} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services-overview">
                    <Card>
                        <CardContent className="pt-6">
                            <Suspense fallback={<DetailSkeleton />}>
                                <ProviderServicesOverviewFetcher
                                    providerId={providerId}
                                    providerName={providerForHeader.name}
                                />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}