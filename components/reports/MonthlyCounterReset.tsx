// components/reports/MonthlyCounterReset.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { resetMonthlyCounters } from '@/actions/reports/reset-monthly-counters';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CounterResetResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  resetOrganizations?: {
    organizationName: string;
    organizationId: string;
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

export function MonthlyCounterReset() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<CounterResetResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReset = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Greška",
        description: "Molimo izaberite mesec i godinu",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    setResult(null);
    setIsDialogOpen(false);

    try {
      const result = await resetMonthlyCounters(selectedMonth, selectedYear);
      setResult(result);

      if (result.success) {
        toast({
          title: "Uspešno resetovano",
          description: `Resetovani su brojači za ${result.processed} organizacija(e) za ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
        });
      } else {
        toast({
          title: "Greška pri resetovanju",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting counters:', error);
      setResult({
        success: false,
        message: 'Došlo je do neočekivane greške',
        processed: 0
      });
      toast({
        title: "Greška",
        description: "Došlo je do neočekivane greške prilikom resetovanja brojača",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="reset-month">Mesec</Label>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
            disabled={isResetting}
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
          <Label htmlFor="reset-year">Godina</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
            disabled={isResetting}
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

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isResetting || !selectedMonth || !selectedYear}
              className="w-full"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetujem...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetuj Brojače
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Potvrdite resetovanje brojača
              </AlertDialogTitle>
              <AlertDialogDescription>
                Da li ste sigurni da želite da resetujete mesečne brojače za sve humanitarne organizacije 
                za <strong>{selectedMonthLabel} {selectedYear}</strong>?
                <br /><br />
                Ova akcija će:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Resetovati sve postojeće brojače na 0</li>
                  <li>Uticati na numeraciju budućih template-a</li>
                  <li>Ne može biti poništena</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Otkaži</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Da, resetuj brojače
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </div>
          </Alert>

          {/* Organization Details */}
          {result.resetOrganizations && result.resetOrganizations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detalji resetovanja:</h4>
              <div className="space-y-1">
                {result.resetOrganizations.map((org, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                    <span className="font-medium">{org.organizationName}</span>
                    <Badge variant={org.status === 'success' ? 'default' : 'destructive'}>
                      {org.status === 'success' ? 'Resetovan' : 'Greška'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {result.errors && result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-800">Greške:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-xs text-red-700">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Napomena:</strong> Resetovanje brojača utiče na numeraciju template-a (kolona D18). 
          Koristiti pažljivo jer može dovesti do dupliciranja brojeva ako su već generirani template-i za dati mesec.
        </AlertDescription>
      </Alert>
    </div>
  );
}