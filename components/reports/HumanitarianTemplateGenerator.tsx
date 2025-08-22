// components/reports/HUmanitarianTemplateGenerator.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, CheckCircle, XCircle, AlertCircle, FileText, Loader2, Users, Building } from 'lucide-react';
import { generateHumanitarianTemplates } from '@/actions/reports/generate-humanitarian-templates';
import { generateAllHumanitarianReports } from '@/actions/reports/generate-all-humanitarian-reports';
import { toast } from '@/hooks/use-toast';

interface TemplateGenerationResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  generatedFiles?: {
    organizationName: string;
    fileName: string;
    status: 'success' | 'error';
    message?: string;
  }[];
}

const MONTHS = [
  { value: 1, label: 'Januar' },
  { value: 2, label: 'Februar' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Avgust' },
  { value: 9, label: 'Septembar' },
  { value: 10, label: 'Oktobar' },
  { value: 11, label: 'Novembar' },
  { value: 12, label: 'Decembar' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

const PAYMENT_TYPES = [
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'prepaid', label: 'Prepaid' },
];

export function HumanitarianTemplateGenerator() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('postpaid');
  const [generateForAll, setGenerateForAll] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TemplateGenerationResult | null>(null);

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear || !selectedPaymentType) {
      toast({
        title: "Greška",
        description: "Molimo izaberite mesec, godinu i tip plaćanja",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let result: TemplateGenerationResult;

      if (generateForAll) {
        // Generate reports for all organizations
        result = await generateAllHumanitarianReports(selectedMonth, selectedYear, selectedPaymentType);
      } else {
        // Generate only templates
        result = await generateHumanitarianTemplates(selectedMonth, selectedYear, selectedPaymentType);
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);

      if (result.success) {
        const actionType = generateForAll ? 'izveštaj(a)' : 'template(s)';
        toast({
          title: "Uspešno generisano",
          description: `Generisano je ${result.processed} ${actionType} za ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
        });
      } else {
        toast({
          title: "Greška pri generisanju",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating templates/reports:', error);
      setResult({
        success: false,
        message: 'Došlo je do neočekivane greške',
        processed: 0
      });
      toast({
        title: "Greška",
        description: "Došlo je do neočekivane greške prilikom generisanja",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        if (!isGenerating) {
          setProgress(0);
        }
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="month">Mesec</Label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite mesec" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Godina</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite godinu" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentType">Tip plaćanja</Label>
          <Select
            value={selectedPaymentType}
            onValueChange={setSelectedPaymentType}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite tip" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedMonth || !selectedYear || !selectedPaymentType}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generišem...
              </>
            ) : (
              <>
                {generateForAll ? (
                  <Users className="mr-2 h-4 w-4" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {generateForAll ? 'Generiši Izveštaje' : 'Generiši Template-e'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generation Options */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="generateForAll"
          checked={generateForAll}
          onCheckedChange={(checked) => setGenerateForAll(checked === true)}
          disabled={isGenerating}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="generateForAll"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Generiši kompletne izveštaje za sve organizacije
          </Label>
          <p className="text-xs text-muted-foreground">
            {generateForAll 
              ? 'Generiše kompletne izveštaje sa podacima iz baze za sve humanitarne organizacije' 
              : 'Generiše samo template-e koji će biti popunjeni osnovnim podacima organizacije'
            }
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Napredak generisanja</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>

              {/* File Generation Details */}
              {result.generatedFiles && result.generatedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Detalji generisanja:</h4>
                  <div className="space-y-2">
                    {result.generatedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {file.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{file.organizationName}</span>
                          </div>
                          <Badge variant={file.status === 'success' ? 'default' : 'destructive'}>
                            {file.status === 'success' ? 'Uspešno' : 'Greška'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {file.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Greške:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {generateForAll ? (
            <>
              <strong>Kompletni izveštaji:</strong> Generiše se kompletni izveštaj sa podacima iz baze podataka 
              za sve humanitarne organizacije. Fajlovi će biti sačuvani u:
            </>
          ) : (
            <>
              <strong>Template-i:</strong> Generiše se osnovna struktura sa osnovnim podacima organizacije. 
              Template-i će biti generisani u folderima organizacija na putanji:
            </>
          )}
          <code className="ml-1 text-sm bg-muted px-1 py-0.5 rounded">
            /reports/[organizacija-id]/{selectedYear}/{selectedMonth.toString().padStart(2, '0')}/
          </code>
          <br />
          Tip plaćanja: <strong>{PAYMENT_TYPES.find(t => t.value === selectedPaymentType)?.label}</strong>
          {!generateForAll && (
            <>
              <br />
              Template-i će biti popunjeni osnovnim podacima i povećan će biti brojač naloga.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}