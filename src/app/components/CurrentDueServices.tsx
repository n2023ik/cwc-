import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { calculateQuarterCompletion, isValidSiteType, splitVisitPurposes, visitPurposeHasCycle } from "../utils/cycleCalculations";
import { Progress } from "./ui/progress";
import { TrendingUp, Lock, AlertCircle, Bug, ChevronDown, Search, Download, ArrowUpDown } from "lucide-react";
import { FilterState } from "./DashboardFilters";
import { DateRange } from "./DateRangeFilter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import * as XLSX from "xlsx";

interface CurrentDueServicesProps {
  visits: VisitRecord[];
  filters: FilterState;
  dateRange: DateRange;
}

const GATE_CYCLES = [
  { label: "Q1", months: "Jan-Mar" },
  { label: "Q2", months: "Apr-Jun" },
  { label: "Q3", months: "Jul-Sep" },
  { label: "Q4", months: "Oct-Dec" },
  { label: "Q5", months: "Jan-Mar" },
  { label: "Q6", months: "Apr-Jun" },
  { label: "Q7", months: "Jul-Sep" },
  { label: "Q8", months: "Oct-Dec" },
  { label: "Q9", months: "Jan-Mar" },
  { label: "Q10", months: "Apr-Jun" },
  { label: "Q11", months: "Jul-Sep" },
  { label: "Q12", months: "Oct-Dec" },
  { label: "Q13", months: "Jan-Mar" },
  { label: "Q14", months: "Apr-Jun" },
  { label: "Q15", months: "Jul-Sep" },
  { label: "Q16", months: "Oct-Dec" },
  { label: "Q17", months: "Jan-Mar" },
  { label: "Q18", months: "Apr-Jun" },
  { label: "Q19", months: "Jul-Sep" },
  { label: "Q20", months: "Oct-Dec" },
];

const HALF_YEAR_CYCLES = [
  { label: "HY1", months: "Jan-Jun" },
  { label: "HY2", months: "Jul-Dec" },
  { label: "HY3", months: "Jan-Jun" },
  { label: "HY4", months: "Jul-Dec" },
  { label: "HY5", months: "Jan-Jun" },
  { label: "HY6", months: "Jul-Dec" },
  { label: "HY7", months: "Jan-Jun" },
  { label: "HY8", months: "Jul-Dec" },
  { label: "HY9", months: "Jan-Jun" },
  { label: "HY10", months: "Jul-Dec" },
];

type ServiceKind = "gates" | "locks";
type ServiceListMode = "completed" | "pending";
type SortDirection = "asc" | "desc";
type ServiceSortKey =
  | "siteName"
  | "zone"
  | "state"
  | "cycle"
  | "completionDate"
  | "visitPurpose"
  | "visitorType"
  | "currentCycle"
  | "lastCompletedCycle"
  | "lastVisitDate"
  | "pendingStatus";

type CompletedServiceRow = {
  siteName: string;
  zone: string;
  state: string;
  cycle: string;
  completionDate: Date | null;
  visitPurpose: string;
  visitorType: string;
};

type PendingServiceRow = {
  siteName: string;
  zone: string;
  state: string;
  currentCycle: string;
  lastCompletedCycle: string;
  lastVisitDate: Date | null;
  pendingStatus: string;
};

export function CurrentDueServices({
  visits,
  filters,
  dateRange,
}: CurrentDueServicesProps) {
  const TOTAL_GATES = 185;
  const TOTAL_LOCKS = 223;
  const [showDebug, setShowDebug] = useState(false);
  const [serviceListRequest, setServiceListRequest] = useState<{
    kind: ServiceKind;
    mode: ServiceListMode;
  } | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceSort, setServiceSort] = useState<{
    key: ServiceSortKey;
    direction: SortDirection;
  }>({ key: "siteName", direction: "asc" });
  
  const [selectedGateCycle, setSelectedGateCycle] = useState<string>(
    () => {
      const month = new Date().getMonth() + 1;
      if (month <= 3) return "Q1";
      if (month <= 6) return "Q2";
      if (month <= 9) return "Q3";
      return "Q4";
    }
  );
  const [selectedLockCycle, setSelectedLockCycle] = useState<string>(
    () => {
      const month = new Date().getMonth() + 1;
      if (month <= 6) return "HY1";
      return "HY2";
    }
  );

  const gateSelectedData = useMemo(() => 
    GATE_CYCLES.find(c => c.label === selectedGateCycle), 
    [selectedGateCycle]
  );

  const lockSelectedData = useMemo(() => 
    HALF_YEAR_CYCLES.find(c => c.label === selectedLockCycle), 
    [selectedLockCycle]
  );

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      if (dateRange.from && visit.dateOfVisit < dateRange.from) return false;
      if (dateRange.to && visit.dateOfVisit > dateRange.to) return false;
      if (filters.zone !== "all" && visit.zone !== filters.zone) return false;
      if (filters.state !== "all" && visit.state !== filters.state) return false;
      if (filters.siteType !== "all" && visit.siteType !== filters.siteType) return false;
      if (filters.visitType !== "all" && !splitVisitPurposes(visit.visitType).includes(filters.visitType)) return false;
      if (filters.visitorType !== "all" && visit.visitorType !== filters.visitorType) return false;
      if (filters.vendor !== "all" && visit.vendorName !== filters.vendor) return false;
      if (filters.status !== "all" && (visit.rawStatus || visit.status) !== filters.status) return false;
      return true;
    });
  }, [visits, filters, dateRange]);

  const gateDebugData = useMemo(() => {
    const cycleToken = selectedGateCycle;
    const result = calculateQuarterCompletion(filteredVisits, cycleToken, true);

    const completed = result.completedSitesCount;
    const pending = Math.max(0, TOTAL_GATES - completed);
    const completionPercent = TOTAL_GATES > 0 ? (completed / TOTAL_GATES) * 100 : 0;

    return { completed, pending, completionPercent, matchedRecords: result.matchedRecords, uniqueSites: result.uniqueSites };
  }, [filteredVisits, selectedGateCycle]);

  const lockDebugData = useMemo(() => {
    const cycleToken = selectedLockCycle;
    const result = calculateQuarterCompletion(filteredVisits, cycleToken, true);

    const completed = result.completedSitesCount;
    const pending = Math.max(0, TOTAL_LOCKS - completed);
    const completionPercent = TOTAL_LOCKS > 0 ? (completed / TOTAL_LOCKS) * 100 : 0;

    return { completed, pending, completionPercent, matchedRecords: result.matchedRecords, uniqueSites: result.uniqueSites };
  }, [filteredVisits, selectedLockCycle]);

  const buildCompletedRows = (cycle: string): CompletedServiceRow[] => {
    const siteMap = new Map<string, VisitRecord>();

    filteredVisits.forEach((visit) => {
      if (!isValidSiteType(visit.siteType, cycle)) return;
      if (!visitPurposeHasCycle(visit.visitType, cycle)) return;
      if (visit.status !== "Completed" && visit.rawStatus !== "Completed") return;

      const siteName = visit.siteName || "Unknown Site";
      const existing = siteMap.get(siteName);
      if (!existing || visit.dateOfVisit > existing.dateOfVisit) {
        siteMap.set(siteName, visit);
      }
    });

    return Array.from(siteMap.values()).map((visit) => ({
      siteName: visit.siteName || "Unknown Site",
      zone: visit.zone || "-",
      state: visit.state || "-",
      cycle,
      completionDate: visit.dateOfVisit || null,
      visitPurpose: visit.visitType || "-",
      visitorType: visit.visitorType || "-",
    }));
  };

  const getVisitCycleLabel = (visit: VisitRecord, serviceKind: ServiceKind) => {
    const cycleFromField = (visit.cycle || "").trim();
    if (
      (serviceKind === "gates" && cycleFromField.toUpperCase().startsWith("Q")) ||
      (serviceKind === "locks" && cycleFromField.toUpperCase().startsWith("HY"))
    ) {
      return cycleFromField;
    }

    const purposeCycle = splitVisitPurposes(visit.visitType).find((purpose) =>
      serviceKind === "gates"
        ? purpose.toUpperCase().startsWith("Q")
        : purpose.toUpperCase().startsWith("HY"),
    );

    return purposeCycle || "-";
  };

  const buildPendingRows = (cycle: string, serviceKind: ServiceKind): PendingServiceRow[] => {
    const siteMap = new Map<string, VisitRecord[]>();

    filteredVisits.forEach((visit) => {
      if (!isValidSiteType(visit.siteType, cycle)) return;
      const siteName = visit.siteName || "Unknown Site";
      siteMap.set(siteName, [...(siteMap.get(siteName) || []), visit]);
    });

    return Array.from(siteMap.entries())
      .filter(([, siteVisits]) =>
        !siteVisits.some(
          (visit) =>
            visitPurposeHasCycle(visit.visitType, cycle) &&
            (visit.status === "Completed" || visit.rawStatus === "Completed"),
        ),
      )
      .map(([siteName, siteVisits]) => {
        const latestVisit = [...siteVisits].sort((a, b) => b.dateOfVisit.getTime() - a.dateOfVisit.getTime())[0];
        const latestCycleVisit = siteVisits.find((visit) => visitPurposeHasCycle(visit.visitType, cycle));
        const lastCompletedVisit = siteVisits
          .filter((visit) => visit.status === "Completed" || visit.rawStatus === "Completed")
          .sort((a, b) => b.dateOfVisit.getTime() - a.dateOfVisit.getTime())[0];

        return {
          siteName,
          zone: latestVisit?.zone || "-",
          state: latestVisit?.state || "-",
          currentCycle: cycle,
          lastCompletedCycle: lastCompletedVisit ? getVisitCycleLabel(lastCompletedVisit, serviceKind) : "-",
          lastVisitDate: latestVisit?.dateOfVisit || null,
          pendingStatus: latestCycleVisit ? (latestCycleVisit.rawStatus || latestCycleVisit.status || "Pending") : `No ${cycle} visit recorded`,
        };
      });
  };

  const serviceRows = useMemo(() => {
    if (!serviceListRequest) return [];
    const cycle = serviceListRequest.kind === "gates" ? selectedGateCycle : selectedLockCycle;

    return serviceListRequest.mode === "completed"
      ? buildCompletedRows(cycle)
      : buildPendingRows(cycle, serviceListRequest.kind);
  }, [serviceListRequest, filteredVisits, selectedGateCycle, selectedLockCycle]);

  const formatDate = (date: Date | null) =>
    date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  const visibleServiceRows = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    const rows = serviceRows.filter((row) =>
      !query ||
      Object.values(row).some((value) => {
        if (value instanceof Date) return formatDate(value).toLowerCase().includes(query);
        return String(value || "").toLowerCase().includes(query);
      }),
    );

    return [...rows].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[serviceSort.key];
      const bValue = (b as Record<string, unknown>)[serviceSort.key];
      const normalizedA = aValue instanceof Date ? aValue.getTime() : String(aValue || "").toLowerCase();
      const normalizedB = bValue instanceof Date ? bValue.getTime() : String(bValue || "").toLowerCase();

      if (normalizedA < normalizedB) return serviceSort.direction === "asc" ? -1 : 1;
      if (normalizedA > normalizedB) return serviceSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [serviceRows, serviceSearch, serviceSort]);

  const openServiceList = (kind: ServiceKind, mode: ServiceListMode) => {
    setServiceListRequest({ kind, mode });
    setServiceSearch("");
    setServiceSort({ key: "siteName", direction: "asc" });
  };

  const handleServiceSort = (key: ServiceSortKey) => {
    setServiceSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const exportServiceRows = () => {
    if (!serviceListRequest) return;
    const cycle = serviceListRequest.kind === "gates" ? selectedGateCycle : selectedLockCycle;
    const isCompleted = serviceListRequest.mode === "completed";
    const exportRows = visibleServiceRows.map((row) =>
      isCompleted
        ? {
            "Site Name": (row as CompletedServiceRow).siteName,
            Zone: (row as CompletedServiceRow).zone,
            State: (row as CompletedServiceRow).state,
            Cycle: (row as CompletedServiceRow).cycle,
            "Completion Date": formatDate((row as CompletedServiceRow).completionDate),
            "Visit Purpose": (row as CompletedServiceRow).visitPurpose,
            "Visitor Type": (row as CompletedServiceRow).visitorType,
          }
        : {
            "Site Name": (row as PendingServiceRow).siteName,
            Zone: (row as PendingServiceRow).zone,
            State: (row as PendingServiceRow).state,
            "Current Cycle": (row as PendingServiceRow).currentCycle,
            "Last Completed Cycle": (row as PendingServiceRow).lastCompletedCycle,
            "Last Visit Date": formatDate((row as PendingServiceRow).lastVisitDate),
            "Pending Status": (row as PendingServiceRow).pendingStatus,
          },
    );
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${cycle} ${serviceListRequest.mode}`);
    XLSX.writeFile(workbook, `${serviceListRequest.kind}_${cycle}_${serviceListRequest.mode}_sites.xlsx`);
  };

  const activeServiceCycle = serviceListRequest?.kind === "gates" ? selectedGateCycle : selectedLockCycle;
  const activeServiceTitle = serviceListRequest
    ? `${serviceListRequest.kind === "gates" ? "Gates" : "Locks"} ${serviceListRequest.mode === "completed" ? "Completed" : "Pending"} Sites`
    : "";

  const renderSortHeader = (label: string, key: ServiceSortKey, align: "left" | "right" = "left") => (
    <th
      className={`px-4 py-3 font-semibold text-gray-400 cursor-pointer hover:text-cyan-300 transition ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => handleServiceSort(key)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <ArrowUpDown className="h-3.5 w-3.5" />
      </span>
    </th>
  );

  const getGateColorClass = (percent: number): string => {
    if (percent >= 80) return "from-emerald-600/20 to-green-600/20 border-emerald-500/30";
    if (percent >= 60) return "from-cyan-600/20 to-blue-600/20 border-cyan-500/30";
    if (percent >= 40) return "from-yellow-600/20 to-orange-600/20 border-yellow-500/30";
    return "from-red-600/20 to-orange-600/20 border-red-500/30";
  };

  const getLockColorClass = (percent: number): string => {
    if (percent >= 80) return "from-emerald-600/20 to-green-600/20 border-emerald-500/30";
    if (percent >= 60) return "from-purple-600/20 to-pink-600/20 border-purple-500/30";
    if (percent >= 40) return "from-yellow-600/20 to-orange-600/20 border-yellow-500/30";
    return "from-red-600/20 to-orange-600/20 border-red-500/30";
  };

  const getCompletionBadgeColor = (percent: number): string => {
    if (percent >= 80) return "text-emerald-400 bg-emerald-600/30";
    if (percent >= 60) return "text-cyan-400 bg-cyan-600/30";
    if (percent >= 40) return "text-yellow-400 bg-yellow-600/30";
    return "text-orange-400 bg-orange-600/30";
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      {showDebug && (
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
          <CardHeader className="cursor-pointer hover:bg-gray-800/30" onClick={() => setShowDebug(false)}>
            <CardTitle className="flex items-center gap-2 text-gray-200 text-sm">
              <Bug className="h-4 w-4 text-yellow-400" />
              Debug Info (Click to Close)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-800/50 rounded border border-cyan-500/30">
                <p className="font-semibold text-cyan-400 mb-2">{selectedGateCycle} - Gates</p>
                <p className="text-gray-300">Matched Rows: <span className="font-bold text-cyan-300">{gateDebugData.matchedRecords.length}</span></p>
                <p className="text-gray-300">Unique Sites: <span className="font-bold text-cyan-300">{gateDebugData.completed}</span></p>
                <p className="text-gray-300">Target: {TOTAL_GATES}</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded border border-purple-500/30">
                <p className="font-semibold text-purple-400 mb-2">{selectedLockCycle} - Locks</p>
                <p className="text-gray-300">Matched Rows: <span className="font-bold text-purple-300">{lockDebugData.matchedRecords.length}</span></p>
                <p className="text-gray-300">Unique Sites: <span className="font-bold text-purple-300">{lockDebugData.completed}</span></p>
                <p className="text-gray-300">Target: {TOTAL_LOCKS}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs px-3 py-1 rounded bg-gray-800/50 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/30 transition"
      >
        {showDebug ? "Hide Debug Info" : "Show Debug Info"}
      </button>

      {/* Service Cycle Tracker Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" />
          <h3 className="text-sm font-semibold text-cyan-300 tracking-wide">SERVICE CYCLE TRACKER</h3>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gates Card */}
        <Card className={`border-0 backdrop-blur-xl shadow-2xl border transition-all duration-300 hover:shadow-2xl hover:border-opacity-50 bg-gradient-to-br ${getGateColorClass(gateDebugData.completionPercent)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-200">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                Gates Service Tracker
              </CardTitle>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompletionBadgeColor(gateDebugData.completionPercent)}`}>
                {gateDebugData.completionPercent.toFixed(1)}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cycle Selector */}
            <div className="relative">
              <label className="text-xs text-gray-400 mb-2 block">Select Cycle</label>
              <div className="relative">
                <select
                  value={selectedGateCycle}
                  onChange={(e) => setSelectedGateCycle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold appearance-none cursor-pointer hover:border-cyan-500/60 transition focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                >
                  {GATE_CYCLES.map((cycle) => (
                    <option key={cycle.label} value={cycle.label}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-cyan-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Selected Cycle</p>
                <p className="text-2xl font-bold text-cyan-400">{selectedGateCycle}</p>
                <p className="text-xs text-gray-500 mt-0.5">{gateSelectedData?.months || ""}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Target Assets</p>
                <p className="text-2xl font-bold text-white">{TOTAL_GATES}</p>
                <p className="text-xs text-gray-500 mt-0.5">Gates</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300 font-medium">Progress</span>
                <span className="font-semibold text-cyan-400">{gateDebugData.completed} / {TOTAL_GATES}</span>
              </div>
              <Progress value={gateDebugData.completionPercent} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => openServiceList("gates", "completed")}
                className="group p-3 bg-cyan-600/20 rounded-lg border border-cyan-500/30 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              >
                <p className="text-xs text-gray-400 mb-1">Completed</p>
                <p className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">{gateDebugData.completed}</p>
              </button>
              <button
                type="button"
                onClick={() => openServiceList("gates", "pending")}
                className="group p-3 bg-orange-600/20 rounded-lg border border-orange-500/30 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500/25 hover:shadow-lg hover:shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <p className="text-xs text-gray-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-400 group-hover:text-orange-300">{gateDebugData.pending}</p>
              </button>
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-white">{Math.round((gateDebugData.pending / TOTAL_GATES) * 100)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-800/20 rounded-lg">
              {gateDebugData.completionPercent >= 80 ? (
                <><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs text-emerald-400">On Track</span></>
              ) : gateDebugData.completionPercent >= 60 ? (
                <><div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" /><span className="text-xs text-cyan-400">Good Progress</span></>
              ) : (
                <><AlertCircle className="h-3 w-3 text-orange-400" /><span className="text-xs text-orange-400">Needs Attention</span></>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Locks Card */}
        <Card className={`border-0 backdrop-blur-xl shadow-2xl border transition-all duration-300 hover:shadow-2xl hover:border-opacity-50 bg-gradient-to-br ${getLockColorClass(lockDebugData.completionPercent)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-200">
                <Lock className="h-5 w-5 text-purple-400" />
                Locks Service Tracker
              </CardTitle>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompletionBadgeColor(lockDebugData.completionPercent)}`}>
                {lockDebugData.completionPercent.toFixed(1)}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cycle Selector */}
            <div className="relative">
              <label className="text-xs text-gray-400 mb-2 block">Select Cycle</label>
              <div className="relative">
                <select
                  value={selectedLockCycle}
                  onChange={(e) => setSelectedLockCycle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-300 font-semibold appearance-none cursor-pointer hover:border-purple-500/60 transition focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                >
                  {HALF_YEAR_CYCLES.map((cycle) => (
                    <option key={cycle.label} value={cycle.label}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-purple-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Selected Cycle</p>
                <p className="text-2xl font-bold text-purple-400">{selectedLockCycle}</p>
                <p className="text-xs text-gray-500 mt-0.5">{lockSelectedData?.months || ""}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Target Assets</p>
                <p className="text-2xl font-bold text-white">{TOTAL_LOCKS}</p>
                <p className="text-xs text-gray-500 mt-0.5">Locks</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300 font-medium">Progress</span>
                <span className="font-semibold text-purple-400">{lockDebugData.completed} / {TOTAL_LOCKS}</span>
              </div>
              <Progress value={lockDebugData.completionPercent} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => openServiceList("locks", "completed")}
                className="group p-3 bg-purple-600/20 rounded-lg border border-purple-500/30 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-500/25 hover:shadow-lg hover:shadow-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
              >
                <p className="text-xs text-gray-400 mb-1">Completed</p>
                <p className="text-2xl font-bold text-purple-400 group-hover:text-purple-300">{lockDebugData.completed}</p>
              </button>
              <button
                type="button"
                onClick={() => openServiceList("locks", "pending")}
                className="group p-3 bg-orange-600/20 rounded-lg border border-orange-500/30 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500/25 hover:shadow-lg hover:shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <p className="text-xs text-gray-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-400 group-hover:text-orange-300">{lockDebugData.pending}</p>
              </button>
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-white">{Math.round((lockDebugData.pending / TOTAL_LOCKS) * 100)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-800/20 rounded-lg">
              {lockDebugData.completionPercent >= 80 ? (
                <React.Fragment><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs text-emerald-400">On Track</span></React.Fragment>
              ) : lockDebugData.completionPercent >= 60 ? (
                <React.Fragment><div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" /><span className="text-xs text-purple-400">Good Progress</span></React.Fragment>
              ) : (
                <React.Fragment><AlertCircle className="h-3 w-3 text-orange-400" /><span className="text-xs text-orange-400">Needs Attention</span></React.Fragment>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!serviceListRequest} onOpenChange={(open) => !open && setServiceListRequest(null)}>
        <DialogContent className="max-h-[88vh] max-w-[1180px] overflow-hidden border border-cyan-500/20 bg-gray-950/95 p-0 text-gray-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader className="border-b border-gray-800/80 bg-gradient-to-r from-gray-900 via-slate-900 to-gray-950 px-6 py-5">
            <DialogTitle className="flex flex-wrap items-center gap-3 text-xl text-gray-100">
              {activeServiceTitle}
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {activeServiceCycle}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              {visibleServiceRows.length} of {serviceRows.length} sites shown for the selected cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                placeholder="Search sites, zones, states, status..."
                className="w-full rounded-lg border border-gray-700/70 bg-gray-900/80 py-2 pl-9 pr-3 text-sm text-gray-100 outline-none transition focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <button
              type="button"
              onClick={exportServiceRows}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>

          <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-gray-800/80">
            <div className="max-h-[52vh] overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur">
                  <tr className="border-b border-gray-700/70">
                    {renderSortHeader("Site Name", "siteName")}
                    {renderSortHeader("Zone", "zone")}
                    {renderSortHeader("State", "state")}
                    {serviceListRequest?.mode === "completed" ? (
                      <>
                        {renderSortHeader("Cycle", "cycle")}
                        {renderSortHeader("Completion Date", "completionDate")}
                        {renderSortHeader("Visit Purpose", "visitPurpose")}
                        {renderSortHeader("Visitor Type", "visitorType")}
                      </>
                    ) : (
                      <>
                        {renderSortHeader("Current Cycle", "currentCycle")}
                        {renderSortHeader("Last Completed Cycle", "lastCompletedCycle")}
                        {renderSortHeader("Last Visit Date", "lastVisitDate")}
                        {renderSortHeader("Pending Status", "pendingStatus")}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleServiceRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        No sites found for this cycle and search.
                      </td>
                    </tr>
                  ) : serviceListRequest?.mode === "completed" ? (
                    (visibleServiceRows as CompletedServiceRow[]).map((row) => (
                      <tr key={`${row.siteName}-${row.cycle}`} className="border-b border-gray-800/70 bg-gray-950/30 transition hover:bg-cyan-500/5">
                        <td className="px-4 py-3 font-medium text-gray-100">{row.siteName}</td>
                        <td className="px-4 py-3 text-gray-300">{row.zone}</td>
                        <td className="px-4 py-3 text-gray-300">{row.state}</td>
                        <td className="px-4 py-3 text-cyan-300">{row.cycle}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(row.completionDate)}</td>
                        <td className="px-4 py-3 text-gray-300">{row.visitPurpose}</td>
                        <td className="px-4 py-3 text-gray-300">{row.visitorType}</td>
                      </tr>
                    ))
                  ) : (
                    (visibleServiceRows as PendingServiceRow[]).map((row) => (
                      <tr key={`${row.siteName}-${row.currentCycle}`} className="border-b border-gray-800/70 bg-gray-950/30 transition hover:bg-orange-500/5">
                        <td className="px-4 py-3 font-medium text-gray-100">{row.siteName}</td>
                        <td className="px-4 py-3 text-gray-300">{row.zone}</td>
                        <td className="px-4 py-3 text-gray-300">{row.state}</td>
                        <td className="px-4 py-3 text-orange-300">{row.currentCycle}</td>
                        <td className="px-4 py-3 text-gray-300">{row.lastCompletedCycle}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(row.lastVisitDate)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300">
                            {row.pendingStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
