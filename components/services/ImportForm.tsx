// Path: components/services/ImportForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Uvoz Server Akcije i tipa rezultata (ImportResult tip se koristi ovde)
import { importVasServiceData, type VasImportResult } from '@/actions/services/importVasData';

// Uvozimo Button
import { Button } from '@/components/ui/button';

// Ostavljamo Input i Form komponente
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Uvozimo toast - koristimo standardni shadcn/ui toast
import { useToast } from '@/hooks/use-toast';

// Uvozimo Card komponente
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Ostavljamo komponente za prikaz rezultata
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";


const formSchema = z.object({
    csvFile: z.instanceof(File).refine(file => file.size > 0, "CSV file is required."),
});

type ImportFormValues = z.infer<typeof formSchema>;


export function ImportForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    // importResult čuva rezultat akcije tipa VasImportResult
    const [importResult, setImportResult] = useState<VasImportResult | null>(null);


    const form = useForm<ImportFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            csvFile: undefined,
        },
    });

    const onSubmit = async (values: ImportFormValues) => {
        setIsLoading(true);
        setImportResult(null); // Resetujemo rezultat pre novog uvoza

        const file = values.csvFile;

        // Provera tipa fajla pre čitanja (opciono, ali dobra praksa)
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast({
                title: "Invalid file type",
                description: "Please upload a valid CSV file.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }


        const reader = new FileReader();

        reader.onload = async (event) => {
            const csvContent = event.target?.result as string;

            if (!csvContent) {
                toast({
                    title: "Error",
                    description: "Could not read CSV file content.",
                    variant: "destructive",
                });
                setIsLoading(false);
                // Nema rezultata za prikaz, setujemo null
                setImportResult(null);
                return;
            }

            // Poziv server akcije sa sadržajem fajla
            const result = await importVasServiceData(csvContent);

            setIsLoading(false);
            // Postavljamo rezultat za prikaz na frontend-u
            setImportResult(result);

            // Prikaz toast poruke na osnovu rezultata
            if (result.importErrors.length > 0 || result.invalidRows.length > 0) {
                // Poruka za delimičan uspeh ili potpun neuspeh
                toast({
                    title: "Import completed with issues",
                    description: `Processed: ${result.processedCount}, Invalid rows: ${result.invalidRows.length}, File errors: ${result.importErrors.length}.`,
                    variant: "destructive",
                });
            } else {
                // Poruka za potpun uspeh
                toast({
                    title: "Import successful!",
                    description: `Processed: ${result.processedCount}, Created: ${result.createdCount}, Updated: ${result.updatedCount}.`,
                });
            }
        };

        reader.onerror = () => {
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Failed to read file.",
                variant: "destructive",
            });
            setImportResult(null);
        };

        reader.readAsText(file);
    };


    return (
        <>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Import VAS Service Data from CSV</CardTitle>
                    <p className="text-sm text-muted-foreground">Upload a CSV file containing VAS service usage data.</p>
                    <a
                        href="/templates/vas_import_template.csv"
                        download
                        className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                        Download VAS CSV Template
                    </a>
                </CardHeader>
                <CardContent className="space-y-6">

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="csvFile"
                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                        <FormLabel>VAS Data CSV File</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...fieldProps}
                                                type="file"
                                                accept=".csv"
                                                onChange={event => {
                                                    // Postavljamo samo prvi izabrani fajl
                                                    onChange(event.target.files && event.target.files.length > 0 ? event.target.files[0] : undefined);
                                                }}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        {/* <FormMessage /> prikazuje validation error iz react-hook-form/zod */}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                                {isLoading ? 'Importing...' : 'Import VAS Data'}
                            </Button>
                        </form>
                    </Form>

                {/* *** PRIKAZ DETALJNIH REZULTATA *** */}
                {importResult && (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold">Import Results</h3>
                        <p className="text-sm text-muted-foreground">
                            Ukupno redova podataka u fajlu (bez headera): {importResult.totalRows}
                        </p>

                         {/* Prikazivanje osnovnih brojača */}
                         <p className="text-sm">
                             Procesirano za pokušaj uvoza: <span className="font-medium">{importResult.processedCount}</span>
                         </p>
                          <p className="text-sm text-green-600">
                             Uspešno kreirano: <span className="font-medium">{importResult.createdCount}</span>
                         </p>
                          <p className="text-sm text-orange-600">
                             Uspešno ažurirano: <span className="font-medium">{importResult.updatedCount}</span>
                         </p>
                         <p className="text-sm text-red-600">
                             Nevalidnih redova (sa greškama): <span className="font-medium">{importResult.invalidRows.length}</span>
                         </p>
                          {importResult.importErrors.length > 0 && (
                              <p className="text-sm text-red-700">
                                  Grešaka pri parsiranju fajla: <span className="font-medium">{importResult.importErrors.length}</span>
                             </p>
                         )}


                        {/* Prikaz detaljnih grešaka pri parsiranju fajla ako ih ima */}
                        {importResult.importErrors.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-red-600">Greške pri parsiranju fajla ({importResult.importErrors.length})</h4>
                                <ScrollArea className="h-24 border rounded-md p-2 text-sm text-red-600">
                                    <div className="relative w-full overflow-auto">
                                        <ul>
                                            {importResult.importErrors.map((err, index) => (
                                                <li key={index}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Prikaz detaljnih grešaka za nevalidne redove ako ih ima */}
                        {importResult.invalidRows.length > 0 && (
                            <div className="space-y-2">
                                 <h4 className="font-medium text-red-600">Detaljne greške za nevalidne redove ({importResult.invalidRows.length})</h4>
                                <ScrollArea className="h-48 border rounded-md p-2 text-sm text-red-600">
                                    <div className="relative w-full overflow-auto">
                                        <ul>
                                            {/* Ograničavamo broj prikazanih grešaka radi performansi i UI */}
                                            {importResult.invalidRows.slice(0, 50).map((rowError, index) => (
                                                 // Prikazujemo samo broj reda i listu grešaka
                                                 <li key={index}>
                                                     Red {rowError.rowIndex + 1}: {rowError.errors.join('; ')}
                                                 </li>
                                            ))}
                                            {importResult.invalidRows.length > 50 && (
                                                 <li>... i još {importResult.invalidRows.length - 50} grešaka.</li>
                                            )}
                                        </ul>
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                    </div>
                )}

                </CardContent>
            </Card>
        </>
    );
}