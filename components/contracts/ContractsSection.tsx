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
        filteredContracts: action.payload.contracts,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        useServerPagination: action.payload.useServerPagination
      };
    
    case 'SET_FILTERED_CONTRACTS':
      const newTotalPages = Math.ceil(action.payload.length / state.itemsPerPage);
      return {
        ...state,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: newTotalPages,
        currentPage: 1
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_ITEMS_PER_PAGE':
      const updatedTotalPages = Math.ceil(
        (state.useServerPagination ? state.totalCount : state.filteredContracts.length) / action.payload
      );
      return {
        ...state,
        itemsPerPage: action.payload,
        totalPages: updatedTotalPages,
        currentPage: 1
      };
    
    case 'SWITCH_TO_LOCAL_PAGINATION':
      return {
        ...state,
        useServerPagination: false,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: Math.ceil(action.payload.length / state.itemsPerPage),
        currentPage: 1
      };
    
    case 'UPDATE_SERVER_DATA':
      if (!state.useServerPagination) return state;
      return {
        ...state,
        contracts: action.payload.contracts,
        filteredContracts: action.payload.contracts,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage
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
}

export function ContractsSection({ 
  initialContracts, 
  serverTime,
  initialTotalCount = 0,
  initialTotalPages = 1,
  initialCurrentPage = 1
}: ContractsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Memoize search params to prevent unnecessary re-renders
  const stableSearchParams = useMemo(() => ({
    search: searchParams.get('search'),
    status: searchParams.get('status'),
    type: searchParams.get('type'),
    partner: searchParams.get('partner'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit')
  }), [searchParams]);

  // Check if there are server-side filters
  const hasServerParams = useMemo(() => {
    return Object.values(stableSearchParams).some(value => value !== null);
  }, [stableSearchParams]);

  // Initialize state
  const initialState: ContractsState = {
    contracts: initialContracts,
    filteredContracts: initialContracts,
    totalCount: hasServerParams ? initialTotalCount : initialContracts.length,
    totalPages: hasServerParams ? initialTotalPages : Math.ceil(initialContracts.length / 25),
    currentPage: hasServerParams ? initialCurrentPage : 1,
    itemsPerPage: parseInt(stableSearchParams.limit || '25'),
    loading: false,
    useServerPagination: hasServerParams
  };

  const [state, dispatch] = useReducer(contractsReducer, initialState);

  // Initialize component with proper data
  useEffect(() => {
    dispatch({
      type: 'SET_INITIAL_DATA',
      payload: {
        contracts: initialContracts,
        totalCount: hasServerParams ? initialTotalCount : initialContracts.length,
        totalPages: hasServerParams ? initialTotalPages : Math.ceil(initialContracts.length / state.itemsPerPage),
        currentPage: hasServerParams ? initialCurrentPage : 1,
        useServerPagination: hasServerParams
      }
    });
  }, [initialContracts, hasServerParams, initialTotalCount, initialTotalPages, initialCurrentPage, state.itemsPerPage]);

  // Cleanup function
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

  // Handler for local filters with debounced router push
  const handleFilterChange = useCallback((filtered: Contract[]) => {
    dispatch({ type: 'SWITCH_TO_LOCAL_PAGINATION', payload: filtered });
    
    // Debounce router push to prevent rapid URL updates
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      currentUrl.search = '';
      router.push(currentUrl.pathname, { scroll: false });
    }, 300);
  }, [router]);

  // Get paginated contracts for display
  const getPaginatedContracts = useCallback(() => {
    if (state.useServerPagination) {
      return state.filteredContracts;
    }
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredContracts.slice(startIndex, endIndex);
  }, [state.useServerPagination, state.filteredContracts, state.currentPage, state.itemsPerPage]);

  // URL helpers
  const createPageUrl = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    return `/contracts${params.toString() ? `?${params.toString()}` : ''}`;
  }, [searchParams]);

  // Event handlers
  const handleItemsPerPageChange = useCallback((value: string) => {
    const newItemsPerPage = parseInt(value);
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: newItemsPerPage });
    
    if (state.useServerPagination) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('limit', value);
      params.delete('page');
      router.push(`/contracts?${params.toString()}`, { scroll: false });
    }
  }, [state.useServerPagination, searchParams, router]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return;
    
    if (state.useServerPagination) {
      const url = createPageUrl(page);
      router.push(url, { scroll: false });
    } else {
      dispatch({ type: 'SET_PAGE', payload: page });
    }
  }, [state.useServerPagination, state.totalPages, createPageUrl, router]);

  // Export function with abort controller
  const exportContracts = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Abort any existing request
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
        return; // Request was aborted, ignore
      }
      console.error('Export error:', error);
      // TODO: Show toast notification
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [searchParams]);

  // Pagination calculations
  const displayedContracts = useMemo(() => getPaginatedContracts(), [getPaginatedContracts]);
  const startItem = state.totalCount > 0 ? (state.currentPage - 1) * state.itemsPerPage + 1 : 0;
  const endItem = Math.min(state.currentPage * state.itemsPerPage, state.totalCount);

  // Generate page numbers for pagination
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
      {/* Filters section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <ContractFilters 
          contracts={state.useServerPagination ? state.contracts : initialContracts} 
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