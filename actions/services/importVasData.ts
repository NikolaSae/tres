// Path: actions/services/importVasData.ts
"use server";

import { db } from "@/lib/db";
import csv from 'csv-parser'; // `npm install csv-parser` ili `yarn add csv-parser`
import { Readable } from 'stream'; // Node.js stream za parsiranje
import { ServiceType } from '@prisma/client'; // Uvezite ServiceType ako ga koristite u Prisma shemi


// Definisanje strukture parsiranog reda iz VAS CSV-a
// NAZIVI KLJUČEVA MORAJU TAČNO ODGOVARATI HEADER REDU U VAŠEM CSV FAJLU.
interface VasCsvRow {
    'Proizvod': string;
    'Mesec_pruzanja_usluge': string;
    'Jedinicna_cena': string;
    'Broj_transakcija': string;
    'Fakturisan_iznos': string;
    'Fakturisan_korigovan_iznos': string;
    'Naplacen_iznos': string;
    'Kumulativ_naplacenih_iznosa': string;
    'Nenaplacen_iznos': string;
    'Nenaplacen_korigovan_iznos': string;
    'Storniran_iznos_u_tekucem_mesecu_iz_perioda_pracenja': string;
    'Otkazan_iznos': string;
    'Kumulativ_otkazanih_iznosa': string;
    'Iznos_za_prenos_sredstava_': string;
    'Provajder': string;
}

// Definisanje tipa rezultata koji vraća import akcija
export interface VasImportResult {
    totalRows: number; // Ukupan broj redova podataka (bez headera)
    processedCount: number; // Broj redova pokušanih za obradu
    createdCount: number; // Broj VasService slogova kreiranih
    updatedCount: number; // Broj VasService slogova ažuriranih
    invalidRows: {
        rowIndex: number; // 0-bazirani index reda u *parsiranom* nizu (posle headera)
        originalRow: any; // Parsirani objekat reda (za inspekciju greške)
        errors: string[]; // Lista validacionih/obradnih grešaka za ovaj red
    }[];
    importErrors: string[]; // Greške tokom parsiranja fajla ili globalni problemi
    createdProviders: number; // Dodajemo brojače za Provider i Service
    updatedProviders: number;
    createdServices: number;
    updatedServices: number;
}


export async function importVasServiceData(csvContent: string): Promise<VasImportResult> {
    const results: VasCsvRow[] = [];
    const importErrors: string[] = [];
    const invalidRows: VasImportResult['invalidRows'] = [];

    const stream = Readable.from([csvContent]);

    // Obećanje koje čeka da se parsiranje streama završi ili naiđe na grešku
    await new Promise<void>((resolve) => {
        stream
            // *** KORIGOVANO: Konfiguracija parsera da koristi tačka-zarez ***
            .pipe(csv({ separator: ';' }))
            .on('data', (data: VasCsvRow) => { // Assertujemo tip za podatke
                // console.log("Parsed row data:", data); // Dodajte log da vidite kako parser vidi red
                results.push(data);
            })
            .on('error', (error: any) => {
                console.error("CSV parsing error:", error); // Ostavi server-side log
                importErrors.push(`CSV Parsing Error: ${error.message}`);
                resolve(); // Završi obećanje čak i ako ima greška parsiranja, da bi se obradili redovi koji su pročitani
            })
            .on('end', () => {
                console.log(`CSV parsing finished. ${results.length} data rows found.`); // Ostavi server-side log
                resolve(); // Parsiranje završeno
            });
    });

    // Ukupan broj redova podataka (bez headera)
    const totalDataRows = results.length;

    let processedCount = 0;
    let createdCount = 0; // VasService count
    let updatedCount = 0; // VasService count
    let createdProviders = 0; // Provider count
    let updatedProviders = 0; // Provider count
    let createdServices = 0; // Service count
    let updatedServices = 0; // Service count


    // Obrada svakog parsiranog reda
    for (const [index, row] of results.entries()) {
        processedCount++;
        const rowErrors: string[] = [];

        // console.log(`Processing row ${index + 1} (raw):`, row); // Dodatni log za sirove podatke ako treba

        // --- Validacija i Transformacija Podataka (Početne provere CSV podataka) ---
        // Provera obaveznih polja iz CSV-a (proverava null/undefined/prazan string posle trim-a)
        if (!row['Proizvod'] || !row['Proizvod'].trim()) {
            rowErrors.push("Missing or empty 'Proizvod'");
        }
        if (!row['Mesec_pruzanja_usluge'] || !row['Mesec_pruzanja_usluge'].trim()) {
            rowErrors.push("Missing or empty 'Mesec_pruzanja_usluge'");
        }
        if (!row['Provajder'] || !row['Provajder'].trim()) {
            rowErrors.push("Missing or empty 'Provajder'");
        }
        // Dodajte validaciju i za OSTALA OBAVEZNA polja iz CSV-a (brojevi, itd.) ako je potrebno


        // Validacija i parsiranje datuma
        const mesecPruzanjaUslugeDate = new Date(row['Mesec_pruzanja_usluge'].trim()); // Trim pre parsiranja datuma
        if (isNaN(mesecPruzanjaUslugeDate.getTime())) {
            rowErrors.push(`Invalid date format for 'Mesec_pruzanja_usluge': "${row['Mesec_pruzanja_usluge']}"`);
        } else if (mesecPruzanjaUslugeDate.getFullYear() < 2000 || mesecPruzanjaUslugeDate.getFullYear() > 2100) { // Primer sanity check-a raspona godine
             rowErrors.push(`Unrealistic year in date for 'Mesec_pruzanja_usluge': "${row['Mesec_pruzanja_usluge']}"`);
        }


        // Validacija i parsiranje brojeva (koristeći trim() i replace(',', '.') ako je decimalni zarez moguć)
        // replace(',', '.') je potreban ako vaš CSV koristi zarez kao decimalni separator, a ne tačku.
        const jedinicnaCena = parseFloat(row['Jedinicna_cena']?.trim()?.replace(',', '.') || '0');
        if (isNaN(jedinicnaCena)) rowErrors.push(`Invalid number format for 'Jedinicna_cena': "${row['Jedinicna_cena']}"`);

        const brojTransakcija = parseInt(row['Broj_transakcija']?.trim() || '0');
        if (isNaN(brojTransakcija)) rowErrors.push(`Invalid integer format for 'Broj_transakcija': "${row['Broj_transakcija']}"`);

        const fakturisanIznos = parseFloat(row['Fakturisan_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(fakturisanIznos)) rowErrors.push(`Invalid number format for 'Fakturisan_iznos': "${row['Fakturisan_iznos']}"`);

        const fakturisanKorigovanIznos = parseFloat(row['Fakturisan_korigovan_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(fakturisanKorigovanIznos)) rowErrors.push(`Invalid number format for 'Fakturisan_korigovan_iznos': "${row['Fakturisan_korigovan_iznos']}"`);

        const naplacenIznos = parseFloat(row['Naplacen_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(naplacenIznos)) rowErrors.push(`Invalid number format for 'Naplacen_iznos': "${row['Naplacen_iznos']}"`);

        const kumulativNaplacenihIznosa = parseFloat(row['Kumulativ_naplacenih_iznosa']?.trim()?.replace(',', '.') || '0');
        if (isNaN(kumulativNaplacenihIznosa)) rowErrors.push(`Invalid number format for 'Kumulativ_naplacenih_iznosa': "${row['Kumulativ_naplacenih_iznosa']}"`);

        const nenaplacenIznos = parseFloat(row['Nenaplacen_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(nenaplacenIznos)) rowErrors.push(`Invalid number format for 'Nenaplacen_iznos': "${row['Nenaplacen_iznos']}"`);

        const nenaplacenKorigovanIznos = parseFloat(row['Nenaplacen_korigovan_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(nenaplacenKorigovanIznos)) rowErrors.push(`Invalid number format for 'Nenaplacen_korigovan_iznos': "${row['Nenaplacen_korigovan_iznosa']}"`);

        const storniranIznos = parseFloat(row['Storniran_iznos_u_tekucem_mesecu_iz_perioda_pracenja']?.trim()?.replace(',', '.') || '0');
        if (isNaN(storniranIznos)) rowErrors.push(`Invalid number format for 'Storniran_iznos_u_tekucem_mesecu_iz_perioda_pracenja': "${row['Storniran_iznos_u_tekucem_mesecu_iz_perioda_pracenja']}"`);

        const otkazanIznos = parseFloat(row['Otkazan_iznos']?.trim()?.replace(',', '.') || '0');
        if (isNaN(otkazanIznos)) rowErrors.push(`Invalid number format for 'Otkazan_iznos': "${row['Otkazan_iznos']}"`);

        const kumulativOtkazanihIznosa = parseFloat(row['Kumulativ_otkazanih_iznosa']?.trim()?.replace(',', '.') || '0');
        if (isNaN(kumulativOtkazanihIznosa)) rowErrors.push(`Invalid number format for 'Kumulativ_otkazanih_iznosa': "${row['Kumulativ_otkazanih_iznosa']}"`);

        const iznosZaPrenosSredstava = parseFloat(row['Iznos_za_prenos_sredstava_']?.trim()?.replace(',', '.') || '0');
        if (isNaN(iznosZaPrenosSredstava)) rowErrors.push(`Invalid number format for 'Iznos_za_prenos_sredstava_': "${row['Iznos_za_prenos_sredstava_']}"`);


        // Ako inicijalna validacija podataka iz CSV-a ne uspe, označi red kao nevalidan i nastavi
        if (rowErrors.length > 0) {
            // console.log(`Row ${index + 1} failed initial validation:`, rowErrors); // Ostavi server-side log ako treba
            invalidRows.push({ rowIndex: index, originalRow: row, errors: rowErrors });
            continue; // Preskoči na sledeći red
        }

        // Promenljive koje će čuvati pronađene ili kreirane Provider i Service objekte
        let provider;
        let service;


        // --- Pronađi ili Kreiraj Provider ---
        try {
            // Prvo probaj da nađeš provajdera po imenu (sa trim-ovanim imenom)
            const existingProvider = await db.provider.findFirst({
                where: { name: row['Provajder'].trim() },
                select: { id: true },
            });

            if (existingProvider) {
                provider = existingProvider;
                updatedProviders++; // Brojimo ažurirane (pronađene) provajdere
            } else {
                // Ako provajder nije pronađen, kreiraj ga
                provider = await db.provider.create({
                    data: {
                        name: row['Provajder'].trim(), // Koristi trim-ovano ime
                        // Dodajte podrazumevane vrednosti za ostala polja koja nisu nullable u šemi
                        // (npr. isActive: true ako nije postavljeno kao @default u šemi)
                        // createdAt i updatedAt verovatno imaju @default(now()) i @updatedAt u šemi
                    },
                    select: { id: true }, // Selektuj ID za VasService vezu
                });
                createdProviders++; // Brojimo kreirane provajdere
            }

        } catch (error: any) {
            console.error(`Error finding or creating Provider for row ${index + 1} ("${row['Provajder'].trim()}"):`, error); // Ostavi server-side log
            const errorMessage = error instanceof Error ? error.message : String(error);
            invalidRows.push({ rowIndex: index, originalRow: row, errors: [`Database error finding or creating Provider "${row['Provajder'].trim()}": ${errorMessage}`] });
            continue; // Preskoči na sledeći red ako logika za provajdera ne uspe
        }


        // --- Pronađi ili Kreiraj Service ---
        try {
            // Prvo probaj da nađeš servis po imenu (sa trim-ovanim imenom)
            const existingService = await db.service.findFirst({
                where: { name: row['Proizvod'].trim() },
                select: { id: true, type: true }, // Selektuj i tip
            });

            if (existingService) {
                service = existingService;
                updatedServices++; // Brojimo ažurirane (pronađene) servise

                // Opciono: Ako servis postoji, ali mu tip nije VAS, označi red kao nevalidan
                if (service.type !== ServiceType.VAS) {
                    rowErrors.push(`Service "${row['Proizvod'].trim()}" already exists but is not of type VAS (found type: ${service.type}).`);
                    // Dodaj validacionu grešku i označi red kao nevalidan
                    invalidRows.push({ rowIndex: index, originalRow: row, errors: rowErrors });
                    console.log(`Row ${index + 1} failed: Service type mismatch for existing service.`); // Ostavi server-side log
                    continue; // Preskoči na sledeći red
                }

            } else {
                // Ako servis nije pronađen, kreiraj ga
                service = await db.service.create({
                    data: {
                        name: row['Proizvod'].trim(), // Koristi trim-ovano ime
                        type: ServiceType.VAS, // Postavi tip na VAS pri kreiranju
                        // Dodajte podrazumevane vrednosti za ostala polja koja nisu nullable
                    },
                    select: { id: true, type: true }, // Selektuj ID i tip
                });
                createdServices++; // Brojimo kreirane servise
            }

        } catch (error: any) {
            console.error(`Error finding or creating Service for row ${index + 1} ("${row['Proizvod'].trim()}"):`, error); // Ostavi server-side log
            const errorMessage = error instanceof Error ? error.message : String(error);
            invalidRows.push({ rowIndex: index, originalRow: row, errors: [`Database error finding or creating Service "${row['Proizvod'].trim()}": ${errorMessage}`] });
            continue; // Preskoči na sledeći red ako logika za servis ne uspe
        }

        // Sada kada imamo provider i service (pronađeni ili kreirani), nastavi sa VasService upsert-om

        // --- Upsert VasService Sloga ---
        try {
            // Pronađi postojeći VasService slog da bi se utvrdilo da li je create ili update za potrebe brojanja
            // Ovaj findUnique pretpostavlja da je naziv unique constrainta tačan u schema.prisma
            const existingVasEntry = await db.vasService.findUnique({
                 where: {
                      // Koristimo TAČAN GENERISANI NAZIV constrainta kao ključ
                     proizvod_mesec_pruzanja_usluge_provajderId: { // <-- Koristimo ovaj naziv!
                         proizvod: row['Proizvod'].trim(), // Koristi trim-ovano ime
                         mesec_pruzanja_usluge: mesecPruzanjaUslugeDate,
                         provajderId: provider.id, // Koristi ID od pronađenog/kreiranog provajdera
                     }
                 },
                 select: { id: true },
             });

            // Perform the upsert operation
            // KORIGOVANO: Koristimo TAČAN GENERISANI NAZIV za unique constraint u where klauzuli
            await db.vasService.upsert({
                where: {
                    // Koristimo TAČAN GENERISANI NAZIV constrainta kao ključ
                    proizvod_mesec_pruzanja_usluge_provajderId: { // <-- Koristimo ovaj naziv!
                        proizvod: row['Proizvod'].trim(), // Koristi trim-ovano ime
                        mesec_pruzanja_usluge: mesecPruzanjaUslugeDate,
                        provajderId: provider.id, // Koristi ID od pronađenog/kreiranog provajdera
                    }
                },
                update: {
                    // Polja za ažuriranje koristeći parsirane i trim-ovane vrednosti
                    jedinicna_cena: jedinicnaCena,
                    broj_transakcija: brojTransakcija,
                    fakturisan_iznos: fakturisanIznos,
                    fakturisan_korigovan_iznos: fakturisanKorigovanIznos,
                    naplacen_iznos: naplacenIznos,
                    kumulativ_naplacenih_iznosa: kumulativNaplacenihIznosa,
                    nenaplacen_iznos: nenaplacenIznos,
                    nenaplacen_korigovan_iznos: nenaplacenKorigovanIznos,
                    storniran_iznos: storniranIznos,
                    otkazan_iznos: otkazanIznos,
                    kumulativ_otkazanih_iznosa: kumulativOtkazanihIznosa,
                    iznos_za_prenos_sredstava: iznosZaPrenosSredstava,
                    // serviceId i provajderId su deo unique constrainta, ne ažuriraju se ovde
                },
                create: {
                    // Polja za kreiranje koristeći parsirane i trim-ovane vrednosti
                    proizvod: row['Proizvod'].trim(),
                    mesec_pruzanja_usluge: mesecPruzanjaUslugeDate,
                    jedinicna_cena: jedinicnaCena,
                    broj_transakcija: brojTransakcija,
                    fakturisan_iznos: fakturisanIznos,
                    fakturisan_korigovan_iznos: fakturisanKorigovanIznos,
                    naplacen_iznos: naplacenIznos,
                    kumulativ_naplacenih_iznosa: kumulativNaplacenihIznosa,
                    nenaplacen_iznos: nenaplacenIznos,
                    nenaplacen_korigovan_iznos: nenaplacenKorigovanIznos,
                    storniran_iznos: storniranIznos,
                    otkazan_iznos: otkazanIznos,
                    kumulativ_otkazanih_iznosa: kumulativOtkazanihIznosa,
                    iznos_za_prenos_sredstava: iznosZaPrenosSredstava,
                    serviceId: service.id, // Use ID from found/created service
                    provajderId: provider.id, // Use ID from found/created provider
                },
            });

            // Povećaj brojače na osnovu toga da li je slog postojao pre upsert-a
            if (existingVasEntry) {
                updatedCount++;
            } else {
                createdCount++;
            }

        } catch (error: any) {
            console.error(`Database error upserting VasService for row ${index + 1}:`, row, error); // Ostavi server-side log
            const errorMessage = error instanceof Error ? error.message : String(error);
            invalidRows.push({ rowIndex: index, originalRow: row, errors: [`Database error upserting VasService: ${errorMessage}`] });
        }


    } // Kraj for petlje za obradu redova


    // Finalni server-side logovi sa sumarnim rezultatima
    console.log(`--- VAS Import Summary ---`); // Ostavi server-side log
    console.log(`Processed: ${processedCount}, Created: ${createdCount}, Updated: ${updatedCount}, Invalid: ${invalidRows.length}, File Errors: ${importErrors.length}`);
    console.log(`Provider Upsert Summary: Created ${createdProviders}, Updated ${updatedProviders}`); // Dodatni brojači
    console.log(`Service Upsert Summary: Created ${createdServices}, Updated ${updatedServices}`); // Dodatni brojači

    if (invalidRows.length > 0) {
        console.log(`Details for ${invalidRows.length} invalid rows (first 10):`, invalidRows.slice(0, 10));
        console.log("Total invalid rows count:", invalidRows.length);
    }
    console.log(`--- End Import Summary ---`);


    return {
        totalRows: totalDataRows,
        processedCount,
        createdCount,
        updatedCount,
        invalidRows,
        importErrors,
        createdProviders, // Vraćamo i brojače za Provider i Service
        updatedProviders,
        createdServices,
        updatedServices,
    };
}