// Path: components/security/SystemResources.tsx

"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

// Ova komponenta ce prikazivati grafikone ili tabele za System Resources (CPU, Memory, Disk)
// Trebace joj useEffect za dohvatanje podataka sa /api/security/performance/resources?timeRange=...
// i state za cuvanje tih podataka.

export default function SystemResources() {
  // Implementirajte logiku dohvatanja podataka (npr. useEffect + fetch)
  // Implementirajte prikaz (npr. grafikoni koriscenjem Recharts)

  return (
    <CardContent className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">System Resources Component (Placeholder)</p>
      {/* Ovde ce biti grafikoni i tabela za CPU, Memory, Disk */}
    </CardContent>
  );
}