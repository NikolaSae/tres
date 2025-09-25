// components/ui/date-range.tsx
"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange as DateRangePrimitive } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeProps {
  className?: string;
  dateRange: DateRangePrimitive;
  onUpdate: (dateRange: DateRangePrimitive) => void;
  align?: "start" | "center" | "end";
}

export function DateRange({
  className,
  dateRange,
  onUpdate,
  align = "start",
}: DateRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (range: DateRangePrimitive | undefined) => {
    if (range) {
      onUpdate(range);
      setIsOpen(false);
    }
  };

  // Predefined date ranges
  const handleLastWeek = () => {
    const today = new Date();
    const from = addDays(today, -7);
    onUpdate({ from, to: today });
    setIsOpen(false);
  };

  const handleLastMonth = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    onUpdate({ from, to: today });
    setIsOpen(false);
  };

  const handleLastQuarter = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    onUpdate({ from, to: today });
    setIsOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="p-3 space-y-3 border-b">
            <h4 className="text-sm font-medium">Quick select</h4>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleLastWeek}
              >
                Last week
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleLastMonth}
              >
                Last month
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleLastQuarter}
              >
                Last quarter
              </Button>
            </div>
          </div>
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}