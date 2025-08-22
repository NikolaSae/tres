// /components/providers/ProviderDetails.tsx
'use client';

import { ProviderWithDetails } from '@/lib/types/provider-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Keep Separator if you want it
import { formatDate } from "@/lib/utils"; // Assuming formatDate exists
import { AlertCircle, Phone, Mail, MapPin, Calendar, Clock } from "lucide-react"; // Import icons
import React from 'react'; // Import React

interface ProviderDetailsProps {
    provider: ProviderWithDetails;
}

const ProviderDetails: React.FC<ProviderDetailsProps> = ({ provider }) => {
    // Pretpostavljamo da provider prop nikada neće biti null/undefined
    // Parent page (npr. [id]/page.tsx) treba da rukuje 404 stanjem ako provajder nije pronađen.

    return (
        <div className="space-y-6">
            {/* Contact Information Card - Styled like ParkingServiceDetails */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {provider.contactName && (
                        <div className="flex items-start gap-2">
                             <span className="font-medium min-w-28">Contact Person:</span>
                             <span>{provider.contactName}</span>
                        </div>
                    )}
                    {provider.email && (
                        <div className="flex items-start gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <span>{provider.email}</span>
                        </div>
                    )}
                    {provider.phone && (
                        <div className="flex items-start gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <span>{provider.phone}</span>
                        </div>
                    )}
                    {provider.address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <span>{provider.address}</span>
                        </div>
                    )}
                    {!provider.contactName &&
                     !provider.email &&
                     !provider.phone &&
                     !provider.address && (
                      <div className="flex items-center text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        No contact information available
                      </div>
                    )}
                </CardContent>
            </Card>

            {/* System Information Card - Styled like ParkingServiceDetails */}
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                         <span className="text-muted-foreground mr-1">Created:</span>
                         {/* Use formatDate for consistent date display */}
                         <span>{formatDate(provider.createdAt)}</span>
                      </div>
                   </div>
                   <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                       <div>
                         <span className="text-muted-foreground mr-1">Last Updated:</span>
                         {/* Use formatDate for consistent date display */}
                         <span>{formatDate(provider.updatedAt)}</span>
                      </div>
                   </div>
                </CardContent>
            </Card>


            {/* Related Entities Card - Keep this as it's specific to Provider */}
            {provider._count && (
                 <Card>
                     <CardHeader>
                          <CardTitle className="text-lg">Related Entities</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4"> {/* Added space-y-4 for consistent spacing */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <p className="text-sm font-medium text-muted-foreground">Contracts</p>
                                  <p>{provider._count.contracts}</p>
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-muted-foreground">VAS Services</p>
                                  <p>{provider._count.vasServices}</p>
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-muted-foreground">Bulk Services</p>
                                  <p>{provider._count.bulkServices}</p>
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-muted-foreground">Complaints</p>
                                  <p>{provider._count.complaints}</p>
                              </div>
                         </div>
                     </CardContent>
                 </Card>
             )}

        </div>
    );
};

export default ProviderDetails; // Ensure default export if used as default in parent
