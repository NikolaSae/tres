// /components/humanitarian-orgs/HumanitarianOrgContracts.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils"; // Pretpostavljamo da formatDate postoji
import { Pagination } from "@/components/ui/pagination";
import { AlertCircle, Clock, FileText, Loader2 } from "lucide-react";

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "RENEWAL_IN_PROGRESS";
  startDate: string | Date;
  endDate: string | Date;
  revenuePercentage: number;
  type: "HUMANITARIAN";
  // Dodajte ovde polja koja su uključena u API ruti, npr:
  // operator: { id: string; name: string; };
}

interface HumanitarianOrgContractsProps {
  organizationId: string | undefined; // organizationId može biti undefined na početku
  organizationName: string;
}

export function HumanitarianOrgContracts({ organizationId, organizationName }: HumanitarianOrgContractsProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Počinje kao true jer očekujemo dohvatanje
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

    // DODAT LOG: Proverava vrednost organizationId kada se komponenta renderuje ili kada se prop promeni
    useEffect(() => {
        console.log(`[HumanitarianOrgContracts] organizationId prop value:`, organizationId);
    }, [organizationId]);


  // Funkcija za učitavanje ugovora za ovu humanitarnu organizaciju
  // Koristimo useCallback da memoizujemo funkciju
  const loadContracts = useCallback(async (page = 1) => {
    console.log(`[HumanitarianOrgContracts] Attempting to load contracts for ID: ${organizationId}, page: ${page}`);
    setIsLoading(true);
    setError(null);

    // DODATA PROVERA NA POČETKU FUNKCIJE
    if (!organizationId) {
        console.warn("[HumanitarianOrgContracts] loadContracts called with missing organizationId. Skipping fetch.");
        setIsLoading(false); // Zaustavi loading state
        setError("Organization ID is missing."); // Postavi grešku
        setContracts([]); // Isprazni listu ugovora
        setTotalPages(1);
        setTotalResults(0);
        setCurrentPage(1);
        return; // Prekini izvršavanje funkcije
    }

    try {
      // Ovde pretpostavljamo da postoji API endpoint za dohvatanje ugovora
      const response = await fetch(`/api/humanitarian-orgs/${organizationId}/contracts?page=${page}&limit=5`);

      console.log(`[HumanitarianOrgContracts] API Response Status: ${response.status}`);

      if (!response.ok) {
        // Pokušajte da pročitate poruku greške iz tela odgovora ako postoji
        const errorBody = await response.json().catch(() => ({})); // Pokušaj parsiranja, uhvati grešku ako nije JSON
        const errorMessage = errorBody.error || `Failed to load contracts: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[HumanitarianOrgContracts] API Response Data:", data); // DODAT LOG: Prikazuje dohvatanje podatke

      setContracts(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("[HumanitarianOrgContracts] Error loading contracts:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts. Please try again later.");
      setContracts([]);
      setTotalPages(1); // Resetuj paginaciju na grešku
      setTotalResults(0);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]); // organizationId je sada dependency

  // Učitavanje ugovora pri prvom renderovanju ILI KADA SE organizationId PROMENI
  useEffect(() => {
    // Pozovite loadContracts samo ako organizationId postane definisan
    if (organizationId) {
        console.log("[HumanitarianOrgContracts] organizationId is defined, triggering loadContracts.");
        loadContracts(1);
    } else {
        console.log("[HumanitarianOrgContracts] organizationId is undefined, waiting...");
        // Postavite početna stanja ako organizationId nedostaje
        // Ostavite isLoading true dok se ID ne dobije, ili false ako znate da ga neće biti
        setIsLoading(true); // Ostavljamo true dok ne dobijemo ID ili grešku
        setError(null); // Resetujte grešku
        setContracts([]);
        setTotalPages(1);
        setTotalResults(0);
        setCurrentPage(1);
         // Ako znate da organizationId NEĆE stići (npr. 404 stranica), postavite isLoading(false) i Error
        // setIsLoading(false);
        // setError("Cannot load contracts without Organization ID.");
    }
  }, [organizationId, loadContracts]); // organizationId i loadContracts su dependencies

  // Funkcija za promenu stranice
  const handlePageChange = (page: number) => {
    // Pozovite loadContracts samo ako organizationId postoji
    if (organizationId) {
        loadContracts(page);
    }
  };

  // Funkcija za status badge
  const renderStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500 hover:bg-green-500">Active</Badge>; // Dodat hover style
      case 'EXPIRED':
        return <Badge className="bg-red-500 hover:bg-red-500">Expired</Badge>; // Dodat hover style
      case 'PENDING':
        return <Badge className="bg-yellow-500 hover:bg-yellow-500">Pending</Badge>; // Dodat hover style
      case 'RENEWAL_IN_PROGRESS':
        return <Badge className="bg-blue-500 hover:bg-blue-500">Renewal in Progress</Badge>; // Dodat hover style
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-500">Unknown</Badge>; // Dodat hover style
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Contracts</CardTitle>
        {organizationId && !isLoading && (
          <Button
            onClick={() => router.push(`/contracts/new?orgId=${organizationId}&orgName=${encodeURIComponent(organizationName)}`)}
          >
            Add Contract
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && organizationId && !error ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading contracts...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        ) : contracts.length === 0 && organizationId && !isLoading ? (
          <div className="text-center p-6 border border-dashed rounded-md">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium mb-1">No contracts found</h3>
            <p className="text-gray-500 mb-4">This organization doesn't have any contracts yet.</p>
            {organizationId && (
              <Button
                onClick={() => router.push(`/contracts/new?orgId=${organizationId}&orgName=${encodeURIComponent(organizationName)}`)}
              >
                Add First Contract
              </Button>
            )}
          </div>
        ) : !organizationId && !isLoading ? (
          <div className="text-center p-6 text-muted-foreground">
            Organization ID is missing. Cannot load contracts.
          </div>
        ) : (
          // This is where we render the contracts table
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 sm:px-3">Contract Name</th>
                    <th className="text-left py-2 px-2 sm:px-3 hidden sm:table-cell">Contract No.</th>
                    <th className="text-left py-2 px-2 sm:px-3">Status</th>
                    <th className="text-left py-2 px-2 sm:px-3">Period</th>
                    <th className="text-left py-2 px-2 sm:px-3 hidden md:table-cell">Revenue %</th>
                    <th className="text-left py-2 px-2 sm:px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 sm:px-3 max-w-[150px] truncate">
                        <Link href={`/contracts/${contract.id}`} className="text-blue-600 hover:underline">
                          {contract.name}
                        </Link>
                      </td>
                      <td className="py-2 px-2 sm:px-3 hidden sm:table-cell">{contract.contractNumber}</td>
                      <td className="py-2 px-2 sm:px-3">{renderStatusBadge(contract.status)}</td>
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500 hidden sm:inline" />
                          <span className="whitespace-nowrap">
                            {formatDate(contract.startDate)} 
                            <span className="hidden sm:inline"> - </span>
                            <br className="sm:hidden" />
                            {formatDate(contract.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-3 hidden md:table-cell">{contract.revenuePercentage}%</td>
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-xs"
                            onClick={() => router.push(`/contracts/${contract.id}`)}
                          >
                            <span className="hidden sm:inline">View</span>
                            <span className="sm:hidden">👁️</span>
                          </Button>
                          {contract.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-xs"
                              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
                            >
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">✏️</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            <div className="text-sm text-gray-500 mt-4 text-center">
              Showing {contracts.length} of {totalResults} contracts
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
