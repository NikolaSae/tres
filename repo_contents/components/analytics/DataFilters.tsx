///components/analytics/DataFilters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    CalendarIcon,
    FilterIcon,
    XIcon,
    Search,
    ChevronDown,
    ArrowDownWideNarrow,
    ArrowUpWideNarrow
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function safeArray(arr) {
    return Array.isArray(arr) ? arr : [];
}

export interface DataFilterOptions {
    dateRange?: {
        from: Date | null;
        to: Date | null;
    };
    providerIds?: string[];
    serviceTypes?: string[];
    productIds?: string[];
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface DataFiltersProps {
    initialFilters?: DataFilterOptions;
    onFilterChange?: (filters: DataFilterOptions) => void;
    showDateRange?: boolean;
    showProviders?: boolean;
    showServiceTypes?: boolean;
    showProducts?: boolean;
    showSearch?: boolean;
    showSort?: boolean;
    className?: string;
    providersData?: { id: string; name: string }[];
    serviceTypesData?: { id: string; name: string }[];
    productsData?: { id: string; name: string }[];
}

const SORT_OPTIONS = [
    { value: 'date', label: 'Date' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'collected', label: 'Collected Amount' },
];

export function DataFilters({
    initialFilters = {},
    onFilterChange,
    showDateRange = true,
    showProviders = true,
    showServiceTypes = true,
    showProducts = false,
    showSearch = true,
    showSort = true,
    className = '',
    providersData = [],
    serviceTypesData = [],
    productsData = [],
}: DataFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState<DataFilterOptions>(initialFilters);

    const [dateOpen, setDateOpen] = useState(false);
    const [providerOpen, setProviderOpen] = useState(false);
    const [serviceTypeOpen, setServiceTypeOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);

    useEffect(() => {
        const params = searchParams;

        const filtersFromUrl: DataFilterOptions = {
            dateRange: {
                 from: typeof params.get('dateFrom') === 'string' ? new Date(params.get('dateFrom')!) : null,
                 to: typeof params.get('dateTo') === 'string' ? new Date(params.get('dateTo')!) : null,
            },
            providerIds: safeArray(params.get('providers')?.split(',')),
            serviceTypes: safeArray(params.get('serviceTypes')?.split(',')),
            productIds: safeArray(params.get('products')?.split(',')),
            searchQuery: params.get('q') || '',
            sortBy: params.get('sort') || 'date',
            sortOrder: (params.get('order') as 'asc' | 'desc') || 'desc',
        };

        if (JSON.stringify(filtersFromUrl) !== JSON.stringify(filters)) {
             setFilters(filtersFromUrl);
        }

    }, [searchParams, filters]);

    useEffect(() => {
        if (onFilterChange) {
             onFilterChange(filters);
        }
    }, [filters, onFilterChange]);

    const handleDateSelect = (range: { from?: Date | null; to?: Date | null } | undefined) => {
        if (!range) return;
        const newDateRange = {
            from: range.from || null,
            to: range.to || null,
        };
        updateFilters({ dateRange: newDateRange });
    };

    const handleProviderToggle = (providerId: string) => {
        const currentProviders = safeArray(filters.providerIds);
        const newProviders = currentProviders.includes(providerId)
            ? currentProviders.filter(id => id !== providerId)
            : [...currentProviders, providerId];
        updateFilters({ providerIds: newProviders });
    };

    const handleServiceTypeToggle = (serviceType: string) => {
        const currentTypes = safeArray(filters.serviceTypes);
        const newTypes = currentTypes.includes(serviceType)
            ? currentTypes.filter(type => type !== serviceType)
            : [...currentTypes, serviceType];
        updateFilters({ serviceTypes: newTypes });
    };

    const handleProductToggle = (productId: string) => {
        const currentProducts = safeArray(filters.productIds);
        const newProducts = currentProducts.includes(productId)
            ? currentProducts.filter(id => id !== productId)
            : [...currentProducts, productId];
        updateFilters({ productIds: newProducts });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        updateFilters({ searchQuery: query });
    };

    const handleSortByChange = (sortBy: string) => {
        updateFilters({ sortBy });
    };

    const handleSortOrderChange = () => {
        const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
        updateFilters({ sortOrder: newOrder });
    };

    const updateFilters = (newFilters: Partial<DataFilterOptions>) => {
        const hypotheticalFilters = {
            ...filters,
            ...newFilters,
             dateRange: newFilters.dateRange !== undefined ? {
                 ...filters.dateRange,
                 ...newFilters.dateRange,
             } : filters.dateRange,
             providerIds: safeArray(newFilters.providerIds !== undefined ? newFilters.providerIds : filters.providerIds),
             serviceTypes: safeArray(newFilters.serviceTypes !== undefined ? newFilters.serviceTypes : filters.serviceTypes),
             productIds: safeArray(newFilters.productIds !== undefined ? newFilters.productIds : filters.productIds),
        };

        const params = new URLSearchParams();

        if (hypotheticalFilters.dateRange?.from) params.set('dateFrom', format(hypotheticalFilters.dateRange.from, 'yyyy-MM-dd'));
        if (hypotheticalFilters.dateRange?.to) params.set('dateTo', format(hypotheticalFilters.dateRange.to, 'yyyy-MM-dd'));

        if (hypotheticalFilters.providerIds && hypotheticalFilters.providerIds.length > 0) params.set('providers', hypotheticalFilters.providerIds.join(','));
        if (hypotheticalFilters.serviceTypes && hypotheticalFilters.serviceTypes.length > 0) params.set('serviceTypes', hypotheticalFilters.serviceTypes.join(','));
        if (hypotheticalFilters.productIds && hypotheticalFilters.productIds.length > 0) params.set('products', hypotheticalFilters.productIds.join(','));
        if (hypotheticalFilters.searchQuery) params.set('q', hypotheticalFilters.searchQuery);

        params.set('sort', hypotheticalFilters.sortBy || 'date');
        params.set('order', hypotheticalFilters.sortOrder || 'desc');

        const newParamsString = params.toString();
        const currentParamsString = searchParams.toString();

        if (currentParamsString !== newParamsString) {
             router.push(`${pathname}?${params.toString()}`);
        }
    };

    const resetFilters = () => {
         const params = new URLSearchParams();
         params.set('sort', 'date');
         params.set('order', 'desc');
         router.push(`${pathname}?${params.toString()}`);
    };

    const formatDateRange = () => {
        const { from, to } = filters.dateRange || { from: null, to: null };
        if (from && to) {
             if (from.toDateString() === to.toDateString()) {
                 return format(from, 'MMM d,yyyy');
             }
             return `${format(from, 'MMM d,yyyy')} - ${format(to, 'MMM d,yyyy')}`;
        }
        if (from) {
            return `From ${format(from, 'MMM d,yyyy')}`;
        }
        if (to) {
            return `Until ${format(to, 'MMM d,yyyy')}`;
        }
        return 'All Time';
    };

    const selectedProviderCount = safeArray(filters.providerIds).length;
    const selectedServiceCount = safeArray(filters.serviceTypes).length;
    const selectedProductCount = safeArray(filters.productIds).length;
    const hasActiveFilters =
         (filters.dateRange?.from || filters.dateRange?.to) ||
         selectedProviderCount > 0 ||
         selectedServiceCount > 0 ||
         selectedProductCount > 0 ||
         (filters.searchQuery && filters.searchQuery.length > 0);

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-2 lg:space-x-4 items-center">
                    {showSearch && (
                        <div className="flex-1 min-w-[150px] max-w-sm">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    value={filters.searchQuery || ''}
                                    onChange={handleSearchChange}
                                    className="w-full rounded-lg bg-background pl-8"
                                />
                            </div>
                        </div>
                    )}

                    {showDateRange && (
                       <Popover open={dateOpen} onOpenChange={setDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !filters.dateRange?.from && !filters.dateRange?.to && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formatDateRange()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={filters.dateRange?.from || new Date()}
                                    selected={filters.dateRange as any}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={2}
                                />
                                <div className="flex justify-end p-2">
                                    <Button variant="outline" size="sm" onClick={() => setDateOpen(false)}>Close</Button>
                                </div>
                            </PopoverContent>
                       </Popover>
                    )}

                    {showProviders && (
                       <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                    <FilterIcon className="mr-2 h-4 w-4" />
                                    {selectedProviderCount > 0 ? `${selectedProviderCount} Providers` : 'All Providers'}
                                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <CardContent className="p-4 max-h-[300px] overflow-y-auto">
                                    <div className="grid gap-2">
                                         {providersData.map(provider => (
                                            <div key={provider.id} className="flex items-center space-x-2">
                                               <Checkbox
                                                  id={`provider-${provider.id}`}
                                                  checked={safeArray(filters.providerIds).includes(provider.id)}
                                                  onCheckedChange={() => handleProviderToggle(provider.id)}
                                               />
                                               <Label
                                                  htmlFor={`provider-${provider.id}`}
                                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                               >
                                                  {provider.name}
                                               </Label>
                                            </div>
                                         ))}
                                         {providersData.length === 0 && <p className="text-sm text-muted-foreground">No providers available.</p>}
                                    </div>
                                </CardContent>
                            </PopoverContent>
                       </Popover>
                    )}

                    {showServiceTypes && (
                       <Popover open={serviceTypeOpen} onOpenChange={setServiceTypeOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                    <FilterIcon className="mr-2 h-4 w-4" />
                                    {selectedServiceCount > 0 ? `${selectedServiceCount} Services` : 'All Services'}
                                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <CardContent className="p-4 max-h-[300px] overflow-y-auto">
                                    <div className="grid gap-2">
                                         {serviceTypesData.map(type => (
                                            <div key={type.id} className="flex items-center space-x-2">
                                               <Checkbox
                                                  id={`service-type-${type.id}`}
                                                  checked={safeArray(filters.serviceTypes).includes(type.id)}
                                                  onCheckedChange={() => handleServiceTypeToggle(type.id)}
                                               />
                                               <Label
                                                  htmlFor={`service-type-${type.id}`}
                                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                               >
                                                  {type.name}
                                               </Label>
                                            </div>
                                         ))}
                                         {serviceTypesData.length === 0 && <p className="text-sm text-muted-foreground">No service types available.</p>}
                                    </div>
                                </CardContent>
                            </PopoverContent>
                       </Popover>
                    )}

                    {showProducts && (
                       <Popover open={productOpen} onOpenChange={setProductOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                    <FilterIcon className="mr-2 h-4 w-4" />
                                    {selectedProductCount > 0 ? `${selectedProductCount} Products` : 'All Products'}
                                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <CardContent className="p-4 max-h-[300px] overflow-y-auto">
                                    <div className="grid gap-2">
                                         {productsData.map(product => (
                                            <div key={product.id} className="flex items-center space-x-2">
                                               <Checkbox
                                                  id={`product-${product.id}`}
                                                  checked={safeArray(filters.productIds).includes(product.id)}
                                                  onCheckedChange={() => handleProductToggle(product.id)}
                                               />
                                               <Label
                                                  htmlFor={`product-${product.id}`}
                                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                               >
                                                  {product.name}
                                               </Label>
                                            </div>
                                         ))}
                                          {productsData.length === 0 && <p className="text-sm text-muted-foreground">No products available.</p>}
                                    </div>
                                </CardContent>
                            </PopoverContent>
                       </Popover>
                    )}

                    {showSort && (
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="sort-by" className="sr-only">Sort By</Label>
                            <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                                <SelectTrigger id="sort-by" className="w-[180px]">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={handleSortOrderChange}>
                                {filters.sortOrder === 'asc' ? (
                                    <ArrowUpWideNarrow className="h-4 w-4" />
                                ) : (
                                    <ArrowDownWideNarrow className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )}

                     {hasActiveFilters && (
                         <Button variant="ghost" onClick={resetFilters} className="shrink-0">
                             <XIcon className="mr-1 h-4 w-4" />
                             Reset Filters
                         </Button>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}