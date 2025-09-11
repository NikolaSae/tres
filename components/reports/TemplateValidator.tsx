// components/reports/TemplateValidator.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, FileText, Folder, Database, Loader2 } from 'lucide-react';
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
      // Call the validation API endpoint
      const response = await fetch('/api/reports/validate-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Validation API error (${response.status}): ${errorText}`);
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);

      // Count critical issues
      const criticalIssues = [
        !result.templateExists,
        !result.templateReadable,
        !result.reportsDirectoryExists,
        !result.reportsDirectoryWritable,
        !result.databaseConnection
      ].filter(Boolean).length;

      if (criticalIssues === 0) {
        toast({
          title: "Validacija uspešna",
          description: "Svi kritični komponenti su dostupni i funkcionalni",
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
      const errorMessage = error instanceof Error ? error.message : 'Neočekivana greška validacije';
      
      toast({
        title: "Greška validacije",
        description: "Ne mogu da pokretnem validaciju sistema",
        variant: "destructive",
      });
      
      // Set fallback result with error
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
        errors: [errorMessage]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = (status: boolean, criticalIssue: boolean = true) => {
    if (status) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          OK
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className={criticalIssue ? "bg-red-600" : "bg-yellow-600"}>
          {criticalIssue ? (
            <XCircle className="w-3 h-3 mr-1" />
          ) : (
            <AlertTriangle className="w-3 h-3 mr-1" />
          )}
          {criticalIssue ? 'GREŠKA' : 'UPOZORENJE'}
        </Badge>
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validiram...
              </>
            ) : (
              'Pokreni Validaciju'
            )}
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
                        ({formatFileSize(validationResult.templateSize)})
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
                    {validationResult.databaseConnection && validationResult.organizationCount >= 0 && (
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
                    <ul className="list-disc pl-5 text-sm space-y-1 max-h-40 overflow-y-auto">
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
                  <strong>Preporuke za rešavanje:</strong>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {!validationResult.templateExists && (
                      <li>
                        Postavite master template fajl u: {' '}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          /templates/humanitarian-template.xlsx
                        </code>
                      </li>
                    )}
                    {!validationResult.reportsDirectoryExists && (
                      <li>Kreiraće se reports direktorijum automatski pri prvom generisanju</li>
                    )}
                    {!validationResult.reportsDirectoryWritable && (
                      <li>Proverite dozvole za pisanje u reports direktorijum</li>
                    )}
                    {!validationResult.excelJSAvailable && (
                      <li>
                        Instalirajte ExcelJS: {' '}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          npm install exceljs
                        </code>
                      </li>
                    )}
                    {!validationResult.pythonAvailable && (
                      <li>
                        Instalirajte Python dependencies: {' '}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          pip install openpyxl
                        </code>
                      </li>
                    )}
                    {validationResult.organizationCount === 0 && validationResult.databaseConnection && (
                      <li>Dodajte humanitarne organizacije sa aktivnim ugovorima u bazu</li>
                    )}
                    {!validationResult.databaseConnection && (
                      <li>Proverite konekciju sa bazom podataka i konfiguraciju</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Success Summary */}
            {validationResult.templateExists && 
             validationResult.templateReadable && 
             validationResult.reportsDirectoryExists && 
             validationResult.reportsDirectoryWritable && 
             validationResult.databaseConnection && 
             validationResult.organizationCount > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Sistem je spreman za generisanje template-a!</strong>
                  <br />
                  Svi kritični komponenti su dostupni i funkcionalni. 
                  Možete da započnete generisanje template-a za {validationResult.organizationCount} organizacija.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}