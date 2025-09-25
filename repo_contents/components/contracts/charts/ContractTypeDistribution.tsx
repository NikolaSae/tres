// /components/contracts/charts/ContractTypeDistribution.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Pretpostavljena putanja do Shadcn UI Card komponente
import { ContractType } from '@prisma/client'; // Uvoz Prisma enum-a

// Tip za podatke koji se prosleđuju komponenti
interface ContractTypeDistributionData {
    type: ContractType;
    count: number;
}

interface ContractTypeDistributionProps {
    // Podaci za prikaz, formatirani kao niz objekata { type: COUNT }
    // Ili možete prihvatiti agregirani objekat { PROVIDER: 10, HUMANITARIAN: 5, ... }
    data: ContractTypeDistributionData[]; // Odabrali smo format niza
}

/**
 * Komponenta koja prikazuje grafikon distribucije ugovora po tipu.
 * @param data - Podaci o broju ugovora po svakom tipu.
 */
export function ContractTypeDistribution({ data }: ContractTypeDistributionProps) {
    // 1. Priprema podataka za grafikon
    // Format podataka zavisi od biblioteke za crtanje grafikona koju koristite.
    // Npr. za Chart.js Pie Chart, potreban je niz labela i niz vrednosti:
    const chartLabels = data.map(item => item.type);
    const chartValues = data.map(item => item.count);

    // Opciono: Mapiranje tipova na čitljive nazive za legende
    const typeLabels: Record<ContractType, string> = {
        PROVIDER: 'Provider Contracts',
        HUMANITARIAN: 'Humanitarian Contracts',
        PARKING: 'Parking Service Contracts',
        // Dodajte ostale ako postoje
    };
     const displayLabels = chartLabels.map(type => typeLabels[type] || type);


    // 2. Definisanje opcija i stilova za grafikon (zavisi od biblioteke)
    const chartOptions = {
        // Opcije specifične za Chart.js, Recharts, Nivo, itd.
        // Npr. title, tooltips, legende, responsive
    };

    // 3. Rendovanje grafikona
    // Ovo je placeholder. Ovde biste integrisali komponentu iz biblioteke za crtanje grafikona.
    // Primer sa Chart.js (zahteva instalaciju 'react-chartjs-2' i 'chart.js'):
    /*
    import { Pie } from 'react-chartjs-2';
    import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
    ChartJS.register(ArcElement, Tooltip, Legend);

    const chartData = {
      labels: displayLabels,
      datasets: [
        {
          label: '# of Contracts',
          data: chartValues,
          backgroundColor: [ // Primer boja, prilagodite ih
            'rgba(255, 99, 132, 0.6)', // Provider
            'rgba(54, 162, 235, 0.6)', // Humanitarian
            'rgba(255, 206, 86, 0.6)', // Parking
            // ... više boja
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            // ... više boja
          ],
          borderWidth: 1,
        },
      ],
    };
    */

    // Prikazivanje poruke ako nema podataka
    if (!data || data.length === 0 || chartValues.every(count => count === 0)) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Contract Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                    No contract type data available.
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Contract Type Distribution</CardTitle>
                {/* Opciono: CardDescription */}
            </CardHeader>
            <CardContent>
                <div className="h-64 md:h-80"> {/* Definisanje visine za grafikon kontejner */}
                    {/* OVDE IDE KOMPONENTA GRAFIKONA IZ BIBLIOTEKE */}
                    {/* Primer: */}
                    {/* <Pie data={chartData} options={chartOptions} /> */}

                    {/* PLACEHOLDER - Tekstualni prikaz podataka */}
                    <div className="flex flex-col items-center justify-center h-full border rounded-md p-4">
                        <p className="text-muted-foreground mb-2">Chart Placeholder:</p>
                        {data.map(item => (
                            <p key={item.type} className="text-sm">{typeLabels[item.type] || item.type}: {item.count}</p>
                        ))}
                         <p className="mt-4 text-xs text-gray-500">Integrate a charting library here (e.g., Chart.js, Recharts)</p>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}