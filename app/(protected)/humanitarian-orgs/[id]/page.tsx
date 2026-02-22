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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";
import { Banknote, FileText, ClipboardList, AlertCircle, TrendingUp } from 'lucide-react';
import { getHumanitarianOrgFinancialData } from "@/actions/humanitarian-orgs/get-org-financial-stats";
import { formatCurrency } from "@/lib/formatters";

interface HumanitarianOrgDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function getHumanitarianOrgDetails(orgId: string): Promise<HumanitarianOrgWithDetails | null> {
  try {
    const organization = await db.humanitarianOrg.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { contracts: true, complaints: true, renewals: true }
        }
      }
    });

    if (!organization) return null;

    return {
      ...organization,
      _count: organization._count || { contracts: 0, complaints: 0, renewals: 0 }
    };
  } catch (error) {
    console.error(`Error fetching humanitarian organization ${orgId}:`, error);
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

  const [organization, { revenue, activeContracts, monthlyStats }] = await Promise.all([
    getHumanitarianOrgDetails(orgId),
    getHumanitarianOrgFinancialData(orgId),
  ]);

  if (!organization) notFound();

  const contractsCount = organization._count?.contracts ?? 0;
  const complaintsCount = organization._count?.complaints ?? 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            {organization.name}
          </h1>
          <p className="text-gray-500 mt-1">Organization ID: {organization.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/humanitarian-orgs">Back to Organizations</Link>
          </Button>
          <Button asChild>
            <Link href={`/humanitarian-orgs/${organization.id}/edit`}>Edit Organization</Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href={`/contracts/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
              <FileText className="mr-2 h-4 w-4" /> New Contract
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link href={`/complaints/new?orgId=${organization.id}&orgName=${encodeURIComponent(organization.name)}`}>
              <AlertCircle className="mr-2 h-4 w-4" /> Submit Complaint
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium">PIB</span>
          <span className="font-mono">{organization.pib || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium">Matični broj</span>
          <span className="font-mono">{organization.registrationNumber || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium">Banka</span>
          <span>{organization.bank || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium">Tekući račun</span>
          <span className="font-mono">{organization.accountNumber || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-blue-600 font-medium">Kratki broj</span>
          <span className="font-mono">{organization.shortNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Financial Summary Bar */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Total Revenue
          </span>
          <span className="font-mono text-lg font-semibold">
            {formatCurrency(revenue.totalRevenue)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Prepaid
          </span>
          <span className="font-mono text-lg font-semibold text-blue-700">
            {formatCurrency(revenue.prepaidAmount)}
          </span>
          {revenue.totalRevenue > 0 && (
            <span className="text-xs text-muted-foreground">
              {((revenue.prepaidAmount / revenue.totalRevenue) * 100).toFixed(1)}% of total
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Postpaid
          </span>
          <span className="font-mono text-lg font-semibold text-purple-700">
            {formatCurrency(revenue.postpaidAmount)}
          </span>
          {revenue.totalRevenue > 0 && (
            <span className="text-xs text-muted-foreground">
              {((revenue.postpaidAmount / revenue.totalRevenue) * 100).toFixed(1)}% of total
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <FileText className="w-3 h-3" /> Active Contracts
          </span>
          <span className="font-mono text-lg font-semibold">{activeContracts}</span>
        </div>
      </div>

      {/* Monthly Revenue Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Monthly Revenue Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-blue-500 uppercase">Prepaid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-500 uppercase">Postpaid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pre/Post split</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyStats.length > 0 ? (
                  monthlyStats.map((stat, index) => {
                    const prepaidPct = stat.total_amount > 0
                      ? (stat.prepaid_amount / stat.total_amount) * 100
                      : 0;
                    const postpaidPct = 100 - prepaidPct;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{stat.month_year}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(stat.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700">
                          {stat.prepaid_amount > 0 ? formatCurrency(stat.prepaid_amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-purple-700">
                          {stat.postpaid_amount > 0 ? formatCurrency(stat.postpaid_amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {stat.prepaid_amount > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                P {prepaidPct.toFixed(0)}%
                              </span>
                            )}
                            {stat.postpaid_amount > 0 && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                PP {postpaidPct.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {stat.transaction_count.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No transaction data available for this organization
                    </td>
                  </tr>
                )}
              </tbody>
              {monthlyStats.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(revenue.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-700">
                      {formatCurrency(revenue.prepaidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-purple-700">
                      {formatCurrency(revenue.postpaidAmount)}
                    </td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right text-gray-500">
                      {monthlyStats.reduce((s, m) => s + m.transaction_count, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contracts">
            <span className="flex items-center gap-1">
              Contracts <Badge variant="secondary">{contractsCount}</Badge>
            </span>
          </TabsTrigger>
          <TabsTrigger value="complaints">
            <span className="flex items-center gap-1">
              Complaints <Badge variant="secondary">{complaintsCount}</Badge>
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
                <FileText className="w-5 h-5" /> Contracts
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
            {contractsCount > 0 && (
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
                <AlertCircle className="w-5 h-5" /> Complaints
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
            {complaintsCount > 0 && (
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