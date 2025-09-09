// components/reports/TemplateValidator.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FileText, Folder, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ValidationResult {
  templateExists: boolean;
  templateReadable: boolean;
  templateSize: number;
  reportsDirectoryExists: boolean;
  reportsDirectoryWritable: boolean;
  excelJSAvailable: boolean;
  pythonAvailable: boolean;
  databaseConnection: boolean;
  organizationCount: number;
  errors: string[];
}

export function TemplateValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const runValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Call a validation API endpoint
      const response = await fetch('/api/reports/validate-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Validation API error: ${response.status}`);
      }

      const result = await response.json();
      setValidationResult(result);

      const criticalIssues = [
        !result.templateExists,
        !result.templateReadable,
        !result.reportsDirectoryExists,
        !result.databaseConnection
      ].filter(Boolean).length;

      if (criticalIssues === 0) {
        toast({
          title: "Validacija uspešna",
          description: "Svi kritični komponenti su dostupni",
        });
      } else {
        toast({
          title: "Pronađeni problemi",
          description: `${criticalIssues} kritičnih problema pronađeno`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Greška validacije",
        description: "Ne mogu da pokretnem validaciju sistema",
        variant: "destructive",
      });
      
      setValidationResult({
        templateExists: false,
        templateReadable: false,
        templateSize: 0,
        reportsDirectoryExists: false,
        reportsDirectoryWritable: false,
        excelJSAvailable: false,
        pythonAvailable: false,
        databaseConnection: false,
        organizationCount: 0,
        errors: [error instanceof Error ? error.message : 'Nepoznata greška']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = (status: boolean, criticalIssue: boolean = true) => {
    if (status) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
    } else {
      return (
        <Badge variant="destructive" className={criticalIssue ? "bg-red-600" : "bg-yellow-600"}>
          {criticalIssue ? <XCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
          {criticalIssue ? 'GREŠKA' : 'UPOZORENJE'}
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          System Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Proverite da li su svi komponenti potrebni za generisanje template-a dostupni
          </p>
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? 'Validiram...' : 'Pokretni Validaciju'}
          </Button>
        </div>

        {validationResult && (
          <div className="space-y-4">
            {/* Critical Components */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Kritični komponenti</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Master Template fajl</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(validationResult.templateExists, true)}
                    {validationResult.templateSize > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({(validationResult.templateSize / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Template čitljiv</span>
                  </div>
                  {getStatusBadge(validationResult.templateReadable, true)}
                </div>

                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="text-sm">Reports direktorijum</span>
                  </div>
                  {getStatusBadge(validationResult.reportsDirectoryExists, true)}
                </div>

                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="text-sm">Write permissions</span>
                  </div>
                  {getStatusBadge(validationResult.reportsDirectoryWritable, true)}
                </div>

                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Database konekcija</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(validationResult.databaseConnection, true)}
                    {validationResult.organizationCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({validationResult.organizationCount} org.)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Components */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Opcioni komponenti</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">ExcelJS library</span>
                  </div>
                  {getStatusBadge(validationResult.excelJSAvailable, false)}
                </div>

                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Python + openpyxl</span>
                  </div>
                  {getStatusBadge(validationResult.pythonAvailable, false)}
                </div>
              </div>
            </div>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Pronađene greške:</strong>
                    <ul className="list-disc pl-5 text-sm">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <strong>Preporuke:</strong>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {!validationResult.templateExists && (
                      <li>Postavite master template fajl u: <code>/templates/humanitarian-template.xlsx</code></li>
                    )}
                    {!validationResult.excelJSAvailable && (
                      <li>Instalirajte ExcelJS: <code>npm install exceljs</code></li>
                    )}
                    {!validationResult.pythonAvailable && (
                      <li>Instalirajte Python dependencies: <code>pip install openpyxl</code></li>
                    )}
                    {validationResult.organizationCount === 0 && (
                      <li>Dodajte humanitarne organizacije sa aktivnim ugovorima u bazu</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}