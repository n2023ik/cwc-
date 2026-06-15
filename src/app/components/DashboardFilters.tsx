import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export type FilterOption = {
  value: string;
  count: number;
};

export interface FilterState {
  zone: string;
  state: string;
  site: string;
  siteType: string;
  visitType: string | "all";
  visitorType: string | "all";
  vendor: string;
  status: string | "all";
  signOffStatus: "all" | "gate" | "locks" | "service";
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  zones: FilterOption[];
  states: FilterOption[];
  sites: FilterOption[];
  siteTypes: FilterOption[];
  visitPurposes: FilterOption[];
  visitorTypes: FilterOption[];
  vendors: FilterOption[];
  statuses: FilterOption[];
  activeBadges?: Array<{ label: string; value: string }>;
  hasExternalFilters?: boolean;
  onClearAll?: () => void;
}

export function DashboardFilters({
  filters,
  onFilterChange,
  zones,
  states,
  sites,
  siteTypes,
  visitPurposes,
  visitorTypes,
  vendors,
  statuses,
  activeBadges = [],
  hasExternalFilters = false,
  onClearAll,
}: DashboardFiltersProps) {
  const hasActiveFilters = 
    filters.zone !== "all" ||
    filters.state !== "all" ||
    filters.site !== "all" ||
    filters.siteType !== "all" ||
    filters.visitType !== "all" ||
    filters.visitorType !== "all" ||
    filters.vendor !== "all" ||
    filters.status !== "all" ||
    filters.signOffStatus !== "all" ||
    hasExternalFilters;

  const resetFilters = () => {
    const resetState = {
      zone: "all",
      state: "all",
      site: "all",
      siteType: "all",
      visitType: "all",
      visitorType: "all",
      vendor: "all",
      status: "all",
      signOffStatus: "all",
    } satisfies FilterState;

    if (onClearAll) {
      onClearAll();
      return;
    }

    onFilterChange(resetState);
  };

  const renderOptionLabel = (option: FilterOption) => `${option.value} (${option.count})`;

  return (
    <div className="bg-slate-950/85 rounded-xl border border-slate-700 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-100 tracking-wide">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All Filters
          </Button>
        )}
      </div>

      {activeBadges.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeBadges.map((badge) => (
            <span
              key={`${badge.label}-${badge.value}`}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100"
            >
              {badge.label}: {badge.value}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-3">
        <Select
          value={filters.zone}
          onValueChange={(value) => onFilterChange({ ...filters, zone: value, site: "all" })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Zones ({zones.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.value} value={zone.value} className="text-slate-100">
                {renderOptionLabel(zone)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.state}
          onValueChange={(value) => onFilterChange({ ...filters, state: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All States ({states.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {states.map((state) => (
              <SelectItem key={state.value} value={state.value} className="text-slate-100">
                {renderOptionLabel(state)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.site}
          onValueChange={(value) => onFilterChange({ ...filters, site: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Sites ({sites.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.value} value={site.value} className="text-slate-100">
                {renderOptionLabel(site)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.siteType}
          onValueChange={(value) => onFilterChange({ ...filters, siteType: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Site Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Site Types ({siteTypes.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {siteTypes.map((siteType) => (
              <SelectItem key={siteType.value} value={siteType.value} className="text-slate-100">
                {renderOptionLabel(siteType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.visitType}
          onValueChange={(value) => onFilterChange({ ...filters, visitType: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Visit Purpose" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Visit Purpose ({visitPurposes.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {visitPurposes.map((purpose) => (
              <SelectItem key={purpose.value} value={purpose.value} className="text-slate-100">
                {renderOptionLabel(purpose)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.visitorType}
          onValueChange={(value) => onFilterChange({ ...filters, visitorType: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Visitor Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Visitor Types ({visitorTypes.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {visitorTypes.map((visitorType) => (
              <SelectItem key={visitorType.value} value={visitorType.value} className="text-slate-100">
                {renderOptionLabel(visitorType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.vendor}
          onValueChange={(value) => onFilterChange({ ...filters, vendor: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Vendors ({vendors.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.value} value={vendor.value} className="text-slate-100">
                {renderOptionLabel(vendor)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ ...filters, status: value })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">
              All Status ({statuses.reduce((sum, option) => sum + option.count, 0)})
            </SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value} className="text-slate-100">
                {renderOptionLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.signOffStatus}
          onValueChange={(value) => onFilterChange({ ...filters, signOffStatus: value as "all" | "gate" | "locks" | "service" })}
        >
          <SelectTrigger className="h-10 bg-slate-900 border-slate-600 text-slate-100 hover:bg-slate-800 data-[placeholder]:text-slate-300">
            <SelectValue placeholder="Sign Off Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-slate-700 text-slate-100">
            <SelectItem value="all" className="text-slate-100">All Sign Off Status</SelectItem>
            <SelectItem value="gate" className="text-slate-100">Gate</SelectItem>
            <SelectItem value="locks" className="text-slate-100">Locks</SelectItem>
            <SelectItem value="service" className="text-slate-100">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
