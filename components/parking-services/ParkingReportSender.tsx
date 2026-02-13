// components/parking-services/ParkingReportSender.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, CheckCircle2, XCircle, Loader2, RefreshCw, FileText } from "lucide-react";
import toast from "react-hot-toast";
import ReportSelectorDialog from "./ReportSelectorDialog";

interface ParkingService {
  id: string;
  name: string;
  email: string | null;
  additionalEmails: string[];
  isActive: boolean;
}

interface ReportFile {
  path: string;
  name: string;
  size: number;
  month: string;
  year: string;
  type: 'PREPAID' | 'POSTPAID' | 'UNKNOWN';
}

interface SendStatus {
  serviceId: string;
  status: 'pending' | 'draftOpened' | 'error';
  message?: string;
  timestamp?: string;
  reportCount?: number;
}

interface EmailData {
  cc: string;
  subject: string;
  body: string;
}

export default function ParkingReportSender({ parkingServices }: { parkingServices: ParkingService[] }) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [reportType, setReportType] = useState<'PREPAID' | 'POSTPAID' | 'BOTH'>('BOTH');
  const [availableReports, setAvailableReports] = useState<Map<string, ReportFile[]>>(new Map());
  const [isFetching, setIsFetching] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus[]>([]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogService, setDialogService] = useState<ParkingService | null>(null);
  const [dialogReports, setDialogReports] = useState<ReportFile[]>([]);
  const [isSending, setIsSending] = useState(false);

  const years = Array.from({ length: 3 }, (_, i) => (new Date().getFullYear() - i).toString());

  const months = [
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "Mart" },
    { value: "04", label: "April" },
    { value: "05", label: "Maj" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Avgust" },
    { value: "09", label: "Septembar" },
    { value: "10", label: "Oktobar" },
    { value: "11", label: "Novembar" },
    { value: "12", label: "Decembar" },
  ];

  useEffect(() => {
    fetchAvailableReports();
  }, [selectedYear, selectedMonth, reportType, selectedServices]);

  const fetchAvailableReports = async () => {
    if (selectedServices.size === 0) {
      setAvailableReports(new Map());
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch('/api/parking-services/reports/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds: Array.from(selectedServices),
          year: selectedYear,
          month: selectedMonth,
          type: reportType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reports');
      }

      const data = await response.json();
      setAvailableReports(new Map(Object.entries(data.reports)));
    } catch (error: any) {
      console.error(error);
      toast.error(`Greška pri učitavanju izveštaja: ${error.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const toggleAllServices = () => {
    const servicesWithEmail = parkingServices.filter(s => s.email || s.additionalEmails.length > 0);
    if (selectedServices.size === servicesWithEmail.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(servicesWithEmail.map(s => s.id)));
    }
  };

  const getReportCount = (serviceId: string) => availableReports.get(serviceId)?.length || 0;

  const formatMonthRange = (month: string, year: string) => {
    const monthIndex = parseInt(month, 10) - 1;
    const start = new Date(Number(year), monthIndex, 1);
    const end = new Date(Number(year), monthIndex + 1, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getDate())}.${pad(start.getMonth()+1)} - ${pad(end.getDate())}.${pad(end.getMonth()+1)}.${year}`;
  };

  const openDialogForService = (service: ParkingService) => {
    const reports = availableReports.get(service.id) || [];
    if (!reports.length) {
      toast.error(`Nema dostupnih izveštaja za ${service.name}`);
      return;
    }
    setDialogService(service);
    setDialogReports(reports);
    setDialogOpen(true);
  };

  const handleConfirmReports = async (selectedReports: ReportFile[], emailData: EmailData) => {
  if (!dialogService || selectedReports.length === 0) return;

  setIsSending(true);

  try {
    // Kreiraj listu primaoca
    const recipients = [dialogService.email, ...(dialogService.additionalEmails || [])]
      .filter(Boolean)
      .join(';');

    // Grupiši reportove po tipu
    const prepaidReports = selectedReports.filter(r => r.type === 'PREPAID');
    const postpaidReports = selectedReports.filter(r => r.type === 'POSTPAID');

    // Ako ima oba tipa, otvori 2 drafta
    if (prepaidReports.length > 0 && postpaidReports.length > 0) {
      // PREPAID draft
      const prepaidSubject = emailData.subject.replace(/(PREPAID|POSTPAID)/, 'PREPAID');
      const prepaidBody = `${emailData.body}\n\nFajlovi u prilogu:\n${prepaidReports.map(r => `- ${r.name}`).join('\n')}`;
      const prepaidMailto = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(prepaidSubject)}&body=${encodeURIComponent(prepaidBody)}${emailData.cc ? `&cc=${encodeURIComponent(emailData.cc)}` : ''}`;
      
      // POSTPAID draft
      const postpaidSubject = emailData.subject.replace(/(PREPAID|POSTPAID)/, 'POSTPAID');
      const postpaidBody = `${emailData.body}\n\nFajlovi u prilogu:\n${postpaidReports.map(r => `- ${r.name}`).join('\n')}`;
      const postpaidMailto = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(postpaidSubject)}&body=${encodeURIComponent(postpaidBody)}${emailData.cc ? `&cc=${encodeURIComponent(emailData.cc)}` : ''}`;

      window.open(prepaidMailto, '_blank');
      setTimeout(() => window.open(postpaidMailto, '_blank'), 500);
      
      toast.success(`Otvorena 2 drafta za ${dialogService.name} (PREPAID + POSTPAID)`);
    } else {
      // Samo jedan tip reporta
      const mailtoLink = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}${emailData.cc ? `&cc=${encodeURIComponent(emailData.cc)}` : ''}`;
      window.open(mailtoLink, '_blank');
      
      toast.success(`Draft otvoren za ${dialogService.name} (${selectedReports.length} izveštaj${selectedReports.length > 1 ? 'a' : ''})`);
    }

    const now = new Date().toISOString();
    setSendStatus(prev => [
      ...prev.filter(s => s.serviceId !== dialogService.id),
      { 
        serviceId: dialogService.id, 
        status: 'draftOpened', 
        timestamp: now,
        reportCount: selectedReports.length
      }
    ]);

    setDialogOpen(false);
  } catch (error: any) {
    console.error(error);
    toast.error(`Greška: ${error.message}`);
    setSendStatus(prev => [
      ...prev.filter(s => s.serviceId !== dialogService.id),
      { 
        serviceId: dialogService.id, 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }
    ]);
  } finally {
    setIsSending(false);
  }
};

  const handleOpenAllDrafts = () => {
    const servicesToProcess = Array.from(selectedServices)
      .map(id => parkingServices.find(s => s.id === id))
      .filter((s): s is ParkingService => s !== undefined && getReportCount(s.id) > 0);

    if (servicesToProcess.length === 0) {
      toast.error('Nema servisa sa dostupnim izveštajima');
      return;
    }

    // Otvori dijalog za prvi servis
    openDialogForService(servicesToProcess[0]);
    
    // TODO: Možeš dodati queue sistem da automatski otvara sledeće nakon što korisnik potvrdi prvi
  };

  const getSendStatusIcon = (status: SendStatus['status']) => {
    switch (status) {
      case 'pending': return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
      case 'draftOpened': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const allSelected = selectedServices.size === parkingServices.filter(s => s.email || s.additionalEmails.length > 0).length;
  const someSelected = selectedServices.size > 0 && !allSelected;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5"/> Slanje izveštaja
              </CardTitle>
              <CardDescription>
                Izaberite parking servise i period za slanje mesečnih izveštaja
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAvailableReports} 
              disabled={isFetching || selectedServices.size === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> 
              Osveži
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Godina</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Izaberite godinu" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mesec</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue placeholder="Izaberite mesec" /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tip izveštaja</Label>
              <Select value={reportType} onValueChange={v => setReportType(v as any)}>
                <SelectTrigger><SelectValue placeholder="Tip" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Prepaid + Postpaid</SelectItem>
                  <SelectItem value="PREPAID">Samo Prepaid</SelectItem>
                  <SelectItem value="POSTPAID">Samo Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Services Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Parking servisi</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={toggleAllServices}
              >
                {allSelected ? 'Poništi sve' : 'Izaberi sve'}
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {parkingServices.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nema aktivnih parking servisa
                </div>
              ) : (
                parkingServices.map(service => {
                  const isSelected = selectedServices.has(service.id);
                  const reportCount = getReportCount(service.id);
                  const statusItem = sendStatus.find(s => s.serviceId === service.id);
                  const hasEmail = service.email || service.additionalEmails.length > 0;

                  return (
                    <div 
                      key={service.id} 
                      className={`flex items-center gap-3 p-4 transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox 
                        id={service.id} 
                        checked={isSelected} 
                        disabled={!hasEmail}
                        onCheckedChange={() => toggleService(service.id)} 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={service.id} 
                          className={`font-medium cursor-pointer block ${
                            !hasEmail ? 'text-gray-400' : ''
                          }`}
                        >
                          {service.name}
                        </Label>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="truncate">
                            {service.email || 'Nema email-a'}
                          </span>
                          
                          {isSelected && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {isFetching ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  `${reportCount} izveštaj${reportCount !== 1 ? 'a' : ''}`
                                )}
                              </span>
                            </>
                          )}

                          {statusItem && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {getSendStatusIcon(statusItem.status)}
                                {statusItem.status === 'draftOpened' && statusItem.reportCount && (
                                  <span className="text-green-600">
                                    Poslato {statusItem.reportCount}
                                  </span>
                                )}
                                {statusItem.message && (
                                  <span className="text-red-600">{statusItem.message}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {isSelected && reportCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialogForService(service)}
                          disabled={isFetching}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Otvori draft
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedServices.size > 0 && (
                <span>
                  Izabrano: <strong>{selectedServices.size}</strong> servis
                  {selectedServices.size !== 1 ? 'a' : ''}
                </span>
              )}
            </div>
            
            <Button 
              onClick={handleOpenAllDrafts} 
              disabled={selectedServices.size === 0 || isFetching}
              size="lg" 
              className="gap-2"
            >
              <Send className="h-4 w-4" /> 
              Otvori sve draftove ({selectedServices.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Selector Dialog */}
{dialogService && (
  <ReportSelectorDialog
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    reports={dialogReports}
    serviceName={dialogService.name}
    serviceEmail={dialogService.email || ''}
    additionalEmails={dialogService.additionalEmails}
    onConfirm={handleConfirmReports}
    loading={isSending}
  />
)}
    </>
  );
}