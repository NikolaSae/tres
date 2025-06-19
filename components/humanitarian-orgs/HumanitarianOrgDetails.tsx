// /components/humanitarian-orgs/HumanitarianOrgDetails.tsx
"use client";
import React from 'react';
import { HumanitarianOrgWithDetails } from '@/lib/types/humanitarian-org-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";

interface HumanitarianOrgDetailsProps {
    organization: HumanitarianOrgWithDetails;
}
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('sr-RS', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function HumanitarianOrgDetails({ organization }: HumanitarianOrgDetailsProps) {
    if (!organization) {
        return <div>No organization data available.</div>;
    }

    return (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold border-b">Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Name</div>
              <div className="w-2/3 font-semibold">{organization.name}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Contact Person</div>
              <div className="w-2/3">{organization.contactName || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Email</div>
              <div className="w-2/3">
                {organization.email ? (
                  <a href={`mailto:${organization.email}`} className="text-blue-600 hover:underline">
                    {organization.email}
                  </a>
                ) : 'N/A'}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Phone</div>
              <div className="w-2/3">
                {organization.phone ? (
                  <a href={`tel:${organization.phone}`} className="text-blue-600 hover:underline">
                    {organization.phone}
                  </a>
                ) : 'N/A'}
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Address</div>
              <div className="w-2/3">{organization.address || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Website</div>
              <div className="w-2/3">
                {organization.website ? (
                  <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {organization.website}
                  </a>
                ) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">PIB</div>
              <div className="w-2/3 font-mono">{organization.pib || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Matični broj</div>
              <div className="w-2/3 font-mono">{organization.registrationNumber || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Banka</div>
              <div className="w-2/3">{organization.bank || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Tekući račun</div>
              <div className="w-2/3 font-mono">{organization.accountNumber || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Kratki broj</div>
              <div className="w-2/3 font-mono">{organization.shortNumber || 'N/A'}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Status</div>
              <div className="w-2/3">
                <Badge variant={organization.isActive ? "default" : "secondary"}>
                  {organization.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Created</div>
              <div className="w-2/3">{formatDate(organization.createdAt)}</div>
            </div>
            
            <div className="flex items-start">
              <div className="w-1/3 font-medium text-gray-500">Updated</div>
              <div className="w-2/3">{formatDate(organization.updatedAt)}</div>
            </div>
          </div>
        </div>
        
        {/* Mission Statement - Full Width */}
        {organization.mission && (
          <div className="mt-6 pt-4 border-t">
            <div className="font-medium text-gray-500 mb-2">Mission Statement</div>
            <p className="text-gray-700 italic">{organization.mission}</p>
          </div>
        )}
      </CardContent>
    </Card>
    
    {organization._count && (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold border-b">Related Entities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Contracts</div>
              <div className="text-2xl font-bold mt-1">{organization._count.contracts}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Complaints</div>
              <div className="text-2xl font-bold mt-1">{organization._count.complaints}</div>
            </div>
            
            {organization._count.renewals !== undefined && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Renewals</div>
                <div className="text-2xl font-bold mt-1">{organization._count.renewals}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);
}