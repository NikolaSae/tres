///components/contracts/ContractDetails.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { ExpiryWarning } from "@/components/contracts/ExpiryWarning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttachmentList } from "@/components/contracts/AttachmentList";
import { ReminderForm } from "@/components/contracts/ReminderForm";
import { Contract, ContractAttachment, ContractReminder, Service } from "@prisma/client";

interface ContractWithRelations extends Contract {
  provider?: { name: string; id: string } | null;
  humanitarianOrg?: { name: string; id: string } | null;
  parkingService?: { name: string; id: string } | null;
  operator?: { name: string; id: string } | null;
  services?: { service: Service }[];
  attachments?: ContractAttachment[];
  reminders?: ContractReminder[];
  createdBy: { name: string };
  lastModifiedBy?: { name: string } | null;
}

interface ContractDetailsProps {
  contract: ContractWithRelations;
}

export function ContractDetails({ contract }: ContractDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");

  const getRelatedEntityInfo = () => {
    switch (contract.type) {
      case "PROVIDER":
        return {
          type: "Provider",
          name: contract.provider?.name || "N/A",
          id: contract.provider?.id,
          link: contract.provider?.id ? `/providers/${contract.provider.id}` : undefined
        };
      case "HUMANITARIAN":
        return {
          type: "Humanitarian Organization",
          name: contract.humanitarianOrg?.name || "N/A",
          id: contract.humanitarianOrg?.id,
          link: contract.humanitarianOrg?.id ? `/humanitarian-orgs/${contract.humanitarianOrg.id}` : undefined
        };
      case "PARKING":
        return {
          type: "Parking Service",
          name: contract.parkingService?.name || "N/A",
          id: contract.parkingService?.id,
          link: contract.parkingService?.id ? `/parking-services/${contract.parkingService.id}` : undefined
        };
      default:
        return {
          type: "Unknown",
          name: "N/A"
        };
    }
  };

  const relatedEntity = getRelatedEntityInfo();

  const isExpiringSoon = () => {
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{contract.name}</h2>
          <p className="text-muted-foreground">Contract #{contract.contractNumber}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/contracts/${contract.id}/edit`)}
          >
            Edit Contract
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/contracts")}
          >
            Back to Contracts
          </Button>
        </div>
      </div>

      {isExpiringSoon() && (
        <ExpiryWarning endDate={contract.endDate} contractId={contract.id} />
      )}

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contract Type</p>
                <p>{contract.type}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div>
                  <ContractStatusBadge status={contract.status} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{relatedEntity.type}</p>
                <p>
                  {relatedEntity.link ? (
                    <Link
                      href={relatedEntity.link}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {relatedEntity.name}
                    </Link>
                  ) : (
                    relatedEntity.name
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Operator</p>
                <p>
                  {contract.operator?.id ? (
                    <Link
                      href={`/operators/${contract.operator.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {contract.operator.name}
                    </Link>
                  ) : (
                    "No operator assigned"
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Revenue Model</p>
                <p>{contract.isRevenueSharing ? "Revenue Sharing" : "Standard"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                <p>{contract.revenuePercentage}%</p>
              </div>

              {contract.isRevenueSharing && contract.operatorRevenue !== null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Operator Revenue</p>
                  <p>{contract.operatorRevenue}%</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p>{formatDate(contract.startDate)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p>{formatDate(contract.endDate)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p>{contract.createdBy?.name || "Unknown"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Modified By</p>
                <p>{contract.lastModifiedBy?.name || "N/A"}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="whitespace-pre-line">{contract.description || "No description provided."}</p>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Services</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.services && contract.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contract.services.map((serviceContract) => (
                    <Card key={serviceContract.service.id} className="overflow-hidden">
                      <CardHeader className="bg-muted p-4">
                        <CardTitle className="text-lg">{serviceContract.service.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {serviceContract.service.description || "No description available."}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No services associated with this contract.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contract Attachments</CardTitle>
              <Button
                size="sm"
                onClick={() => {/* Open attachment upload modal */}}
              >
                Add Attachment
              </Button>
            </CardHeader>
            <CardContent>
              <AttachmentList
                contractId={contract.id}
                attachments={contract.attachments || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contract Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Existing Reminders</h3>
                {contract.reminders && contract.reminders.length > 0 ? (
                  <div className="space-y-2">
                    {contract.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-4 border rounded-md ${
                          reminder.isAcknowledged ? 'bg-muted' : 'bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{reminder.reminderType}</div>
                            <div className="text-sm text-muted-foreground">
                              Reminder date: {formatDate(reminder.reminderDate)}
                            </div>
                          </div>
                          {!reminder.isAcknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {}} // Prazna funkcija, dodajte logiku kasnije
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reminders set for this contract.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Create New Reminder</h3>
                <ReminderForm contractId={contract.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
