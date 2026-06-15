import React, { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend } from "recharts";
import { Download, FileText, FileSpreadsheet, Search, Filter, TrendingUp, AlertCircle, Building2, MapPin, Zap, CheckCircle2, ChevronDown, ListFilter, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { splitVisitPurposes } from "../utils/cycleCalculations";

interface ExpenseReportingProps {
  visits: VisitRecord[];
}

interface FilterState {
  zone: string;
  state: string;
  site: string;
  fromDate: string;
  toDate: string;
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#f97316"
];

export function ExpenseReporting({ visits }: ExpenseReportingProps) {
  // Form Filters
  const [filters, setFilters] = useState<FilterState>({
    zone: "all",
    state: "all",
    site: "all",
    fromDate: "",
    toDate: "",
  });

  // Applied Filters (used to compute report data)
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);

  // Dropdown options based on FULL dataset for initial cascading (or dynamic)
  // For better UX, options filter down based on preceding selections
  const availableZones = useMemo(() => {
    return Array.from(new Set(visits.map(v => v.zone).filter(Boolean))).sort();
  }, [visits]);

  const availableStates = useMemo(() => {
    let filtered = visits;
    if (filters.zone !== "all") filtered = filtered.filter(v => v.zone === filters.zone);
    return Array.from(new Set(filtered.map(v => v.state).filter(Boolean))).sort();
  }, [visits, filters.zone]);

  const availableSites = useMemo(() => {
    let filtered = visits;
    if (filters.zone !== "all") filtered = filtered.filter(v => v.zone === filters.zone);
    if (filters.state !== "all") filtered = filtered.filter(v => v.state === filters.state);
    return Array.from(new Set(filtered.map(v => v.siteName).filter(Boolean))).sort();
  }, [visits, filters.zone, filters.state]);

  const handleGenerate = () => {
    setAppliedFilters({ ...filters });
  };

  const reportData = useMemo(() => {
    if (!appliedFilters) return null;

    let filtered = visits;

    if (appliedFilters.zone !== "all") {
      filtered = filtered.filter(v => v.zone === appliedFilters.zone);
    }
    if (appliedFilters.state !== "all") {
      filtered = filtered.filter(v => v.state === appliedFilters.state);
    }
    if (appliedFilters.site !== "all") {
      filtered = filtered.filter(v => v.siteName === appliedFilters.site);
    }
    if (appliedFilters.fromDate) {
      const from = startOfDay(new Date(appliedFilters.fromDate));
      filtered = filtered.filter(v => !isBefore(v.dateOfVisit, from));
    }
    if (appliedFilters.toDate) {
      const to = endOfDay(new Date(appliedFilters.toDate));
      filtered = filtered.filter(v => !isAfter(v.dateOfVisit, to));
    }

    const totalExpense = filtered.reduce((sum, v) => sum + (v.visitorCharges || 0), 0);
    const totalVisits = filtered.length;
    
    const uniqueSites = new Set(filtered.map(v => v.siteName));
    const totalSites = uniqueSites.size;
    const avgCostPerVisit = totalVisits > 0 ? totalExpense / totalVisits : 0;

    // Site Wise Comparison
    const siteMap = new Map<string, { visits: number; expense: number }>();
    filtered.forEach(v => {
      const s = siteMap.get(v.siteName) || { visits: 0, expense: 0 };
      s.visits++;
      s.expense += (v.visitorCharges || 0);
      siteMap.set(v.siteName, s);
    });
    const siteWise = Array.from(siteMap.entries()).map(([name, data]) => ({
      name,
      visits: data.visits,
      expense: data.expense
    }));
    const topSites = [...siteWise].sort((a, b) => b.expense - a.expense);

    // Purpose Wise Expense
    const purposeMap = new Map<string, { visits: number; expense: number }>();
    filtered.forEach(v => {
      const purposes = splitVisitPurposes(v.visitType);
      const chargePerPurpose = (v.visitorCharges || 0) / (purposes.length || 1);
      
      purposes.forEach(p => {
        const pd = purposeMap.get(p) || { visits: 0, expense: 0 };
        pd.visits++;
        pd.expense += chargePerPurpose;
        purposeMap.set(p, pd);
      });
    });
    const purposeWise = Array.from(purposeMap.entries()).map(([name, data]) => ({
      name,
      visits: data.visits,
      expense: data.expense
    })).sort((a, b) => b.expense - a.expense);

    // Monthly Trend
    const monthMap = new Map<string, { expense: number; visits: number }>();
    filtered.forEach(v => {
      const m = format(v.dateOfVisit, "MMM yyyy");
      const d = monthMap.get(m) || { expense: 0, visits: 0 };
      d.expense += (v.visitorCharges || 0);
      d.visits++;
      monthMap.set(m, d);
    });
    // Need chronological sort for months, but since they are strings, let's sort by Date
    const monthlyTrend = Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      sortDate: new Date(month).getTime(),
      expense: data.expense,
      visits: data.visits
    })).sort((a, b) => a.sortDate - b.sortDate);

    // Insights Generation
    const insights: string[] = [];
    if (totalVisits > 0) {
      insights.push(`A total of ₹${totalExpense.toLocaleString(undefined, {maximumFractionDigits:0})} was spent across ${totalVisits} visits.`);
      insights.push(`The average cost per visit stands at ₹${avgCostPerVisit.toLocaleString(undefined, {maximumFractionDigits:0})}.`);
      
      if (topSites.length > 0) {
        const topS = topSites[0];
        const pct = ((topS.expense / totalExpense) * 100).toFixed(1);
        insights.push(`Site "${topS.name}" represents the highest expenditure, accounting for ${pct}% of total costs (₹${topS.expense.toLocaleString(undefined, {maximumFractionDigits:0})}).`);
      }

      if (purposeWise.length > 0) {
        insights.push(`The most expensive visit category is "${purposeWise[0].name}" totaling ₹${purposeWise[0].expense.toLocaleString(undefined, {maximumFractionDigits:0})}.`);
      }
      
      if (monthlyTrend.length > 1) {
        const sortedMonths = [...monthlyTrend].sort((a, b) => b.expense - a.expense);
        insights.push(`Expenditure peaked in ${sortedMonths[0].month} with ₹${sortedMonths[0].expense.toLocaleString(undefined, {maximumFractionDigits:0})} spent.`);
      }
    } else {
      insights.push("No data available for the selected filters.");
    }

    return {
      visits: filtered,
      totalExpense,
      totalVisits,
      totalSites,
      avgCostPerVisit,
      siteWise,
      topSites,
      purposeWise,
      monthlyTrend,
      insights
    };
  }, [appliedFilters, visits]);

  const handleDownloadPDF = () => {
    if (!reportData || reportData.visits.length === 0) return;
    
    const doc = new jsPDF("p", "pt", "a4");
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Dark blue
    doc.text("Advanced Expense Analytics Report", 40, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 40, 70);
    
    // Filters applied
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Filters Applied:`, 40, 100);
    doc.setFontSize(10);
    doc.text(`Zone: ${appliedFilters!.zone === 'all' ? 'All Zones' : appliedFilters!.zone}`, 40, 115);
    doc.text(`State: ${appliedFilters!.state === 'all' ? 'All States' : appliedFilters!.state}`, 200, 115);
    doc.text(`Site: ${appliedFilters!.site === 'all' ? 'All Sites' : appliedFilters!.site}`, 40, 130);
    doc.text(`Period: ${appliedFilters!.fromDate ? format(new Date(appliedFilters!.fromDate), 'dd MMM yyyy') : 'Start'} to ${appliedFilters!.toDate ? format(new Date(appliedFilters!.toDate), 'dd MMM yyyy') : 'End'}`, 200, 130);

    // Executive Summary
    doc.setDrawColor(200);
    doc.line(40, 145, 550, 145);
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Executive Summary", 40, 175);
    
    doc.setFontSize(12);
    doc.text(`Total Expense: Rs. ${reportData.totalExpense.toLocaleString(undefined, {maximumFractionDigits:2})}`, 40, 200);
    doc.text(`Total Visits: ${reportData.totalVisits.toLocaleString()}`, 300, 200);
    doc.text(`Avg Cost / Visit: Rs. ${reportData.avgCostPerVisit.toLocaleString(undefined, {maximumFractionDigits:2})}`, 40, 220);
    doc.text(`Total Sites: ${reportData.totalSites.toLocaleString()}`, 300, 220);

    // Insights
    doc.setFontSize(16);
    doc.text("Key Insights", 40, 260);
    doc.setFontSize(10);
    let yPos = 280;
    reportData.insights.forEach((insight) => {
      const lines = doc.splitTextToSize(`• ${insight}`, 500);
      doc.text(lines, 40, yPos);
      yPos += (lines.length * 15);
    });

    // Top Sites Table
    yPos += 20;
    doc.setFontSize(14);
    doc.text("Top Expensive Sites", 40, yPos);
    
    autoTable(doc, {
      startY: yPos + 15,
      head: [['Rank', 'Site Name', 'Visits', 'Total Expense (Rs.)']],
      body: reportData.topSites.slice(0, 10).map((s, i) => [
        i + 1, 
        s.name, 
        s.visits, 
        s.expense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 30;
    
    // Purpose Table
    if (yPos > 700) {
      doc.addPage();
      yPos = 40;
    }

    doc.setFontSize(14);
    doc.text("Purpose Wise Expense Breakdown", 40, yPos);
    autoTable(doc, {
      startY: yPos + 15,
      head: [['Visit Purpose', 'Visit Count', 'Allocated Expense (Rs.)']],
      body: reportData.purposeWise.map(p => [
        p.name, 
        p.visits, 
        p.expense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Detailed Audit Table
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Detailed Expense Audit", 40, 40);
    
    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Zone', 'Site Name', 'Purpose', 'Status', 'Charges (Rs.)']],
      body: reportData.visits.map(v => [
        format(v.dateOfVisit, 'dd MMM yyyy'),
        v.zone,
        v.siteName,
        v.visitType,
        v.status || v.rawStatus,
        v.visitorCharges.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Expense_Report_${appliedFilters!.zone}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!reportData || reportData.visits.length === 0) return;
    
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary & Insights
    const summaryData = [
      ["Executive Summary"],
      ["Total Expense (Rs.)", reportData.totalExpense],
      ["Total Visits", reportData.totalVisits],
      ["Avg Cost / Visit (Rs.)", reportData.avgCostPerVisit],
      ["Total Sites Covered", reportData.totalSites],
      [],
      ["Key Insights"],
      ...reportData.insights.map(i => [i])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Top Sites
    const wsSites = XLSX.utils.json_to_sheet(reportData.topSites.map((s, i) => ({
      Rank: i + 1,
      SiteName: s.name,
      Visits: s.visits,
      TotalExpense: s.expense
    })));
    XLSX.utils.book_append_sheet(wb, wsSites, "Site Comparison");

    // Sheet 3: Purposes
    const wsPurposes = XLSX.utils.json_to_sheet(reportData.purposeWise.map(p => ({
      Purpose: p.name,
      Visits: p.visits,
      AllocatedExpense: p.expense
    })));
    XLSX.utils.book_append_sheet(wb, wsPurposes, "Purpose Analysis");

    // Sheet 4: Detailed Audit
    const wsDetails = XLSX.utils.json_to_sheet(reportData.visits.map(v => ({
      Date: format(v.dateOfVisit, 'yyyy-MM-dd'),
      Zone: v.zone,
      State: v.state,
      SiteName: v.siteName,
      VisitType: v.visitType,
      VisitorType: v.visitorType,
      Vendor: v.vendorName,
      Status: v.status || v.rawStatus,
      SignOff: v.signOffValue || (v.signOffReceived ? "Yes" : "No"),
      Charges: v.visitorCharges
    })));
    XLSX.utils.book_append_sheet(wb, wsDetails, "Detailed Audit");

    XLSX.writeFile(wb, `Expense_Report_${appliedFilters!.zone}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <Card className="border-0 bg-gray-900/60 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-200">Report Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                <label className="text-xs text-gray-400 font-medium">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Zap className="h-4 w-4" />
                Generate Report
              </button>

              {reportData && reportData.visits.length > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-700 mx-2 hidden sm:block" />
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-sm font-medium transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-sm font-medium transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Download Excel
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportData && (
        reportData.visits.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800/50">
            <AlertCircle className="h-10 w-10 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300">No data found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters to see results.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. Executive Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-xl border-indigo-500/30">
                <CardContent className="pt-6">
                  <p className="text-xs text-indigo-300/80 mb-1 font-semibold uppercase tracking-wider">Total Expense</p>
                  <p className="text-2xl font-bold text-indigo-300">₹{reportData.totalExpense.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border-emerald-500/30">
                <CardContent className="pt-6">
                  <p className="text-xs text-emerald-300/80 mb-1 font-semibold uppercase tracking-wider">Total Visits</p>
                  <p className="text-2xl font-bold text-emerald-300">{reportData.totalVisits.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border-amber-500/30">
                <CardContent className="pt-6">
                  <p className="text-xs text-amber-300/80 mb-1 font-semibold uppercase tracking-wider">Avg Cost / Visit</p>
                  <p className="text-2xl font-bold text-amber-300">₹{reportData.avgCostPerVisit.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30">
                <CardContent className="pt-6">
                  <p className="text-xs text-purple-300/80 mb-1 font-semibold uppercase tracking-wider">Sites Covered</p>
                  <p className="text-2xl font-bold text-purple-300">{reportData.totalSites.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* 8. Auto Generated Insights */}
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-200 flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Auto-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {reportData.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* 4. Monthly Expense Trend */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-base">Monthly Expense Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                          itemStyle={{ color: "#e5e7eb" }}
                          formatter={(value: number) => [`₹${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, "Expense"]}
                        />
                        <Line type="monotone" dataKey="expense" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Purpose Wise Expense Analysis (Pie) */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-base">Expense by Visit Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.purposeWise.slice(0, 10)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="expense"
                        >
                          {reportData.purposeWise.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                          formatter={(value: number) => `₹${value.toLocaleString(undefined, {maximumFractionDigits:0})}`}
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* 6. Top Expensive Sites */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    Top 10 Expensive Sites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-400">Site Name</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-400">Visits</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-400">Expense</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topSites.slice(0, 10).map((site, idx) => (
                          <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                            <td className="px-4 py-3 text-gray-300 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{idx + 1}.</span>
                                {site.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400">{site.visits}</td>
                            <td className="px-4 py-3 text-right text-indigo-400 font-semibold">₹{site.expense.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 7. Top Expensive Visit Types */}
              <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Allocated Expense by Purpose
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-400">Purpose</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-400">Visits</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-400">Allocated Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.purposeWise.map((purpose, idx) => (
                          <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                            <td className="px-4 py-3 text-gray-300 font-medium">{purpose.name}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{purpose.visits}</td>
                            <td className="px-4 py-3 text-right text-amber-400 font-semibold">₹{purpose.expense.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2. Site Wise Comparison Chart */}
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base">Site Wise Expense Comparison (Top 25)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.topSites.slice(0, 25)} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        interval={0}
                        tick={{fontSize: 10}}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                        itemStyle={{ color: "#e5e7eb" }}
                        formatter={(value: number) => [`₹${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, "Expense"]}
                        cursor={{fill: "#374151", opacity: 0.4}}
                      />
                      <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
                        {reportData.topSites.slice(0, 25).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 5. Detailed Expense Audit Table */}
            <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-teal-400" />
                  Detailed Expense Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800/50 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Zone</th>
                        <th className="px-4 py-3 font-medium">Site Name</th>
                        <th className="px-4 py-3 font-medium">Visit Purpose</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Charges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {reportData.visits.slice(0, 100).map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-gray-800/30 transition">
                          <td className="px-4 py-3 text-gray-300">{format(v.dateOfVisit, "dd MMM yyyy")}</td>
                          <td className="px-4 py-3 text-gray-400">{v.zone}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium">{v.siteName}</td>
                          <td className="px-4 py-3 text-cyan-400/90">{v.visitType}</td>
                          <td className="px-4 py-3 text-gray-400">{v.status || v.rawStatus}</td>
                          <td className="px-4 py-3 text-right font-semibold text-orange-400">₹{(v.visitorCharges || 0).toLocaleString(undefined, {maximumFractionDigits:2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.visits.length > 100 && (
                    <div className="p-3 text-center text-xs text-gray-500 bg-gray-900/30">
                      Showing top 100 records. Download Excel/PDF to view all {reportData.visits.length} records.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )
      )}
    </div>
  );
}