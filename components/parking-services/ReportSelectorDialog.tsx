// components/parking-services/ReportSelectorDialog.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, HardDrive, Mail, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Report {
  path: string;
  name: string;
  size: number;
  month: string;
  year: string;
  type: 'PREPAID' | 'POSTPAID' | 'UNKNOWN';
}

interface EmailData {
  cc: string;
  subject: string;
  body: string;
}

interface ReportSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: Report[];
  serviceName: string;
  serviceEmail: string;
  additionalEmails?: string[];
  onConfirm: (selectedReports: Report[], emailData: EmailData) => void;
  loading?: boolean;
}

// Email template-ovi
const EMAIL_TEMPLATES = {
  PREPAID: {
    subject: (serviceName: string, month: string, year: string) =>
      `Mesečni PREPAID izveštaj - ${serviceName} - ${month}/${year}`,
    body: (monthRange: string) =>
      `Poštovani,\n\nU prilogu vam dostavljamo Micropayment izveštaj za period ${monthRange}.\n\nFajlovi u prilogu:\n{FILES}\n\nPozdrav,\nVaš tim`
  },
  POSTPAID: {
    subject: (serviceName: string, month: string, year: string) =>
      `Mesečni POSTPAID izveštaj - ${serviceName} - ${month}/${year}`,
    body: (monthRange: string) =>
      `Poštovani,\n\nU prilogu se nalaze izveštaji za period ${monthRange}.\n\nFajlovi u prilogu:\n{FILES}\n\nPozdrav,\nVaš tim`
  }
};

export default function ReportSelectorDialog({
  open,
  onOpenChange,
  reports,
  serviceName,
  serviceEmail,
  additionalEmails = [],
  onConfirm,
  loading = false
}: ReportSelectorDialogProps) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [ccEmails, setCcEmails] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setSelectedReports(new Set());
    setCcEmails('');

    if (reports.length > 0) {
      const { type, month, year } = reports[0];
      const monthRange = formatMonthRange(month, year);

      if (type === 'PREPAID' || type === 'POSTPAID') {
        const template = EMAIL_TEMPLATES[type];
        setEmailSubject(template.subject(serviceName, month, year));
        setEmailBody(template.body(monthRange));
      }
    }
  }, [reports, serviceName]);

  const handleToggle = (reportPath: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportPath)) newSet.delete(reportPath);
      else newSet.add(reportPath);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) setSelectedReports(new Set(reports.map(r => r.path)));
    else setSelectedReports(new Set());
  };

  const handleConfirm = () => {
    const selected = reports.filter(r => selectedReports.has(r.path));
    const filesList = selected.map(r => `- ${r.name}`).join('\n');
    const finalBody = emailBody.replace('{FILES}', filesList);

    onConfirm(selected, {
      cc: ccEmails,
      subject: emailSubject,
      body: finalBody
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatMonthRange = (month: string, year: string) => {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}.${year}`;
  };

  const useTemplate = (type: 'PREPAID' | 'POSTPAID') => {
    if (!reports.length) return;
    const { month, year } = reports[0];
    const monthRange = formatMonthRange(month, year);
    const template = EMAIL_TEMPLATES[type];
    setEmailSubject(template.subject(serviceName, month, year));
    setEmailBody(template.body(monthRange));
    toast.success(`${type} template učitan`);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      toast.success('Kopirano!');
      setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    } catch {
      toast.error('Greška pri kopiranju');
    }
  };

  const isAllSelected = selectedReports.size === reports.length && reports.length > 0;
  const isIndeterminate = selectedReports.size > 0 && selectedReports.size < reports.length;
  const allRecipients = [serviceEmail, ...additionalEmails].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Izaberite izveštaje i prilagodite email</DialogTitle>
          <DialogDescription>
            Servis: <span className="font-semibold">{serviceName}</span>
            <br />
            Pronađeno: <span className="font-semibold">{reports.length}</span> izveštaja
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">📋 Izveštaji ({selectedReports.size})</TabsTrigger>
            <TabsTrigger value="email">✉️ Email poruka</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="select-all" checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll}/>
              <Label htmlFor="select-all" className="cursor-pointer font-medium">
                Izaberi sve ({selectedReports.size}/{reports.length})
              </Label>
            </div>

            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {reports.map((report, index) => (
                  <div key={report.path} className={`border rounded-lg p-3 transition-colors ${selectedReports.has(report.path) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox id={`report-${index}`} checked={selectedReports.has(report.path)} onCheckedChange={() => handleToggle(report.path)} className="mt-1"/>
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`report-${index}`} className="cursor-pointer block">
                          <div className="flex items-start gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5"/>
                            <span className="font-medium text-sm break-all leading-tight">{report.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><HardDrive className="h-3 w-3"/><span>{formatFileSize(report.size)}</span></div>
                            <div className="flex items-center gap-1"><Calendar className="h-3 w-3"/><span>{report.month}/{report.year}</span></div>
                            <div><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.type==='PREPAID'?'bg-blue-100 text-blue-700':report.type==='POSTPAID'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{report.type}</span></div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="h-4 w-4"/> Primaoci (TO)</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border space-y-1">
                    {allRecipients.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-mono">{email}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={()=>copyToClipboard(email, `to-${idx}`)}>
                          {copied[`to-${idx}`]? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3"/>}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cc-emails">CC (opciono)</Label>
                  <Input id="cc-emails" placeholder="email1@example.com; email2@example.com" value={ccEmails} onChange={e=>setCcEmails(e.target.value)}/>
                  <p className="text-xs text-muted-foreground">Odvojite email adrese tačka-zarezom (;)</p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={()=>useTemplate('PREPAID')}>📝 Prepaid template</Button>
                  <Button type="button" variant="outline" size="sm" onClick={()=>useTemplate('POSTPAID')}>📝 Postpaid template</Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Naslov email-a</Label>
                  <Input id="email-subject" value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} placeholder="Unesite naslov..."/>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Tekst poruke</Label>
                  <Textarea id="email-body" value={emailBody} onChange={e=>setEmailBody(e.target.value)} placeholder="Unesite tekst poruke..." rows={12} className="font-mono text-sm"/>
                  <p className="text-xs text-muted-foreground">💡 Koristite <code className="px-1 py-0.5 bg-gray-100 rounded">{'{FILES}'}</code> kao placeholder za listu fajlova</p>
                </div>

                {selectedReports.size>0 && (
                  <div className="space-y-2">
                    <Label>📄 Preview liste fajlova</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border text-sm font-mono whitespace-pre-wrap">
                      {reports.filter(r=>selectedReports.has(r.path)).map(r=>`- ${r.name}`).join('\n')}
                    </div>
                  </div>
                )}

              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>Otkaži</Button>
          <Button onClick={handleConfirm} disabled={selectedReports.size===0 || loading || !emailSubject.trim() || !emailBody.trim()}>
            {loading ? 'Šaljem...' : `Potvrdi (${selectedReports.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
