import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend
} from "recharts";
import {
  Filter, Search, TrendingUp, Building2, MapPin,
  Calendar, ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle2,
  AlertCircle, FileSpreadsheet, Medal, Activity, Users, Download, Zap
} from "lucide-react";
import { splitVisitPurposes } from "../utils/cycleCalculations";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface ExpenseAnalyticsProps {
  visits: VisitRecord[];
}

interface ExpenseFilters {
  zone: string;
  state: string;
  site: string;
  purpose: string;
  visitorType: string;
  fromDate: string;
  toDate: string;
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#f97316"
];

export function ExpenseAnalytics({ visits }: ExpenseAnalyticsProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    zone: "all",
    state: "all",
    site: "all",
    purpose: "all",
    visitorType: "all",
    fromDate: "",
    toDate: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dateOfVisit",
    direction: "desc"
  });

  const [selectedSiteForModal, setSelectedSiteForModal] = useState<string | null>(null);
  const [selectedZoneForModal, setSelectedZoneForModal] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // --- Dynamic Dropdown Options ---
  const availableZones = useMemo(() => Array.from(new Set(visits.map(v => v.zone).filter(Boolean))).sort(), [visits]);
  
  const availableStates = useMemo(() => {
    let f = visits;
    if (filters.zone !== "all") f = f.filter(v => v.zone === filters.zone);
    return Array.from(new Set(f.map(v => v.state).filter(Boolean))).sort();
  }, [visits, filters.zone]);

  const availableSites = useMemo(() => {
    let f = visits;
    if (filters.zone !== "all") f = f.filter(v => v.zone === filters.zone);
    if (filters.state !== "all") f = f.filter(v => v.state === filters.state);
    return Array.from(new Set(f.map(v => v.siteName).filter(Boolean))).sort();
  }, [visits, filters.zone, filters.state]);

  const availablePurposes = useMemo(() => {
    const purposes = new Set<string>();
    visits.forEach(v => {
      splitVisitPurposes(v.visitType).forEach(p => purposes.add(p));
    });
    return Array.from(purposes).sort();
  }, [visits]);

  const availableVisitorTypes = useMemo(() => Array.from(new Set(visits.map(v => v.visitorType).filter(Boolean))).sort(), [visits]);

  // --- Filter Logic ---
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (filters.zone !== "all" && v.zone !== filters.zone) return false;
      if (filters.state !== "all" && v.state !== filters.state) return false;
      if (filters.site !== "all" && v.siteName !== filters.site) return false;
      if (filters.visitorType !== "all" && v.visitorType !== filters.visitorType) return false;
      if (filters.purpose !== "all") {
        if (!splitVisitPurposes(v.visitType).includes(filters.purpose)) return false;
      }
      if (filters.fromDate && isBefore(v.dateOfVisit, startOfDay(new Date(filters.fromDate)))) return false;
      if (filters.toDate && isAfter(v.dateOfVisit, endOfDay(new Date(filters.toDate)))) return false;
      return true;
    });
  }, [visits, filters]);

  // --- Analytics Processing ---
  const analytics = useMemo(() => {
    let totalExpense = 0;
    const siteMap = new Map<string, { expense: number; visits: number; zone: string; state: string }>();
    const zoneMap = new Map<string, { expense: number; visits: number }>();
    const purposeMap = new Map<string, number>();
    const monthMap = new Map<string, number>();

    filteredVisits.forEach(v => {
      const charge = v.visitorCharges || 0;
      totalExpense += charge;

      // Site
      const s = siteMap.get(v.siteName) || { expense: 0, visits: 0, zone: v.zone, state: v.state };
      s.expense += charge;
      s.visits += 1;
      siteMap.set(v.siteName, s);

      // Zone
      const z = zoneMap.get(v.zone) || { expense: 0, visits: 0 };
      z.expense += charge;
      z.visits += 1;
      zoneMap.set(v.zone, z);

      // Month
      const m = format(v.dateOfVisit, "MMM yyyy");
      monthMap.set(m, (monthMap.get(m) || 0) + charge);

      // Purpose (allocated)
      const purposes = splitVisitPurposes(v.visitType);
      const splitCharge = charge / (purposes.length || 1);
      purposes.forEach(p => {
        purposeMap.set(p, (purposeMap.get(p) || 0) + splitCharge);
      });
    });

    const sortedSites = Array.from(siteMap.entries())
      .map(([name, data]) => ({ name, expense: data.expense, visits: data.visits, avg: data.visits > 0 ? data.expense / data.visits : 0, zone: data.zone, state: data.state }))
      .sort((a, b) => b.expense - a.expense);

    const sortedZones = Array.from(zoneMap.entries())
      .map(([name, data]) => ({ name, expense: data.expense, visits: data.visits, efficiency: data.expense > 0 ? data.visits / data.expense : data.visits, avg: data.visits > 0 ? data.expense / data.visits : 0 }))
      .sort((a, b) => b.expense - a.expense);

    const sortedPurposes = Array.from(purposeMap.entries())
      .map(([name, expense]) => ({ name, expense }))
      .sort((a, b) => b.expense - a.expense);

    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, expense]) => ({ month, sortDate: new Date(month).getTime(), expense }))
      .sort((a, b) => a.sortDate - b.sortDate);

    const totalVisits = filteredVisits.length;
    const avgCostPerVisit = totalVisits > 0 ? totalExpense / totalVisits : 0;
    const totalSitesCovered = siteMap.size;

    // Executive Insights
    const highestExpenseZone = sortedZones[0] || null;
    const highestExpenseSite = sortedSites[0] || null;
    const mostActiveZone = [...sortedZones].sort((a, b) => b.visits - a.visits)[0] || null;
    const mostExpensivePurpose = sortedPurposes[0] || null;
    const highestAvgCostSite = [...sortedSites].sort((a, b) => b.avg - a.avg)[0] || null;
    const lowestAvgCostSite = [...sortedSites].filter(s => s.avg > 0).sort((a, b) => a.avg - b.avg)[0] || null;
    const mostVisitedSite = [...sortedSites].sort((a, b) => b.visits - a.visits)[0] || null;

    // Financial Efficiency Data (Higher score = better)
    const efficiencyRanking = [...sortedZones].filter(z => z.expense > 0 || z.visits > 0).sort((a, b) => b.efficiency - a.efficiency);
    const topEfficientZones = efficiencyRanking.slice(0, 3);
    const bottomEfficientZones = efficiencyRanking.slice(-3).reverse();

    const zoneCostRanking = [...sortedZones]
      .filter(z => z.visits > 0)
      .sort((a, b) => b.avg - a.avg)
      .map((zone, index, zones) => {
        const highCostLimit = Math.ceil(zones.length / 3);
        const moderateCostLimit = Math.ceil((zones.length * 2) / 3);
        const status = index < highCostLimit ? "High Cost" : index < moderateCostLimit ? "Moderate" : "Efficient";
        const statusColor = status === "High Cost" ? "#ef4444" : status === "Moderate" ? "#f59e0b" : "#10b981";
        return { ...zone, rank: index + 1, status, statusColor };
      });

    const mostEfficientZone = [...zoneCostRanking].reverse().find(z => z.avg > 0) || zoneCostRanking[zoneCostRanking.length - 1] || null;
    const highestCostPerVisitZone = zoneCostRanking[0] || null;

    // Generate Insights
    const insights: string[] = [];
    if (totalVisits > 0) {
      if (highestExpenseZone) insights.push(`${highestExpenseZone.name} contributes ${((highestExpenseZone.expense / totalExpense) * 100).toFixed(1)}% of total expenses.`);
      if (highestExpenseSite) insights.push(`${highestExpenseSite.name} is the highest expense site (₹${highestExpenseSite.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`);
      if (mostExpensivePurpose) insights.push(`"${mostExpensivePurpose.name}" purpose drives the most spending (₹${mostExpensivePurpose.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`);
      if (mostEfficientZone) insights.push(`${mostEfficientZone.name} is the most efficient zone at ₹${mostEfficientZone.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}/visit.`);
      if (highestAvgCostSite) insights.push(`${highestAvgCostSite.name} has the highest average visit cost at ₹${highestAvgCostSite.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}/visit.`);
      if (mostVisitedSite) insights.push(`${mostVisitedSite.name} is the most frequently visited site (${mostVisitedSite.visits} visits).`);
    } else {
      insights.push("No data available for the selected filters.");
    }

    return {
      totalExpense,
      totalVisits,
      avgCostPerVisit,
      totalSitesCovered,
      highestExpenseZone,
      highestExpenseSite,
      mostActiveZone,
      mostEfficientZone,
      highestCostPerVisitZone,
      mostExpensivePurpose,
      highestAvgCostSite,
      lowestAvgCostSite,
      mostVisitedSite,
      sortedSites,
      sortedZones,
      zoneCostRanking,
      sortedPurposes,
      monthlyTrend,
      topEfficientZones,
      bottomEfficientZones,
      insights
    };
  }, [filteredVisits]);

  // --- Modal Processing: Site Drill-Down ---
  const siteDrillData = useMemo(() => {
    if (!selectedSiteForModal) return null;
    const siteVisits = filteredVisits.filter(v => v.siteName === selectedSiteForModal);
    if (siteVisits.length === 0) return null;

    const totalExpense = siteVisits.reduce((sum, v) => sum + (v.visitorCharges || 0), 0);
    const totalVisits = siteVisits.length;
    const avgCost = totalVisits > 0 ? totalExpense / totalVisits : 0;
    const zone = siteVisits[0].zone;
    const state = siteVisits[0].state;

    const purposeMap = new Map<string, { visits: number; expense: number }>();
    const monthMap = new Map<string, number>();

    siteVisits.forEach(v => {
      const charge = v.visitorCharges || 0;
      const m = format(v.dateOfVisit, "MMM yyyy");
      monthMap.set(m, (monthMap.get(m) || 0) + charge);

      const purposes = splitVisitPurposes(v.visitType);
      const splitCharge = charge / (purposes.length || 1);
      purposes.forEach(p => {
        const pd = purposeMap.get(p) || { visits: 0, expense: 0 };
        pd.visits += 1;
        pd.expense += splitCharge;
        purposeMap.set(p, pd);
      });
    });

    const purposeStats = Array.from(purposeMap.entries())
      .map(([name, data]) => ({ name, visits: data.visits, expense: data.expense, pct: totalExpense > 0 ? (data.expense / totalExpense) * 100 : 0 }))
      .sort((a, b) => b.expense - a.expense);

    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, expense]) => ({ month, sortDate: new Date(month).getTime(), expense }))
      .sort((a, b) => a.sortDate - b.sortDate);

    const recentVisits = [...siteVisits].sort((a, b) => b.dateOfVisit.getTime() - a.dateOfVisit.getTime()).slice(0, 10);

    return {
      siteName: selectedSiteForModal, zone, state, totalVisits, totalExpense, avgCost, purposeStats, monthlyTrend, recentVisits
    };
  }, [selectedSiteForModal, filteredVisits]);

  // --- Modal Processing: Zone Drill-Down ---
  const zoneDrillData = useMemo(() => {
    if (!selectedZoneForModal) return null;
    const zoneVisits = filteredVisits.filter(v => v.zone === selectedZoneForModal);
    if (zoneVisits.length === 0) return null;

    const totalExpense = zoneVisits.reduce((sum, v) => sum + (v.visitorCharges || 0), 0);
    const totalVisits = zoneVisits.length;
    const avgCost = totalVisits > 0 ? totalExpense / totalVisits : 0;
    
    const siteMap = new Map<string, { visits: number; expense: number }>();
    const purposeMap = new Map<string, number>();
    const monthMap = new Map<string, number>();

    zoneVisits.forEach(v => {
      const charge = v.visitorCharges || 0;
      
      const s = siteMap.get(v.siteName) || { visits: 0, expense: 0 };
      s.visits += 1;
      s.expense += charge;
      siteMap.set(v.siteName, s);

      const m = format(v.dateOfVisit, "MMM yyyy");
      monthMap.set(m, (monthMap.get(m) || 0) + charge);

      const purposes = splitVisitPurposes(v.visitType);
      const splitCharge = charge / (purposes.length || 1);
      purposes.forEach(p => {
        purposeMap.set(p, (purposeMap.get(p) || 0) + splitCharge);
      });
    });

    const siteStats = Array.from(siteMap.entries())
      .map(([name, data]) => ({ name, visits: data.visits, expense: data.expense, avg: data.visits > 0 ? data.expense / data.visits : 0, pct: totalExpense > 0 ? (data.expense / totalExpense) * 100 : 0 }))
      .sort((a, b) => b.expense - a.expense);

    const purposeStats = Array.from(purposeMap.entries())
      .map(([name, expense]) => ({ name, expense }))
      .sort((a, b) => b.expense - a.expense);

    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, expense]) => ({ month, sortDate: new Date(month).getTime(), expense }))
      .sort((a, b) => a.sortDate - b.sortDate);

    return {
      zone: selectedZoneForModal, totalVisits, totalExpense, avgCost, totalSites: siteMap.size, siteStats, purposeStats, monthlyTrend
    };
  }, [selectedZoneForModal, filteredVisits]);

  // --- Table Sorting & Pagination ---
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  const tableData = useMemo(() => {
    let data = [...filteredVisits];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(v => 
        (v.zone || "").toLowerCase().includes(lower) ||
        (v.state || "").toLowerCase().includes(lower) ||
        (v.siteName || "").toLowerCase().includes(lower) ||
        (v.visitType || "").toLowerCase().includes(lower) ||
        (v.visitorType || "").toLowerCase().includes(lower)
      );
    }
    
    data.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof VisitRecord];
      let valB: any = b[sortConfig.key as keyof VisitRecord];

      if (sortConfig.key === 'dateOfVisit') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredVisits, searchTerm, sortConfig]);

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const customTooltipFormatter = (value: number) => `₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsDetails = XLSX.utils.json_to_sheet(tableData.map(v => ({
      Date: format(v.dateOfVisit, 'yyyy-MM-dd'),
      Zone: v.zone,
      State: v.state,
      SiteName: v.siteName,
      VisitPurpose: v.visitType,
      VisitorType: v.visitorType,
      Charges: v.visitorCharges
    })));
    XLSX.utils.book_append_sheet(wb, wsDetails, "Expense Audit");
    XLSX.writeFile(wb, `Expense_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const exportToCSV = () => {
    const wsDetails = XLSX.utils.json_to_sheet(tableData.map(v => ({
      Date: format(v.dateOfVisit, 'yyyy-MM-dd'),
      Zone: v.zone,
      State: v.state,
      SiteName: v.siteName,
      VisitPurpose: v.visitType,
      VisitorType: v.visitorType,
      Charges: v.visitorCharges
    })));
    const csv = XLSX.utils.sheet_to_csv(wsDetails);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Expense_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCostBadge = (charge: number) => {
    if (!charge || charge === 0) return <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">Neutral</span>;
    if (charge <= 1000) return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Low Cost</span>;
    if (charge <= 2000) return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium Cost</span>;
    return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">High Cost</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: ADVANCED EXPENSE INTELLIGENCE FILTERS */}
      <Card className="border-0 bg-gray-900/60 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-200">Advanced Expense Intelligence</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Zone</label>
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters({ ...filters, zone: e.target.value, state: "all", site: "all" })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Zones</option>
                  {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value, site: "all" })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All States</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Site</label>
                <select
                  value={filters.site}
                  onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Sites</option>
                  {availableSites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Visit Purpose</label>
                <select
                  value={filters.purpose}
                  onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Purposes</option>
                  {availablePurposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Visitor Type</label>
                <select
                  value={filters.visitorType}
                  onChange={(e) => setFilters({ ...filters, visitorType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Visitor Types</option>
                  {availableVisitorTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                </select>
              </div>

              <div className="space-y-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 font-medium">From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full px-2 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium">To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full px-2 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredVisits.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800/50">
          <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">No data found</h3>
          <p className="text-sm text-gray-500 mt-2">Adjust your filters to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* SECTION 3: EXECUTIVE INSIGHTS (Dynamic KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="border-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-xl border-indigo-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-indigo-300/80 mb-1 font-semibold uppercase truncate">Highest Exp Zone</p>
                <p className="text-sm lg:text-base font-bold text-indigo-300 truncate" title={analytics.highestExpenseZone?.name}>{analytics.highestExpenseZone?.name || "N/A"}</p>
                <p className="text-xs text-indigo-400 mt-0.5">₹{analytics.highestExpenseZone?.expense.toLocaleString(undefined, {maximumFractionDigits:0}) || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-rose-600/20 to-red-600/20 backdrop-blur-xl border-rose-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-rose-300/80 mb-1 font-semibold uppercase truncate">Highest Exp Site</p>
                <p className="text-sm lg:text-base font-bold text-rose-300 truncate" title={analytics.highestExpenseSite?.name}>{analytics.highestExpenseSite?.name || "N/A"}</p>
                <p className="text-xs text-rose-400 mt-0.5">₹{analytics.highestExpenseSite?.expense.toLocaleString(undefined, {maximumFractionDigits:0}) || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-emerald-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-emerald-300/80 mb-1 font-semibold uppercase truncate">Most Active Zone</p>
                <p className="text-sm lg:text-base font-bold text-emerald-300 truncate" title={analytics.mostActiveZone?.name}>{analytics.mostActiveZone?.name || "N/A"}</p>
                <p className="text-xs text-emerald-400 mt-0.5">{analytics.mostActiveZone?.visits.toLocaleString() || 0} Visits</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border-amber-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-amber-300/80 mb-1 font-semibold uppercase truncate">Most Exp Purpose</p>
                <p className="text-sm lg:text-base font-bold text-amber-300 truncate" title={analytics.mostExpensivePurpose?.name}>{analytics.mostExpensivePurpose?.name || "N/A"}</p>
                <p className="text-xs text-amber-400 mt-0.5">₹{analytics.mostExpensivePurpose?.expense.toLocaleString(undefined, {maximumFractionDigits:0}) || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-purple-300/80 mb-1 font-semibold uppercase truncate">Highest Avg Cost Site</p>
                <p className="text-sm lg:text-base font-bold text-purple-300 truncate" title={analytics.highestAvgCostSite?.name}>{analytics.highestAvgCostSite?.name || "N/A"}</p>
                <p className="text-xs text-purple-400 mt-0.5">₹{analytics.highestAvgCostSite?.avg.toLocaleString(undefined, {maximumFractionDigits:0}) || 0} / visit</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-cyan-600/20 to-sky-600/20 backdrop-blur-xl border-cyan-500/30">
              <CardContent className="pt-6">
                <p className="text-xs text-cyan-300/80 mb-1 font-semibold uppercase truncate">Most Visited Site</p>
                <p className="text-sm lg:text-base font-bold text-cyan-300 truncate" title={analytics.mostVisitedSite?.name}>{analytics.mostVisitedSite?.name || "N/A"}</p>
                <p className="text-xs text-cyan-400 mt-0.5">{analytics.mostVisitedSite?.visits.toLocaleString() || 0} Visits</p>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 7: SMART INSIGHT ENGINE */}
          <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-200 flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-amber-400" />
                Smart Insight Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: ZONE EFFICIENCY ANALYSIS */}
          <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                Zone Efficiency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-xs text-emerald-300/80 mb-2 font-semibold uppercase">🏆 Most Efficient Zone</p>
                  <p className="text-lg font-bold text-emerald-200 truncate" title={analytics.mostEfficientZone?.name}>{analytics.mostEfficientZone?.name || "N/A"}</p>
                  <p className="text-xs text-emerald-300 mt-1">₹{analytics.mostEfficientZone?.avg.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}/visit</p>
                </div>
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                  <p className="text-xs text-indigo-300/80 mb-2 font-semibold uppercase">💰 Highest Expense Zone</p>
                  <p className="text-lg font-bold text-indigo-200 truncate" title={analytics.highestExpenseZone?.name}>{analytics.highestExpenseZone?.name || "N/A"}</p>
                  <p className="text-xs text-indigo-300 mt-1">₹{analytics.highestExpenseZone?.expense.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}</p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-xs text-blue-300/80 mb-2 font-semibold uppercase">📈 Most Active Zone</p>
                  <p className="text-lg font-bold text-blue-200 truncate" title={analytics.mostActiveZone?.name}>{analytics.mostActiveZone?.name || "N/A"}</p>
                  <p className="text-xs text-blue-300 mt-1">{analytics.mostActiveZone?.visits.toLocaleString() || 0} visits</p>
                </div>
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
                  <p className="text-xs text-rose-300/80 mb-2 font-semibold uppercase">⚠️ Highest Cost Per Visit Zone</p>
                  <p className="text-lg font-bold text-rose-200 truncate" title={analytics.highestCostPerVisitZone?.name}>{analytics.highestCostPerVisitZone?.name || "N/A"}</p>
                  <p className="text-xs text-rose-300 mt-1">₹{analytics.highestCostPerVisitZone?.avg.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}/visit</p>
                </div>
              </div>

              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={analytics.zoneCostRanking}
                    margin={{ top: 8, right: 36, bottom: 8, left: 88 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${Number(v).toLocaleString()}`} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={84} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#e5e7eb" }}
                      formatter={(value: any, name: string) => {
                        if (name === "Average Cost Per Visit" || name === "Total Expense") return [`₹${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name];
                        return [value.toLocaleString(), name];
                      }}
                      labelFormatter={(label) => `Zone: ${label}`}
                    />
                    <Bar dataKey="avg" name="Average Cost Per Visit" radius={[0, 4, 4, 0]} onClick={(data) => setSelectedZoneForModal(data.name)} className="cursor-pointer">
                      {analytics.zoneCostRanking.map((entry, index) => (
                        <Cell key={`zone-efficiency-${index}`} fill={entry.statusColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Efficient</div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moderate</div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High Cost</div>
              </div>

              <div className="overflow-x-auto border border-gray-800/50 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/40">
                    <tr className="border-b border-gray-700/50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-400">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-400">Zone</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-400">Visits</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-400">Expense</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-400">Avg Cost Per Visit</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-400">Efficiency Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.zoneCostRanking.map((zone) => (
                      <tr key={zone.name} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setSelectedZoneForModal(zone.name)}>
                        <td className="px-4 py-3 text-gray-300 font-medium">#{zone.rank}</td>
                        <td className="px-4 py-3 text-gray-200 font-medium">{zone.name}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{zone.visits.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-300">₹{zone.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-100">₹{zone.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-700/60 bg-gray-800/50 px-2.5 py-1 text-xs font-medium text-gray-200">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: zone.statusColor }} />
                            {zone.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: FINANCIAL EFFICIENCY SCORE */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  <Medal className="h-5 w-5 text-emerald-400" />
                  Top Efficient Zones (Visits / Expense)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-400">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-400">Zone</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-400">Efficiency Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topEfficientZones.map((zone, idx) => (
                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setSelectedZoneForModal(zone.name)}>
                          <td className="px-4 py-3 text-gray-300 font-medium text-lg">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                          </td>
                          <td className="px-4 py-3 text-gray-200 font-medium">{zone.name}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{(zone.efficiency * 1000).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                  Bottom Efficient Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-400">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-400">Zone</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-400">Efficiency Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bottomEfficientZones.map((zone, idx) => (
                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setSelectedZoneForModal(zone.name)}>
                          <td className="px-4 py-3 text-gray-500 font-medium">#{analytics.sortedZones.length - idx}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium">{zone.name}</td>
                          <td className="px-4 py-3 text-right text-rose-400 font-semibold">{(zone.efficiency * 1000).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Expense Comparison */}
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base">Monthly Expense Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `₹${val.toLocaleString()}`} width={80} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                        formatter={customTooltipFormatter}
                        cursor={{ fill: "#374151", opacity: 0.4 }}
                      />
                      <Bar dataKey="expense" name="Monthly Expense" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Zone Contribution Analysis */}
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base">Zone Contribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.sortedZones.slice(0, 10)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="expense"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        onClick={(data) => setSelectedZoneForModal(data.name)}
                        className="cursor-pointer"
                      >
                        {analytics.sortedZones.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                        formatter={customTooltipFormatter}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">Click on a zone segment to view detailed analysis</p>
              </CardContent>
            </Card>
          </div>

          {/* 3. Site Wise Expense Breakdown (Horizontal Bar) */}
          <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-200 text-base">Site Wise Expense Breakdown (Top 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={analytics.sortedSites.slice(0, 20)} margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={120} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      formatter={customTooltipFormatter}
                      cursor={{ fill: "#374151", opacity: 0.4 }}
                    />
                    <Bar dataKey="expense" name="Total Expense" radius={[0, 4, 4, 0]} onClick={(data) => setSelectedSiteForModal(data.name)} className="cursor-pointer">
                      {analytics.sortedSites.slice(0, 20).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">Click on a bar to open Interactive Site Drill-Down</p>
            </CardContent>
          </Card>

          {/* SECTION 8: DETAILED EXPENSE AUDIT ENHANCEMENT */}
          <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                Detailed Expense Audit
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search table..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 w-full sm:w-64"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-sm transition-all"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4" /> CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg text-sm transition-all"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("zone")}>
                        Zone <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("state")}>
                        State <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("siteName")}>
                        Site <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("dateOfVisit")}>
                        Date <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("visitType")}>
                        Visit Purpose <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-400" onClick={() => handleSort("visitorType")}>
                        Visitor Type <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                      <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-indigo-400" onClick={() => handleSort("visitorCharges")}>
                        Visitor Charges <ArrowUpDown className="inline h-3 w-3 ml-1" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No matching records found.</td>
                      </tr>
                    ) : (
                      paginatedData.map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-gray-800/30 transition">
                          <td className="px-4 py-3 text-gray-400 cursor-pointer hover:text-indigo-400" onClick={() => setSelectedZoneForModal(v.zone)}>{v.zone}</td>
                          <td className="px-4 py-3 text-gray-400">{v.state}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium cursor-pointer hover:text-indigo-400" onClick={() => setSelectedSiteForModal(v.siteName)}>{v.siteName}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{format(v.dateOfVisit, "dd MMM yyyy")}</td>
                          <td className="px-4 py-3 text-cyan-400/90">{v.visitType}</td>
                          <td className="px-4 py-3 text-gray-400">{v.visitorType}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {getCostBadge(v.visitorCharges || 0)}
                              <span className="font-semibold text-gray-200">₹{(v.visitorCharges || 0).toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)} of {tableData.length} records
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-300 font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* SECTION 2: INTERACTIVE SITE EXPENSE BREAKDOWN MODAL */}
      <Dialog open={!!selectedSiteForModal} onOpenChange={(open) => !open && setSelectedSiteForModal(null)}>
        <DialogContent className="max-w-4xl bg-gray-950 border-gray-800 text-gray-100 max-h-[90vh] overflow-y-auto">
          {siteDrillData && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-emerald-400">{siteDrillData.siteName} (Site Summary)</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {siteDrillData.zone} • {siteDrillData.state}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-200 mt-1">{siteDrillData.totalVisits}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Expense</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">₹{siteDrillData.totalExpense.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Cost/Visit</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">₹{siteDrillData.avgCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Expense by Visit Purpose</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={siteDrillData.purposeStats} margin={{ left: 50, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis type="number" stroke="#9ca3af" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} formatter={customTooltipFormatter} />
                        <Bar dataKey="expense" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {siteDrillData.purposeStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Expense Timeline</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={siteDrillData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(val) => `₹${val}`} width={50} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} formatter={customTooltipFormatter} />
                        <Line type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Visit History (Top 10)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Date</th>
                        <th className="px-4 py-2 font-medium">Purpose</th>
                        <th className="px-4 py-2 font-medium">Visitor Type</th>
                        <th className="px-4 py-2 font-medium text-right">Charges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {siteDrillData.recentVisits.map((v, i) => (
                        <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50">
                          <td className="px-4 py-2 text-gray-300">{format(v.dateOfVisit, "dd MMM yyyy")}</td>
                          <td className="px-4 py-2 text-cyan-400">{v.visitType}</td>
                          <td className="px-4 py-2 text-gray-400">{v.visitorType}</td>
                          <td className="px-4 py-2 text-right font-semibold text-orange-400">₹{(v.visitorCharges || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SECTION 6: ZONE DRILL-DOWN ANALYSIS MODAL */}
      <Dialog open={!!selectedZoneForModal} onOpenChange={(open) => !open && setSelectedZoneForModal(null)}>
        <DialogContent className="max-w-5xl bg-gray-950 border-gray-800 text-gray-100 max-h-[90vh] overflow-y-auto">
          {zoneDrillData && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-blue-400">{zoneDrillData.zone} (Zone Analysis)</DialogTitle>
                <DialogDescription className="text-gray-400">Comprehensive overview of regional operations.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Expense</p>
                  <p className="text-xl font-bold text-indigo-400 mt-1">₹{zoneDrillData.totalExpense.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total Visits</p>
                  <p className="text-xl font-bold text-gray-200 mt-1">{zoneDrillData.totalVisits}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Cost/Visit</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">₹{zoneDrillData.avgCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Sites Covered</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{zoneDrillData.totalSites}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Sites in Zone</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={zoneDrillData.siteStats.slice(0, 5)} margin={{ left: 50, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis type="number" stroke="#9ca3af" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                        <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} formatter={customTooltipFormatter} />
                        <Bar dataKey="expense" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Purpose Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={zoneDrillData.purposeStats.slice(0, 6)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="expense">
                          {zoneDrillData.purposeStats.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} formatter={customTooltipFormatter} />
                        <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Site Ranking (Top 15)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Site</th>
                        <th className="px-4 py-2 font-medium text-right">Visits</th>
                        <th className="px-4 py-2 font-medium text-right">Expense</th>
                        <th className="px-4 py-2 font-medium text-right">Avg Cost</th>
                        <th className="px-4 py-2 font-medium text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {zoneDrillData.siteStats.slice(0, 15).map((s, i) => (
                        <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 cursor-pointer" onClick={() => { setSelectedZoneForModal(null); setSelectedSiteForModal(s.name); }}>
                          <td className="px-4 py-2 text-cyan-400 font-medium hover:underline">{s.name}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{s.visits}</td>
                          <td className="px-4 py-2 text-right font-semibold text-indigo-400">₹{s.expense.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          <td className="px-4 py-2 text-right text-amber-400">₹{s.avg.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          <td className="px-4 py-2 text-right text-emerald-400">{s.pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
