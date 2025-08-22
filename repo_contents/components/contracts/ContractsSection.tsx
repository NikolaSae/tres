// Path: /components/contracts/ContractsSection.tsx
"use client";

import { useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContractFilters } from "@/components/contracts/ContractFilters";
import { ContractsList} from "@/components/contracts/ContractList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Contract } from "@/lib/types/contract-types";
import { ContractStatus } from "@prisma/client"; // Dodato za StatusBadge

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// State interface
interface ContractsState {
  contracts: Contract[];
  filteredContracts: Contract[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  loading: boolean;
  useServerPagination: boolean;
}

// Action types
type ContractsAction =
  | { type: 'SET_INITIAL_DATA'; payload: { contracts: Contract[]; totalCount: number; totalPages: number; currentPage: number; useServerPagination: boolean } }
  | { type: 'SET_FILTERED_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SWITCH_TO_LOCAL_PAGINATION'; payload: Contract[] }
  | { type: 'UPDATE_SERVER_DATA'; payload: { contracts: Contract[]; totalCount: number; totalPages: number; currentPage: number } };

// Reducer function
function contractsReducer(state: ContractsState, action: ContractsAction): ContractsState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        contracts: action.payload.contracts,
        filteredContracts: action.payload.contracts, // Inicijalno, filtrirani su svi ugovori
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        useServerPagination: action.payload.useServerPagination,
      };
    
    case 'SET_FILTERED_CONTRACTS':
      // Ovo je za client-side filtriranje. Implicitno prebacuje na local pagination.
      const newTotalPagesFiltered = Math.ceil(action.payload.length / state.itemsPerPage);
      return {
        ...state,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: newTotalPagesFiltered,
        currentPage: 1, // Resetuj na stranicu 1 prilikom primene client-side filtera
        useServerPagination: false // Prebaci na lokalnu paginaciju
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_ITEMS_PER_PAGE':
      const updatedTotalPagesForLimit = Math.ceil(
        (state.useServerPagination ? state.totalCount : state.filteredContracts.length) / action.payload
      );
      const newCurrentPageForLimit = state.currentPage > updatedTotalPagesForLimit ? 1 : state.currentPage;
      
      return {
        ...state,
        itemsPerPage: action.payload,
        totalPages: updatedTotalPagesForLimit,
        currentPage: newCurrentPageForLimit
      };
    
    case 'SWITCH_TO_LOCAL_PAGINATION':
      // Koristi se kada se primeni client-side filter nakon što je server-side bio aktivan
      return {
        ...state,
        useServerPagination: false,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: Math.ceil(action.payload.length / state.itemsPerPage),
        currentPage: 1 // Resetuj na stranicu 1 kada se eksplicitno prebacuje na lokalnu paginaciju
      };
    
    case 'UPDATE_SERVER_DATA':
      // Ova akcija se koristi kada se inicijalni propovi promene zbog server-side ažuriranja (npr. promena URL stranice)
      // i useServerPagination je true.
      // Ona u suštini ponovo inicijalizuje relevantne delove stanja sa novim serverskim podacima.
      return {
        ...state,
        contracts: action.payload.contracts,
        filteredContracts: action.payload.contracts,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        useServerPagination: true // Eksplicitno potvrdi server paginacija režim
      };
    
    default:
      return state;
  }
}

interface ContractsSectionProps {
  initialContracts: Contract[];
  serverTime: string;
  initialTotalCount?: number;
  initialTotalPages?: number;
  initialCurrentPage?: number;
  useServerPagination?: boolean;
}

export function ContractsSection({ 
  initialContracts, 
  serverTime,
  initialTotalCount = 0,
  initialTotalPages = 1,
  initialCurrentPage = 1,
  useServerPagination = false
}: ContractsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const stableSearchParams = useMemo(() => ({
    search: searchParams.get('search'),
    status: searchParams.get('status'),
    type: searchParams.get('type'),
    partner: searchParams.get('partner'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit')
  }), [searchParams]);

  const urlPage = parseInt(stableSearchParams.page || '1');
  const urlLimit = parseInt(stableSearchParams.limit || '25');

  // Inicijalizuj stanje direktno iz propova i URL parametara
  const initialState: ContractsState = {
    contracts: initialContracts,
    filteredContracts: initialContracts,
    totalCount: initialTotalCount,
    totalPages: initialTotalPages,
    currentPage: initialCurrentPage, // Sada initialCurrentPage ispravno dolazi iz URL-a u page.tsx
    itemsPerPage: urlLimit,
    loading: false,
    useServerPagination: useServerPagination
  };

  const [state, dispatch] = useReducer(contractsReducer, initialState);

  // UKLONJEN JE redundantni SET_INITIAL_DATA useEffect sa [] zavisnošću
  // Stanje se ispravno inicijalizuje pomoću useReducer-a pri mount/remountu komponente.

  // Ovaj useEffect osigurava da se stanje ažurira kada se inicijalni propovi promene.
  // Pokriva slučajeve gde se komponenta remountuje (zbog promene ključa) ili se propovi ažuriraju bez remounta.
  // Obrađuje i server-side i client-side (kada useServerPagination postane false) ažuriranja propova.
  useEffect(() => {
    if (useServerPagination) {
      dispatch({
        type: 'UPDATE_SERVER_DATA',
        payload: {
          contracts: initialContracts,
          totalCount: initialTotalCount,
          totalPages: initialTotalPages,
          currentPage: initialCurrentPage
        }
      });
    } else {
      // Ako je client-side paginacija aktivna (ili postane aktivna, npr. filteri su obrisani)
      // Osiguraj da lokalno stanje odražava trenutne inicijalne podatke (koji sada uključuju URL stranicu)
      // i ispravno postavlja totalPages na osnovu svih učitanih ugovora.
      dispatch({
        type: 'SET_INITIAL_DATA', // Ponovo koristi ovu akciju za ponovnu inicijalizaciju za client-side
        payload: {
            contracts: initialContracts,
            totalCount: initialContracts.length,
            totalPages: Math.ceil(initialContracts.length / state.itemsPerPage),
            currentPage: initialCurrentPage, // Koristi stranicu prosleđenu sa servera (koja poštuje URL)
            useServerPagination: false
        }
      });
    }
  }, [useServerPagination, initialContracts, initialTotalCount, initialTotalPages, initialCurrentPage, state.itemsPerPage]);

  // Sinhronizuj lokalno stanje sa URL parametrima za stavke po stranici
  useEffect(() => {
    if (urlLimit !== state.itemsPerPage) {
      dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: urlLimit });
    }
  }, [urlLimit, state.itemsPerPage]);

  // Sinhronizuj trenutnu stranicu sa URL-om. Ovo je ključno za konzistentnost.
  // Ovaj useEffect će sada raditi i za server i za klijent stranu ako se URL promeni.
  useEffect(() => {
    if (urlPage !== state.currentPage && !state.loading) {
      dispatch({ type: 'SET_PAGE', payload: urlPage });
    }
  }, [urlPage, state.currentPage, state.loading]);

  // Cleanup funkcija
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handler za lokalne filtere sa debounced router push
  const handleFilterChange = useCallback((filtered: Contract[]) => {
    // Uvek prebaci na lokalnu paginaciju kada se primene client-side filteri.
    dispatch({ type: 'SWITCH_TO_LOCAL_PAGINATION', payload: filtered });
    
    // Obriši relevantne URL parametre (search, status, type, partner) prilikom prebacivanja na lokalno filtriranje.
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      const paramsToKeep = new URLSearchParams();
      // Eksplicitno zadrži 'page' i 'limit' ako su prisutni i želite da ostanu
      if (stableSearchParams.page) paramsToKeep.set('page', stableSearchParams.page);
      if (stableSearchParams.limit) paramsToKeep.set('limit', stableSearchParams.limit);

      router.push(`/contracts?${paramsToKeep.toString()}`, { scroll: false });
    }, 300);
  }, [router, stableSearchParams.page, stableSearchParams.limit]);

  // Dobijanje paginiranih ugovora za prikaz
  const getPaginatedContracts = useCallback(() => {
    if (state.useServerPagination) {
      return state.contracts;
    }
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredContracts.slice(startIndex, endIndex);
  }, [state.useServerPagination, state.contracts, state.filteredContracts, state.currentPage, state.itemsPerPage]);

  // URL helpers (ova funkcija više nije neophodna unutar handlePageChange na isti način, ali se može zadržati za druge svrhe)
  const createPageUrl = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    params.set('limit', state.itemsPerPage.toString()); // Osiguraj da je limit uvek prisutan u URL-u
    return `/contracts${params.toString() ? `?${params.toString()}` : ''}`;
  }, [searchParams, state.itemsPerPage]);


  // Event handler za promenu broja stavki po stranici
  const handleItemsPerPageChange = useCallback((value: string) => {
    const newItemsPerPage = parseInt(value);
    
    // Uvek ažuriraj URL za stavke po stranici, što će uzrokovati ponovno dohvatanje podataka na serveru
    // i ponovno mountovanje ili ažuriranje komponente ContractsSection.
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', value);
    params.delete('page'); // Resetuj stranicu na 1 prilikom promene limita, jer se ukupan broj stranica može značajno promeniti
    router.push(`/contracts?${params.toString()}`, { scroll: false });

    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: newItemsPerPage }); // Ažuriraj lokalno stanje za trenutni prikaz
  }, [searchParams, router]);

  // Modifikovana handlePageChange funkcija da uvek ažurira URL
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page'); // Ukloni page parametar za stranicu 1
    }
    params.set('limit', state.itemsPerPage.toString()); // Osiguraj da je limit uvek prosleđen

    router.push(`/contracts?${params.toString()}`, { scroll: false });

    // Ažuriraj lokalno stanje odmah za bolji odziv.
    // Kada je server paginacija aktivna, ovo će ažurirati stanje, a zatim će ponovno renderovanje
    // od strane Next.js-a sa novim serverskim podacima ponovo potvrditi/sinhronizovati ovo stanje.
    dispatch({ type: 'SET_PAGE', payload: page });

  }, [searchParams, router, state.totalPages, state.itemsPerPage]);

  // Export funkcija (ostaje ista)
  const exportContracts = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('export', 'true');

      const response = await fetch(`/api/contracts/export?${params}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Export error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [searchParams]);

  // Izračunavanja paginacije (ostaju ista)
  const displayedContracts = useMemo(() => getPaginatedContracts(), [getPaginatedContracts]);
  const startItem = state.totalCount > 0 ? (state.currentPage - 1) * state.itemsPerPage + 1 : 0;
  const endItem = Math.min(state.currentPage * state.itemsPerPage, state.totalCount);

  // Generisanje brojeva stranica za paginaciju (ostaje ista)
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (state.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= state.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (state.currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (state.currentPage >= state.totalPages - 2) {
        for (let i = state.totalPages - maxVisiblePages + 1; i <= state.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = state.currentPage - 2; i <= state.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }, [state.currentPage, state.totalPages]);

  return (
    <div className="space-y-6">
      {/* Debug info - ukloni posle testiranja */}
      <div className="text-xs text-muted-foreground p-2 bg-yellow-50 border rounded">
        ContractsSection Debug: 
        Total contracts: {state.contracts.length} | 
        Filtered contracts: {state.filteredContracts.length} |
        Use server pagination: {state.useServerPagination ? 'Yes' : 'No'} |
        Current page: {state.currentPage} |
        Total pages: {state.totalPages} |
        Items per page: {state.itemsPerPage} |
        URL page: {stableSearchParams.page || '1'} |
        URL limit: {stableSearchParams.limit || '25'} |
        Displayed contracts: {displayedContracts.length}
      </div>

      {/* Filters section */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Prosledite initialContracts kao sve ugovore za lokalno filtriranje, ako nije server paginacija */}
        {/* Ako je server paginacija, ContractFilters komponenta mora sama da upravlja ažuriranjem URL-a za filtere */}
        <ContractFilters 
          contracts={useServerPagination ? [] : initialContracts} 
          onFilterChange={handleFilterChange}
          serverTime={serverTime}
        />
      </div>

      {/* Results section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Contracts {state.totalCount > 0 && `(${state.totalCount.toLocaleString()})`}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={exportContracts}
            disabled={state.loading}
          >
            <Download className="h-4 w-4 mr-2" />
            {state.loading ? 'Exporting...' : 'Export'}
          </Button>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : state.totalCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No contracts found matching your criteria.</p>
            </div>
          ) : (
            <>
              <ContractsList 
                contracts={displayedContracts} 
                serverTime={serverTime} 
              />

              {/* Pagination */}
              {state.totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t gap-4">
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {state.totalCount.toLocaleString()} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Show:</span>
                      <Select
                        value={state.itemsPerPage.toString()}
                        onValueChange={handleItemsPerPageChange}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                  </div>
                  
                  {state.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(state.currentPage - 1)}
                        disabled={state.currentPage <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {pageNumbers.map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={state.currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(state.currentPage + 1)}
                        disabled={state.currentPage >= state.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}