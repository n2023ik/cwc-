import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    {
      label: "Today",
      getDates: () => {
        const now = new Date();
        return {
          from: now,
          to: now,
        };
      },
    },
    {
      label: "Last 7 Days",
      getDates: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: "Last 30 Days",
      getDates: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: "Last 90 Days",
      getDates: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: "This Month",
      getDates: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      },
    },
    {
      label: "Last Month",
      getDates: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      },
    },
    {
      label: "This Year",
      getDates: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31),
        };
      },
    },
  ];

  const hasDateRange = dateRange.from || dateRange.to;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`justify-start text-left font-normal bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 ${
              hasDateRange ? "text-cyan-400 border-cyan-500/50" : "text-gray-300"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
          <div className="flex">
            <div className="border-r border-gray-700 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Select</p>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-gray-800 text-gray-300"
                  onClick={() => {
                    onDateRangeChange(preset.getDates());
                    setIsOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-3">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  if (range) {
                    onDateRangeChange({
                      from: range.from || null,
                      to: range.to || null,
                    });
                  }
                }}
                numberOfMonths={2}
                className="text-gray-300"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasDateRange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateRangeChange({ from: null, to: null })}
          className="h-10 w-10 hover:bg-gray-800/50 text-gray-400 hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
