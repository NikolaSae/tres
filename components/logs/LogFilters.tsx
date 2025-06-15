///components/logs/LogFilters.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogActionType, LogStatus } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, Search, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Added Card imports


interface LogFiltersState {
    action?: LogActionType | 'ALL';
    status?: LogStatus | 'ALL';
    subjectKeyword?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

interface LogFiltersProps {
    initialFilters?: LogFiltersState;
    onFilterChange: (filters: LogFiltersState) => void;
}

export function LogFilters({ initialFilters = {}, onFilterChange }: LogFiltersProps) {
    const [filters, setFilters] = useState<LogFiltersState>(initialFilters);

    useEffect(() => {
        const handler = setTimeout(() => {
            onFilterChange(filters);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [filters, onFilterChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFilters(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof LogFiltersState, value: string) => {
        setFilters(prev => ({ ...prev, [id]: value }));
    };

     const handleDateChange = (id: keyof LogFiltersState, date: Date | undefined) => {
         setFilters(prev => ({ ...prev, [id]: date }));
     };


    const handleClearFilters = () => {
        const emptyFilters: LogFiltersState = {};
        setFilters(emptyFilters);
    };

    const areFiltersApplied = Object.values(filters).some(
        value => value !== undefined && value !== null && value !== '' && (typeof value !== 'string' || value.trim() !== '')
    );


    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="action">Action</Label>
                        <Select
                            value={filters.action || 'ALL'}
                            onValueChange={(value: LogActionType | 'ALL') => handleSelectChange('action', value)}
                        >
                            <SelectTrigger id="action">
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value={LogActionType.ACTIVATION}>Activation</SelectItem>
                                <SelectItem value={LogActionType.DEACTIVATION}>Deactivation</SelectItem>
                                <SelectItem value={LogActionType.STATUS_CHANGE}>Status Change</SelectItem>
                                <SelectItem value={LogActionType.NOTE}>Note</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={filters.status || 'ALL'}
                            onValueChange={(value: LogStatus | 'ALL') => handleSelectChange('status', value)}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value={LogStatus.IN_PROGRESS}>In Progress</SelectItem>
                                <SelectItem value={LogStatus.FINISHED}>Finished</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="subjectKeyword">Subject Keyword</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="subjectKeyword"
                                value={filters.subjectKeyword || ''}
                                onChange={handleInputChange}
                                placeholder="Search subject..."
                                className="pl-8"
                            />
                        </div>
                    </div>

                     <div>
                         <Label htmlFor="dateFrom">Date From</Label>
                         <Popover>
                             <PopoverTrigger asChild>
                                 <Button
                                     variant={"outline"}
                                     className={cn(
                                         "w-full justify-start text-left font-normal",
                                         !filters.dateFrom && "text-muted-foreground"
                                     )}
                                 >
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {filters.dateFrom ? format(filters.dateFrom, "PPP") : <span>Pick a date</span>}
                                 </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                                 <Calendar
                                     mode="single"
                                     selected={filters.dateFrom}
                                     onSelect={(date) => handleDateChange('dateFrom', date)}
                                     initialFocus
                                 />
                             </PopoverContent>
                         </Popover>
                     </div>

                     <div>
                         <Label htmlFor="dateTo">Date To</Label>
                         <Popover>
                             <PopoverTrigger asChild>
                                 <Button
                                     variant={"outline"}
                                     className={cn(
                                         "w-full justify-start text-left font-normal",
                                         !filters.dateTo && "text-muted-foreground"
                                     )}
                                 >
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {filters.dateTo ? format(filters.dateTo, "PPP") : <span>Pick a date</span>}
                                 </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                                 <Calendar
                                     mode="single"
                                     selected={filters.dateTo}
                                     onSelect={(date) => handleDateChange('dateTo', date)}
                                     initialFocus
                                 />
                             </PopoverContent>
                         </Popover>
                     </div>

                </div>

                 {areFiltersApplied && (
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={handleClearFilters}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
