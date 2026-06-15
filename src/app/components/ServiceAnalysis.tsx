import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { calculateQuarterCompletion } from "../utils/cycleCalculations";
import { FilterOption, FilterState, DashboardFilters } from "./DashboardFilters";
import { DateRangeFilter, DateRange } from "./DateRangeFilter";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Zap, TrendingUp, Target, Award } from "lucide-react";
import { ChevronDown } from "lucide-react";

interface ServiceAnalysisProps {
  visits: VisitRecord[];
}

const QUARTER_CYCLES = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18", "Q19", "Q20"];
const HY_CYCLES = ["HY1", "HY2", "HY3", "HY4", "HY5", "HY6", "HY7", "HY8", "HY9", "HY10"];

const CHART_COLORS = [
  "#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#cffafe",
  "#0ea5e9", "#38bdf8", "#7dd3fc", "#bfdbfe",
  "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe",
  "#8b5cf6", "#a78bfa", "#ddd6fe",
  "#ec4899", "#f472b6", "#fbcfe8",
];

export function ServiceAnalysis({ visits }: ServiceAnalysisProps) {
  const [filters, setFilters] = useState<FilterState>({
    zone: "all",
    state: "all",
    site: "all",
    siteType: "all",
    visitType: "all",
    visitorType: "all",
    vendor: "all",
    status: "all",
    signOffStatus: "all",
  });

  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quarters: true,
    halfyears: true,
    comparison: true,
    summary: true,
  });

  const splitVisitPurposes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const emptyFilters: FilterState = {
    zone: "all",
    state: "all",
    site: "all",
    siteType: "all",
    visitType: "all",
    visitorType: "all",
    vendor: "all",
    status: "all",
    signOffStatus: "all",
  };

  const filterVisitRecords = (
    sourceVisits: VisitRecord[],
    activeFilters: FilterState,
    activeDateRange: DateRange,
    omitFilter?: keyof FilterState,
  ) =>
    sourceVisits.filter((visit) => {
      if (activeDateRange.from && visit.dateOfVisit < activeDateRange.from)
        return false;
      if (activeDateRange.to && visit.dateOfVisit > activeDateRange.to)
        return false;
      if (omitFilter !== "zone" && activeFilters.zone !== "all" && visit.zone !== activeFilters.zone)
        return false;
      if (omitFilter !== "state" && activeFilters.state !== "all" && visit.state !== activeFilters.state)
        return false;
      if (omitFilter !== "site" && activeFilters.site !== "all" && visit.siteName !== activeFilters.site)
        return false;
      if (omitFilter !== "siteType" && activeFilters.siteType !== "all" && visit.siteType !== activeFilters.siteType)
        return false;
      if (
        omitFilter !== "visitType" &&
        activeFilters.visitType !== "all" &&
        !splitVisitPurposes(visit.visitType).includes(activeFilters.visitType)
      )
        return false;
      if (omitFilter !== "visitorType" && activeFilters.visitorType !== "all" && visit.visitorType !== activeFilters.visitorType)
        return false;
      if (omitFilter !== "vendor" && activeFilters.vendor !== "all" && visit.vendorName !== activeFilters.vendor)
        return false;
      if (omitFilter !== "status" && activeFilters.status !== "all" && (visit.rawStatus || visit.status) !== activeFilters.status)
        return false;
      if (omitFilter !== "signOffStatus" && activeFilters.signOffStatus !== "all") {
        const signOffValue = (visit.signOffValue || "").trim().toLowerCase();

        if (activeFilters.signOffStatus === "gate" && !signOffValue.includes("gate")) {
          return false;
        }
        if (activeFilters.signOffStatus === "locks" && !signOffValue.includes("lock")) {
          return false;
        }
        if (activeFilters.signOffStatus === "service" && !signOffValue.includes("service")) {
          return false;
        }
      }
      return true;
    });

  const buildCountOptions = (
    sourceVisits: VisitRecord[],
    getValues: (visit: VisitRecord) => string | string[],
  ): FilterOption[] => {
    const counts = new Map<string, number>();

    sourceVisits.forEach((visit) => {
      const rawValues = getValues(visit);
      const values = Array.isArray(rawValues) ? rawValues : [rawValues];

      values.forEach((value) => {
        const normalized = value?.trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  };

  // Extract unique values for filters
  const zones = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "zone"), (v) => v.zone),
    [visits, filters, dateRange],
  );
  const states = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "state"), (v) => v.state),
    [visits, filters, dateRange],
  );
  const siteNames = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "site"), (v) => v.siteName),
    [visits, filters, dateRange],
  );
  const siteTypes = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "siteType"), (v) => v.siteType),
    [visits, filters, dateRange],
  );
  const visitPurposes = useMemo(
    () =>
      buildCountOptions(
        filterVisitRecords(visits, filters, dateRange, "visitType"),
        (v) => splitVisitPurposes(v.visitType),
      ),
    [visits, filters, dateRange],
  );
  const visitorTypes = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "visitorType"), (v) => v.visitorType),
    [visits, filters, dateRange],
  );
  const vendors = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "vendor"), (v) => v.vendorName),
    [visits, filters, dateRange],
  );
  const statuses = useMemo(
    () => buildCountOptions(filterVisitRecords(visits, filters, dateRange, "status"), (v) => v.rawStatus || v.status),
    [visits, filters, dateRange],
  );
  // Apply filters
  const filteredVisits = useMemo(() => {
    return filterVisitRecords(visits, filters, dateRange);
  }, [visits, filters, dateRange]);

  useEffect(() => {
    if (filters.site === "all") return;
    if (siteNames.some((site) => site.value === filters.site)) return;
    setFilters((prev) => ({ ...prev, site: "all" }));
  }, [filters.site, siteNames]);

  const activeFilterBadges = useMemo(() => {
    const badges: Array<{ label: string; value: string }> = [];

    if (filters.zone !== "all") badges.push({ label: "Zone", value: filters.zone });
    if (filters.site !== "all") badges.push({ label: "Site", value: filters.site });
    if (filters.state !== "all") badges.push({ label: "State", value: filters.state });
    if (filters.siteType !== "all") badges.push({ label: "Site Type", value: filters.siteType });
    if (filters.visitType !== "all") badges.push({ label: "Purpose", value: filters.visitType });
    if (filters.visitorType !== "all") badges.push({ label: "Visitor Type", value: filters.visitorType });
    if (filters.vendor !== "all") badges.push({ label: "Vendor", value: filters.vendor });
    if (filters.status !== "all") badges.push({ label: "Status", value: filters.status });
    if (filters.signOffStatus !== "all") badges.push({ label: "Sign Off", value: filters.signOffStatus });
    if (dateRange.from || dateRange.to) {
      const from = dateRange.from ? dateRange.from.toLocaleDateString() : "Start";
      const to = dateRange.to ? dateRange.to.toLocaleDateString() : "Today";
      badges.push({ label: "Date", value: `${from} - ${to}` });
    }

    return badges;
  }, [filters, dateRange]);

  const clearAllFilters = useCallback(() => {
    setFilters(emptyFilters);
    setDateRange({ from: null, to: null });
  }, []);

  // Calculate distinct Site Name + Visit Purpose combinations
  const distinctServiceCombinations = useMemo(() => {
    const combinations = new Set<string>();
    const quarterCounts: Record<string, number> = {};
    const hyCounts: Record<string, number> = {};

    // Count for quarters
    QUARTER_CYCLES.forEach(q => {
      const result = calculateQuarterCompletion(filteredVisits, q, false);
      quarterCounts[q] = result.completedSitesCount;
      result.matchedRecords.forEach(v => {
        if (v.status === "Completed" || v.rawStatus === "Completed") {
          combinations.add(`${v.siteName}|${q}`);
        }
      });
    });

    // Count for HY
    HY_CYCLES.forEach(hy => {
      const result = calculateQuarterCompletion(filteredVisits, hy, false);
      hyCounts[hy] = result.completedSitesCount;
      result.matchedRecords.forEach(v => {
        if (v.status === "Completed" || v.rawStatus === "Completed") {
          combinations.add(`${v.siteName}|${hy}`);
        }
      });
    });

    return { combinations, quarterCounts, hyCounts };
  }, [filteredVisits]);

  const quarterData = useMemo(() => {
    return QUARTER_CYCLES.map((q) => ({
      name: q,
      count: distinctServiceCombinations.quarterCounts[q] || 0,
    }));
  }, [distinctServiceCombinations.quarterCounts]);

  const hyData = useMemo(() => {
    return HY_CYCLES.map((hy) => ({
      name: hy,
      count: distinctServiceCombinations.hyCounts[hy] || 0,
    }));
  }, [distinctServiceCombinations.hyCounts]);

  const sortedQuarterData = useMemo(() => {
    return [...quarterData].sort((a, b) => b.count - a.count);
  }, [quarterData]);

  const sortedHyData = useMemo(() => {
    return [...hyData].sort((a, b) => b.count - a.count);
  }, [hyData]);

  const summaryMetrics = useMemo(() => {
    const totalQServices = Object.values(distinctServiceCombinations.quarterCounts).reduce((a, b) => a + b, 0);
    const totalHyServices = Object.values(distinctServiceCombinations.hyCounts).reduce((a, b) => a + b, 0);
    
    const quarterEntries = Object.entries(distinctServiceCombinations.quarterCounts);
    const hyEntries = Object.entries(distinctServiceCombinations.hyCounts);
    
    const mostQ = quarterEntries.length > 0 
      ? quarterEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : "N/A";
    const leastQ = quarterEntries.length > 0
      ? quarterEntries.reduce((a, b) => b[1] < a[1] ? b : a)[0]
      : "N/A";
    
    const mostHy = hyEntries.length > 0
      ? hyEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : "N/A";
    const leastHy = hyEntries.length > 0
      ? hyEntries.reduce((a, b) => b[1] < a[1] ? b : a)[0]
      : "N/A";

    return {
      totalQServices,
      totalHyServices,
      mostQ,
      leastQ,
      mostHy,
      leastHy,
    };
  }, [distinctServiceCombinations]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="animate-fade-in relative overflow-hidden flex items-center gap-3 rounded-xl border border-cyan-300/25 bg-gradient-to-r from-slate-900/85 via-slate-900/80 to-blue-950/70 p-3.5 shadow-[0_18px_35px_rgba(2,6,23,0.55)] md:p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/65 to-transparent" />
        <div className="h-5 w-5 text-cyan-400">📅</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-200 mb-1">
            Date Range
          </h3>
          <p className="text-xs text-gray-400">
            Filter services by date period
          </p>
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Filters */}
      <div>
        <DashboardFilters
          filters={filters}
          onFilterChange={setFilters}
          zones={zones}
          states={states}
          sites={siteNames}
          siteTypes={siteTypes}
          visitPurposes={visitPurposes}
          visitorTypes={visitorTypes}
          vendors={vendors}
          statuses={statuses}
          activeBadges={activeFilterBadges}
          hasExternalFilters={Boolean(dateRange.from || dateRange.to)}
          onClearAll={clearAllFilters}
        />
      </div>

      {/* SECTION 5: Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200 text-sm">
              <Zap className="h-4 w-4 text-cyan-400" />
              Total Q Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">
              {summaryMetrics.totalQServices}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Completed Distinct Sites
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200 text-sm">
              <Target className="h-4 w-4 text-purple-400" />
              Total HY Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {summaryMetrics.totalHyServices}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Completed Distinct Sites
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-emerald-500/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200 text-sm">
              <Award className="h-4 w-4 text-emerald-400" />
              Services Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">
              {distinctServiceCombinations.combinations.size}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Total Distinct Combinations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Metrics Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Quarter Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Most Completed</span>
              <span className="font-semibold text-cyan-400">{summaryMetrics.mostQ}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Least Completed</span>
              <span className="font-semibold text-orange-400">{summaryMetrics.leastQ}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Total Q Services</span>
              <span className="font-semibold text-white">{summaryMetrics.totalQServices}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Half-Year Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Most Completed</span>
              <span className="font-semibold text-purple-400">{summaryMetrics.mostHy}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Least Completed</span>
              <span className="font-semibold text-orange-400">{summaryMetrics.leastHy}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800/30 rounded">
              <span className="text-xs text-gray-400">Total HY Services</span>
              <span className="font-semibold text-white">{summaryMetrics.totalHyServices}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: GATE QUARTER ANALYSIS */}
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardHeader className="cursor-pointer hover:bg-gray-800/30 transition" onClick={() => toggleSection('quarters')}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Gate Quarter Analysis (Q1 - Q20)
            </CardTitle>
            <ChevronDown 
              className={`h-5 w-5 text-cyan-400 transition-transform ${expandedSections.quarters ? 'rotate-180' : ''}`}
            />
          </div>
        </CardHeader>
        {expandedSections.quarters && (
          <CardContent className="space-y-6">
            {/* Table */}
            <div className="bg-gray-800/30 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
                  <TableRow>
                    <TableHead className="text-cyan-400">Quarter</TableHead>
                    <TableHead className="text-cyan-400 text-right">Completed Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterData.map((item) => (
                    <TableRow key={item.name} className="border-gray-700/30 hover:bg-gray-800/30">
                      <TableCell className="font-medium text-gray-200">{item.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="bg-cyan-600/30 text-cyan-400 px-3 py-1 rounded-full font-semibold">
                          {item.count}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bar Chart */}
            <div className="h-80 bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="count" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Doughnut Chart */}
            <div className="h-80 flex items-center justify-center bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quarterData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {quarterData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SECTION 2: LOCK HALF YEAR ANALYSIS */}
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardHeader className="cursor-pointer hover:bg-gray-800/30 transition" onClick={() => toggleSection('halfyears')}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <Lock className="h-5 w-5 text-purple-400" />
              Lock Half-Year Analysis (HY1 - HY10)
            </CardTitle>
            <ChevronDown 
              className={`h-5 w-5 text-purple-400 transition-transform ${expandedSections.halfyears ? 'rotate-180' : ''}`}
            />
          </div>
        </CardHeader>
        {expandedSections.halfyears && (
          <CardContent className="space-y-6">
            {/* Table */}
            <div className="bg-gray-800/30 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                  <TableRow>
                    <TableHead className="text-purple-400">HY Cycle</TableHead>
                    <TableHead className="text-purple-400 text-right">Completed Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hyData.map((item) => (
                    <TableRow key={item.name} className="border-gray-700/30 hover:bg-gray-800/30">
                      <TableCell className="font-medium text-gray-200">{item.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="bg-purple-600/30 text-purple-400 px-3 py-1 rounded-full font-semibold">
                          {item.count}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bar Chart */}
            <div className="h-80 bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="count" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Doughnut Chart */}
            <div className="h-80 flex items-center justify-center bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {hyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 10) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SECTION 3: COMPARISON CHARTS */}
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardHeader className="cursor-pointer hover:bg-gray-800/30 transition" onClick={() => toggleSection('comparison')}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Comparison Charts (Sorted: Highest to Lowest)
            </CardTitle>
            <ChevronDown 
              className={`h-5 w-5 text-emerald-400 transition-transform ${expandedSections.comparison ? 'rotate-180' : ''}`}
            />
          </div>
        </CardHeader>
        {expandedSections.comparison && (
          <CardContent className="space-y-6">
            {/* Quarter Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Quarter Comparison (Q1-Q20)</h3>
              <div className="h-96 bg-gray-800/20 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedQuarterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* HY Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Half-Year Comparison (HY1-HY10)</h3>
              <div className="h-96 bg-gray-800/20 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedHyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Trend Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Trend Comparison</h3>
              <div className="h-96 bg-gray-800/20 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quarterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ fill: "#0ea5e9", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
