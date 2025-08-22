// /components/services/ServiceStats.tsx
'use client';

// Uvozimo hook za dohvatanje statistika
import { useServiceStats } from '@/hooks/use-service-stats'; // Hook generisan u 5.4
// Uvozimo UI komponente iz Shadcn UI za prikaz
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// Uvozimo tipove ako su potrebni za prikaz (npr. za RevenueSummary)
// import { RevenueSummary } from '@/lib/services/statistics'; // Tipovi definisani u lib/services/statistics.ts

interface ServiceStatsProps {
    // Opcioni propovi za filtriranje statistika (prosleđuju se hooku useServiceStats)
    serviceIds?: string[];
    productIds?: string[];
    // dateRange?: { from: Date; to: Date }; // Primer opcionalnog propa za datumski opseg
    // Opciono: Naslov komponente ako se koristi na različitim mestima
    title?: string;
}

/**
 * Komponenta za prikaz statističkih podataka o servisima.
 * Koristi useServiceStats hook za dohvatanje podataka.
 * @param serviceIds - Opcija za filtriranje statistika po ID-jevima servisa.
 * @param productIds - Opcija za filtriranje statistika po ID-jevima proizvoda.
 * @param title - Naslov komponente.
 */
export function ServiceStats({ serviceIds, productIds, title = "Service & Product Statistics" }: ServiceStatsProps) {
    // Dohvatanje statističkih podataka koristeći hook
    const { stats, loading, error } = useServiceStats(serviceIds, productIds /*, dateRange*/);

    // Prikaz stanja učitavanja
    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent className="text-center py-4 text-muted-foreground">Loading statistics...</CardContent>
            </Card>
        );
    }

    // Prikaz greške
    if (error) {
        return (
            <Card>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent className="text-center py-4 text-red-500">Error loading statistics: {error.message}</CardContent>
            </Card>
        );
    }

    // Prikaz poruke ako nema statistika (npr. hook vraća null ako nema ID-jeva ili nema podataka)
    // useServiceStats vraća null za stats ako nema ID-jeva za fetch
    if (!stats && ((serviceIds && serviceIds.length > 0) || (productIds && productIds.length > 0))) {
        return (
             <Card>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent className="text-center py-4 text-muted-foreground">No statistics available for the selected criteria.</CardContent>
            </Card>
        );
    }

     // Prikaz poruke ako nema ID-jeva za fetch
     if (!stats && !((serviceIds && serviceIds.length > 0) || (productIds && productIds.length > 0))) {
          return null; // Sakrij komponentu ako nema filtera za prikaz statistike
     }


    // Glavni render kada su statistike uspešno učitane
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                {/* Primer prikaza statistike prihoda */}
                {stats?.revenueSummary && stats.revenueSummary.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Revenue Summary</h3>
                        {stats.revenueSummary.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.name}:</span>
                                <span>${item.totalRevenue.toFixed(2)} ({item.contractsCount} contracts)</span> {/* Formatirajte prema potrebi */}
                            </div>
                        ))}
                    </div>
                )}

                 {/* Dodajte prikaz drugih statistika (npr. complaint stats) */}
                 {/* {stats?.complaintStats && stats.complaintStats.length > 0 && (
                      <>
                           <Separator />
                           <div className="space-y-2">
                               <h3 className="text-lg font-semibold">Complaint Cost Summary</h3>
                                {stats.complaintStats.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.name}:</span>
                                        <span>Avg Cost: ${item.averageCost.toFixed(2)} ({item.totalComplaints} complaints)</span>
                                    </div>
                                ))}
                           </div>
                      </>
                 )} */}

                {/* Opciono: Prikaz ukupnih suma ako je više ID-jeva prosleđeno */}
                 {/* {stats?.revenueSummary && serviceIds && serviceIds.length > 1 && (
                      <>
                          <Separator />
                           <div className="flex justify-between text-base font-semibold">
                               <span>Total Revenue:</span>
                               <span>${stats.revenueSummary.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}</span>
                          </div>
                      </>
                 )} */}

                 {/* Opciono: Mesto za grafikone (ako ih dodate) */}
                  {/* <div className="mt-4">
                      <ServiceRevenueChart data={stats?.revenueSummary} /> // Primer komponente grafikona
                  </div> */}

            </CardContent>
             {/* Opciono: CardFooter za akcije ili datum poslednjeg ažuriranja */}
             {/* <CardFooter>
                  <Button variant="outline" size="sm" onClick={() => refresh()}>Refresh Stats</Button>
             </CardFooter> */}
        </Card>
    );
}