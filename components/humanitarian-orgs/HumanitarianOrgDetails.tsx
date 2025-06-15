// /components/humanitarian-orgs/HumanitarianOrgDetails.tsx
"use client";
import React from 'react';
import { HumanitarianOrgWithDetails } from '@/lib/types/humanitarian-org-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HumanitarianOrgDetailsProps {
    organization: HumanitarianOrgWithDetails;
}

export function HumanitarianOrgDetails({ organization }: HumanitarianOrgDetailsProps) {
    if (!organization) {
        return <div>No organization data available.</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <strong>Name:</strong> {organization.name}
                    </div>
                    <div>
                        <strong>Contact Person:</strong> {organization.contactName || 'N/A'}
                    </div>
                    <div>
                        <strong>Email:</strong> {organization.email || 'N/A'}
                    </div>
                    <div>
                        <strong>Phone:</strong> {organization.phone || 'N/A'}
                    </div>
                    <div>
                        <strong>Address:</strong> {organization.address || 'N/A'}
                    </div>
                    <div>
                        <strong>Website:</strong> {organization.website || 'N/A'}
                    </div>
                    <div>
                        <strong>Active:</strong> {organization.isActive ? 'Yes' : 'No'}
                    </div>
                    <div>
                        <strong>Created:</strong> {organization.createdAt.toLocaleString()}
                    </div>
                    <div>
                        <strong>Updated:</strong> {organization.updatedAt.toLocaleString()}
                    </div>
                </CardContent>
            </Card>
            {organization._count && (
                <Card>
                    <CardHeader>
                        <CardTitle>Related Entities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <strong>Contracts:</strong> {organization._count.contracts}
                        </div>
                        <div>
                            <strong>Complaints:</strong> {organization._count.complaints}
                        </div>
                        {organization._count.renewals !== undefined && (
                            <div>
                                <strong>Renewals:</strong> {organization._count.renewals}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}