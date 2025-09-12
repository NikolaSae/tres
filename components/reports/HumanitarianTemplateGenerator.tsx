// components/reports/HumanitarianTemplateGenerator.tsx

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
import { CheckCircle, XCircle, AlertCircle, FileText, Loader2, Users } from 'lucide-react';
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

export function HumanitarianTemplateGenerator() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPaymentType, setSelectedPaymentType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [selectedTemplateType, setSelectedTemplateType] = useState<'telekom' | 'globaltel'>('telekom');
  const [generateForAll, setGenerateForAll] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TemplateGenerationResult | null>(null);

  const handleGenerate = async () => {
    // Input validation
    if (!selectedMonth || !selectedYear || selectedMonth < 1 || selectedMonth > 12) {
      toast({
        title: "Greška",
        description: "Molimo izaberite valjan mesec i godinu",
        variant: "destructive",
      });
      return;
    }

    // Date validation
    const targetDate = new Date(selectedYear, selectedMonth - 1);
    if (isNaN(targetDate.getTime())) {
      toast({
        title: "Greška", 
        description: "Nevaljan datum",
        variant: "destructive",
      });
      return;
    }

    // Prevent future dates (optional validation)
    const currentDate = new Date();
    if (targetDate > currentDate) {
      toast({
        title: "Upozorenje",
        description: "Generirate template za budući period",
        variant: "default",
      });
    }

    setIsGenerating(true);
    setProgress(0);
    setResult(null);

    let progressInterval: NodeJS.Timeout;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
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
        result = await generateAllHumanitarianReports(
          selectedMonth, 
          selectedYear, 
          selectedPaymentType, 
          selectedTemplateType
        );
      } else {
        // Generate only templates
        result = await generateHumanitarianTemplates(
          selectedMonth, 
          selectedYear, 
          selectedPaymentType, 
          selectedTemplateType
        );
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);

      if (result.success) {
        const actionType = generateForAll ? 'izveštaj(a)' : 'template(s)';
        const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth.toString();
        
        toast({
          title: "Uspešno generisano",
          description: `Generisano je ${result.processed} ${actionType} za ${monthName} ${selectedYear}`,
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
      
      // Clear progress interval if it's still running
      if (progressInterval!) {
        clearInterval(progressInterval);
      }
      setProgress(100);
      
      const errorMessage = error instanceof Error ? error.message : 'Došlo je do neočekivane greške';
      
      setResult({
        success: false,
        message: errorMessage,
        processed: 0,
        errors: [errorMessage]
      });
      
      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      // Clear progress after delay for UX
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            onValueChange={(value: 'prepaid' | 'postpaid') => setSelectedPaymentType(value)}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite tip plaćanja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prepaid">Prepaid</SelectItem>
              <SelectItem value="postpaid">Postpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateType">Tip template-a</Label>
          <Select
            value={selectedTemplateType}
            onValueChange={(value: 'telekom' | 'globaltel') => setSelectedTemplateType(value)}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Izaberite tip template-a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="telekom">Telekom</SelectItem>
              <SelectItem value="globaltel">Globaltel</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedMonth || !selectedYear}
          size="lg"
          className="w-full md:w-auto"
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.generatedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {file.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{file.organizationName}</span>
                          </div>
                          <Badge variant={file.status === 'success' ? 'default' : 'destructive'}>
                            {file.status === 'success' ? 'Uspešno' : 'Greška'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground ml-4 flex-shrink-0">
                          {file.fileName || 'No file generated'}
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
                  <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
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
            /reports/[kratki_broj]-organization-name/{selectedYear}/{selectedMonth.toString().padStart(2, '0')}/
          </code>
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