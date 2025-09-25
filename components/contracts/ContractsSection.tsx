// Path: /components/contracts/ContractsSection.tsx
"use client";

import { useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContractFilters } from "@/components/contracts/ContractFilters";
import { ContractsList} from "@/components/contracts/ContractList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { Contract } from "@/lib/types/contract-types";
import { ContractStatus } from "@prisma/client";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

type ContractsAction =
  | { type: 'SET_INITIAL_DATA'; payload: { contracts: Contract[]; totalCount: number; totalPages: number; currentPage: number; useServerPagination: boolean } }
  | { type: 'SET_FILTERED_CONTRACTS'; payload: Contract[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SWITCH_TO_LOCAL_PAGINATION'; payload: Contract[] }
  | { type: 'UPDATE_SERVER_DATA'; payload: { contracts: Contract[]; totalCount: number; totalPages: number; currentPage: number } };

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
        useServerPagination: action.payload.useServerPagination,
      };
    
    case 'SET_FILTERED_CONTRACTS':
      const newTotalPagesFiltered = Math.ceil(action.payload.length / state.itemsPerPage);
      return {
        ...state,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: newTotalPagesFiltered,
        currentPage: 1,
        useServerPagination: false
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
      return {
        ...state,
        useServerPagination: false,
        filteredContracts: action.payload,
        totalCount: action.payload.length,
        totalPages: Math.ceil(action.payload.length / state.itemsPerPage),
        currentPage: 1
      };
    
    case 'UPDATE_SERVER_DATA':
      return {
        ...state,
        contracts: action.payload.contracts,
        filteredContracts: action.payload.contracts,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        useServerPagination: true
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

  const initialState: ContractsState = {
    contracts: initialContracts,
    filteredContracts: initialContracts,
    totalCount: initialTotalCount,
    totalPages: initialTotalPages,
    currentPage: initialCurrentPage,
    itemsPerPage: urlLimit,
    loading: false,
    useServerPagination: useServerPagination
  };

  const [state, dispatch] = useReducer(contractsReducer, initialState);

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
      dispatch({
        type: 'SET_INITIAL_DATA',
        payload: {
            contracts: initialContracts,
            totalCount: initialContracts.length,
            totalPages: Math.ceil(initialContracts.length / state.itemsPerPage),
            currentPage: initialCurrentPage,
            useServerPagination: false
        }
      });
    }
  }, [useServerPagination, initialContracts, initialTotalCount, initialTotalPages, initialCurrentPage, state.itemsPerPage]);

  useEffect(() => {
    if (urlLimit !== state.itemsPerPage) {
      dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: urlLimit });
    }
  }, [urlLimit, state.itemsPerPage]);

  useEffect(() => {
    if (urlPage !== state.currentPage && !state.loading) {
      dispatch({ type: 'SET_PAGE', payload: urlPage });
    }
  }, [urlPage, state.currentPage, state.loading]);

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

  const handleFilterChange = useCallback((filtered: Contract[]) => {
    dispatch({ type: 'SWITCH_TO_LOCAL_PAGINATION', payload: filtered });
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      const paramsToKeep = new URLSearchParams();
      if (stableSearchParams.page) paramsToKeep.set('page', stableSearchParams.page);
      if (stableSearchParams.limit) paramsToKeep.set('limit', stableSearchParams.limit);

      router.push(`/contracts?${paramsToKeep.toString()}`, { scroll: false });
    }, 300);
  }, [router, stableSearchParams.page, stableSearchParams.limit]);

  const getPaginatedContracts = useCallback(() => {
    if (state.useServerPagination) {
      return state.contracts;
    }
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.filteredContracts.slice(startIndex, endIndex);
  }, [state.useServerPagination, state.contracts, state.filteredContracts, state.currentPage, state.itemsPerPage]);

  const createPageUrl = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    params.set('limit', state.itemsPerPage.toString());
    return `/contracts${params.toString() ? `?${params.toString()}` : ''}`;
  }, [searchParams, state.itemsPerPage]);

  const handleItemsPerPageChange = useCallback((value: string) => {
    const newItemsPerPage = parseInt(value);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', value);
    params.delete('page');
    router.push(`/contracts?${params.toString()}`, { scroll: false });

    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: newItemsPerPage });
  }, [searchParams, router]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    params.set('limit', state.itemsPerPage.toString());

    router.push(`/contracts?${params.toString()}`, { scroll: false });

    dispatch({ type: 'SET_PAGE', payload: page });

  }, [searchParams, router, state.totalPages, state.itemsPerPage]);

  const exportAsCSV = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
    
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    
      abortControllerRef.current = new AbortController();
    
      const params = new URLSearchParams(searchParams.toString());
      params.set('export', 'csv');

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

  const exportAsPDF = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
    
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    
      abortControllerRef.current = new AbortController();
    
      const params = new URLSearchParams(searchParams.toString());
      params.set('export', 'csv');
      params.set('format', 'pdf');

      const response = await fetch(`/api/contracts/export?${params}`, {
        signal: abortControllerRef.current.signal
      });
    
      if (!response.ok) throw new Error('Export failed');
    
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const displayedContracts = useMemo(() => getPaginatedContracts(), [getPaginatedContracts]);
  const startItem = state.totalCount > 0 ? (state.currentPage - 1) * state.itemsPerPage + 1 : 0;
  const endItem = Math.min(state.currentPage * state.itemsPerPage, state.totalCount);

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

      <div className="bg-white rounded-lg shadow-sm border">
        <ContractFilters 
          contracts={useServerPagination ? [] : initialContracts} 
          onFilterChange={handleFilterChange}
          serverTime={serverTime}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Contracts {state.totalCount > 0 && `(${state.totalCount.toLocaleString()})`}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsCSV}
              disabled={state.loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {state.loading ? 'Exporting...' : 'Export as CSV'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPDF}
              disabled={state.loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              {state.loading ? 'Exporting...' : 'Export as PDF'}
            </Button>
          </div>
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