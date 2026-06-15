import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { calculateQuarterCompletion } from "../utils/cycleCalculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Progress } from "./ui/progress";
import { CheckCircle2, TrendingUp, AlertTriangle, Map as MapIcon, Activity, Layers, PieChart as PieChartIcon, Lock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie, AreaChart, Area
} from "recharts";

const GATE_CYCLES = Array.from({ length: 20 }, (_, i) => `Q${i + 1}`);
const LOCK_CYCLES = Array.from({ length: 10 }, (_, i) => `HY${i + 1}`);

const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

interface ServiceOperationsAnalyticsProps {
  visits: VisitRecord[];
}

export function ServiceOperationsAnalytics({ visits }: ServiceOperationsAnalyticsProps) {
  const safeVisits = Array.isArray(visits) ? visits : [];

  const { defaultQCycle, defaultHYCycle, cycleStats } = useMemo(() => {
    let maxQ = 1;
    let maxHY = 1;

    console.log("DEBUG: Initializing Maps for cycleStats");
    const qStats = new Map<string, { total: number; completed: number }>();
    const hyStats = new Map<string, { total: number; completed: number }>();

    GATE_CYCLES.forEach((c) => qStats.set(c, { total: 0, completed: 0 }));
    LOCK_CYCLES.forEach((c) => hyStats.set(c, { total: 0, completed: 0 }));

    GATE_CYCLES.forEach((c) => {
      const result = calculateQuarterCompletion(safeVisits, c, false);
      qStats.set(c, { total: result.totalSites, completed: result.completedSitesCount });
      if (result.matchedRecords.length > 0) {
        const cycleNum = parseInt(c.replace("Q", ""), 10);
        maxQ = Math.max(maxQ, cycleNum);
      }
    });

    LOCK_CYCLES.forEach((c) => {
      const result = calculateQuarterCompletion(safeVisits, c, false);
      hyStats.set(c, { total: result.totalSites, completed: result.completedSitesCount });
      if (result.matchedRecords.length > 0) {
        const cycleNum = parseInt(c.replace("HY", ""), 10);
        maxHY = Math.max(maxHY, cycleNum);
      }
    });

    return {
      defaultQCycle: `Q${maxQ}`,
      defaultHYCycle: `HY${maxHY}`,
      cycleStats: { qStats, hyStats },
    };
  }, [visits]);

  const [selectedQCycle, setSelectedQCycle] = useState<string | null>(null);
  const [selectedHYCycle, setSelectedHYCycle] = useState<string | null>(null);

  const activeQCycle = selectedQCycle || defaultQCycle;
  const activeHYCycle = selectedHYCycle || defaultHYCycle;

  const { zoneData, summary } = useMemo(() => {
    const isGate = (t: string) => !!t && t.toUpperCase().includes("GATE");
    const isLock = (t: string) => !!t && t.toUpperCase().includes("LOCK");

    const hasActiveQ = (t: string) =>
      !!t && new RegExp(`\\b${activeQCycle}\\b`, "i").test(t);
    const hasActiveHY = (t: string) =>
      !!t && new RegExp(`\\b${activeHYCycle}\\b`, "i").test(t);

    const zonesMap = new Map<
      string,
      {
        gateSites: Set<string>;
        lockSites: Set<string>;
        completedGateSites: Set<string>;
        completedLockSites: Set<string>;
      }
    >();

    visits.forEach((v) => {
      const zone = v.zone || "Unknown";
      if (!zonesMap.has(zone)) {
        zonesMap.set(zone, {
          gateSites: new Set(),
          lockSites: new Set(),
          completedGateSites: new Set(),
          completedLockSites: new Set(),
        });
      }

      const zData = zonesMap.get(zone)!;
      const site = v.siteName;

      if (isGate(v.siteType)) {
        zData.gateSites.add(site);
        if (hasActiveQ(v.visitType) && v.status === "Completed") {
          zData.completedGateSites.add(site);
        }
      }

      if (isLock(v.siteType)) {
        zData.lockSites.add(site);
        if (hasActiveHY(v.visitType) && v.status === "Completed") {
          zData.completedLockSites.add(site);
        }
      }
    });

    let totalQCompleted = 0;
    let totalHYCompleted = 0;
    let totalPendingAll = 0;
    let totalAssetsAll = 0;

    const parsedZoneData = Array.from(zonesMap.entries())
      .map(([zone, data]) => {
        const gatesTotal = data.gateSites.size;
        const gatesCompleted = data.completedGateSites.size;
        const gatesPending = gatesTotal - gatesCompleted;

        const locksTotal = data.lockSites.size;
        const locksCompleted = data.completedLockSites.size;
        const locksPending = locksTotal - locksCompleted;

        const totalAssets = gatesTotal + locksTotal;
        const totalCompleted = gatesCompleted + locksCompleted;
        const totalPending = gatesPending + locksPending;

        totalQCompleted += gatesCompleted;
        totalHYCompleted += locksCompleted;
        totalPendingAll += totalPending;
        totalAssetsAll += totalAssets;

        const overallPercent =
          totalAssets === 0 ? 0 : Math.round((totalCompleted / totalAssets) * 100);
        const gatesPercent =
          gatesTotal === 0 ? 0 : Math.round((gatesCompleted / gatesTotal) * 100);
        const locksPercent =
          locksTotal === 0 ? 0 : Math.round((locksCompleted / locksTotal) * 100);

        let statusObj = {
          label: "🔴 Attention Needed",
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        if (overallPercent >= 90) {
          statusObj = {
            label: overallPercent >= 100 ? "🟢 Complete" : "🟢 On Track",
            badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          };
        } else if (overallPercent >= 70) {
          statusObj = {
            label: "🟡 In Progress",
            badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
          };
        }

        return {
          zone,
          gatesTotal,
          gatesCompleted,
          gatesPending,
          gatesPercent,
          locksTotal,
          locksCompleted,
          locksPending,
          locksPercent,
          totalAssets,
          totalCompleted,
          totalPending,
          overallPercent,
          statusObj,
        };
      })
      .filter((z) => z.totalAssets > 0)
      .sort((a, b) => {
        if (b.totalPending === a.totalPending) {
          return a.overallPercent - b.overallPercent;
        }
        return b.totalPending - a.totalPending;
      });

    return {
      zoneData: parsedZoneData,
      summary: {
        qCompleted: totalQCompleted,
        hyCompleted: totalHYCompleted,
        totalPending: totalPendingAll,
        totalAssets: totalAssetsAll,
      },
    };
  }, [visits, activeQCycle, activeHYCycle]);

  // Derived datasets for charts
  const topZones = useMemo(() => {
    return [...zoneData].sort((a, b) => b.overallPercent - a.overallPercent);
  }, [zoneData]);

  const distributionData = [
    { name: "Gates Completed", value: summary.qCompleted, color: "#3b82f6" },
    { name: "Locks Completed", value: summary.hyCompleted, color: "#a855f7" },
    { name: "Pending Services", value: summary.totalPending, color: "#ef4444" },
  ];

  // Dummy trend data simulating progress over time for the active cycles
  const trendData = useMemo(() => {
    return [
      { name: "Week 1", completed: Math.round((summary.qCompleted + summary.hyCompleted) * 0.1) },
      { name: "Week 2", completed: Math.round((summary.qCompleted + summary.hyCompleted) * 0.3) },
      { name: "Week 3", completed: Math.round((summary.qCompleted + summary.hyCompleted) * 0.5) },
      { name: "Week 4", completed: Math.round((summary.qCompleted + summary.hyCompleted) * 0.8) },
      { name: "Current", completed: summary.qCompleted + summary.hyCompleted },
    ];
  }, [summary]);

  const renderCycleChip = (
    cycle: string,
    type: "GATE" | "LOCK",
    isSelected: boolean,
    onSelect: (c: string) => void,
    stats: { total: number; completed: number }
  ) => {
    const isCompleted = stats.total > 0 && stats.total === stats.completed;
    const hasData = stats.total > 0;

    let baseClass =
      "relative flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer border shrink-0 select-none ";

    if (isSelected) {
      if (type === "GATE") {
        baseClass +=
          "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
      } else {
        baseClass +=
          "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]";
      }
    } else if (isCompleted) {
      baseClass +=
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50";
    } else if (hasData) {
      baseClass +=
        "bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700/80 hover:border-gray-600";
    } else {
      baseClass +=
        "bg-transparent text-gray-500 border-gray-800/50 hover:bg-gray-800/30 hover:border-gray-700 border-dashed";
    }

    return (
      <button
        key={cycle}
        onClick={() => onSelect(cycle)}
        className={baseClass}
        title={hasData ? `Total: ${stats.total}, Completed: ${stats.completed}` : "No assets"}
      >
        {cycle}
        {isCompleted && <CheckCircle2 className="w-4 h-4 ml-1.5 text-emerald-400" />}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          SERVICE OPERATIONS ANALYTICS
        </h2>
        <p className="text-gray-400">
          Dedicated command center for tracking cycle progress and operational health across all zones.
        </p>
      </div>

      {/* Navigator & KPIs Card */}
      <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardContent className="p-6 flex flex-col gap-8">
          {/* Service Cycle Navigator */}
          <div className="flex flex-col gap-4 bg-gray-950/60 p-5 rounded-xl border border-gray-800/80 shadow-inner">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Gate Cycle Timeline
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {GATE_CYCLES.map((c) =>
                  renderCycleChip(
                    c,
                    "GATE",
                    c === activeQCycle,
                    setSelectedQCycle,
                    cycleStats.qStats.get(c)!
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" /> Lock Cycle Timeline
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {LOCK_CYCLES.map((c) =>
                  renderCycleChip(
                    c,
                    "LOCK",
                    c === activeHYCycle,
                    setSelectedHYCycle,
                    cycleStats.hyStats.get(c)!
                  )
                )}
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 p-5 rounded-xl border border-blue-800/50 flex flex-col justify-center transition-all hover:bg-blue-900/50 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
              <div className="text-sm text-blue-300 font-medium mb-1">
                {activeQCycle} Gates Completed
              </div>
              <div className="text-4xl font-bold text-blue-400">{summary.qCompleted}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 p-5 rounded-xl border border-purple-800/50 flex flex-col justify-center transition-all hover:bg-purple-900/50 shadow-[0_4px_20px_rgba(168,85,247,0.1)]">
              <div className="text-sm text-purple-300 font-medium mb-1">
                {activeHYCycle} Locks Completed
              </div>
              <div className="text-4xl font-bold text-purple-400">{summary.hyCompleted}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 p-5 rounded-xl border border-emerald-800/50 flex flex-col justify-center transition-all hover:bg-emerald-900/50 shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
              <div className="text-sm text-emerald-300 font-medium mb-1">
                Total Completion Rate
              </div>
              <div className="text-4xl font-bold text-emerald-400">
                {summary.totalAssets > 0 
                  ? Math.round(((summary.qCompleted + summary.hyCompleted) / summary.totalAssets) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-900/40 to-rose-950/40 p-5 rounded-xl border border-rose-800/50 flex flex-col justify-center relative overflow-hidden transition-all hover:bg-rose-900/50 shadow-[0_4px_20px_rgba(244,63,94,0.1)]">
              <div className="relative z-10">
                <div className="text-sm text-rose-300 font-medium mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Total Pending Services
                </div>
                <div className="text-4xl font-bold text-rose-400">{summary.totalPending}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Zone Ranking Analysis */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-200 text-base">Zone Ranking Analysis</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Top performing zones by completion %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topZones.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                  <YAxis dataKey="zone" type="category" width={80} stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff", borderRadius: "8px" }}
                    formatter={(value: number) => [`${value}%`, 'Completion']}
                  />
                  <Bar dataKey="overallPercent" radius={[0, 4, 4, 0]}>
                    {topZones.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.overallPercent >= 90 ? "#10b981" : entry.overallPercent >= 70 ? "#3b82f6" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Services Analysis */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-200 text-base">Pending Services Analysis</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Zones requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="zone" stroke="#9ca3af" fontSize={11} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff", borderRadius: "8px" }}
                    cursor={{ fill: "#374151", opacity: 0.4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="gatesPending" name="Pending Gates" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="locksPending" name="Pending Locks" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Completion Distribution & Gates vs Locks */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl xl:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-200 text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-gray-400" /> Completion Distribution
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">Global distribution for active cycles</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff", borderRadius: "8px" }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gates vs Locks Comparison */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-200 text-base">Gates vs Locks Comparison</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Completed assets breakdown by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topZones.slice(0, 15)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="zone" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff", borderRadius: "8px" }}
                    cursor={{ fill: "#374151", opacity: 0.4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="gatesCompleted" name="Completed Gates" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="locksCompleted" name="Completed Locks" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-200 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Trend Analysis
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">Simulated completion velocity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff", borderRadius: "8px" }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed Assets" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Zone Heatmap & Detailed Progress Table spanning full width */}
        <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl xl:col-span-3 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-800/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-400" /> Zone Heatmap & Detailed Progress Table
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs mt-1">
                Comprehensive data matrix sorted by highest pending volume
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <Table className="w-full">
                <TableHeader className="bg-gray-900/90 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="border-gray-800/50 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-medium py-4 pl-6">Zone Heatmap</TableHead>
                    <TableHead className="text-gray-400 font-medium py-4 min-w-[200px]">
                      {activeQCycle} Progress
                    </TableHead>
                    <TableHead className="text-gray-400 font-medium py-4 min-w-[200px]">
                      {activeHYCycle} Progress
                    </TableHead>
                    <TableHead className="text-gray-400 font-medium py-4 text-center">
                      Pending
                    </TableHead>
                    <TableHead className="text-gray-400 font-medium py-4 pr-6 text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneData.length === 0 ? (
                    <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        No operations data available for selected cycles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    zoneData.map((row) => {
                      // Heatmap color calc for zone background
                      let bgIntensity = "bg-transparent";
                      if (row.overallPercent >= 90) bgIntensity = "bg-emerald-500/10 border-l-4 border-l-emerald-500";
                      else if (row.overallPercent >= 70) bgIntensity = "bg-blue-500/5 border-l-4 border-l-blue-500";
                      else bgIntensity = "bg-rose-500/10 border-l-4 border-l-rose-500";

                      return (
                        <TableRow
                          key={row.zone}
                          className={`border-gray-800/50 hover:bg-gray-800/50 transition-colors group ${bgIntensity}`}
                        >
                          <TableCell className="font-semibold text-gray-200 pl-6 py-4">
                            {row.zone}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-2 pr-6">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">
                                  {row.gatesCompleted} / {row.gatesTotal}
                                </span>
                                <span className="text-blue-400 font-bold">
                                  {row.gatesPercent}%
                                </span>
                              </div>
                              <Progress
                                value={row.gatesPercent}
                                className="h-2 bg-gray-950/50 border border-gray-800"
                                indicatorClassName="bg-gradient-to-r from-blue-600 to-blue-400"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-2 pr-6">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">
                                  {row.locksCompleted} / {row.locksTotal}
                                </span>
                                <span className="text-purple-400 font-bold">
                                  {row.locksPercent}%
                                </span>
                              </div>
                              <Progress
                                value={row.locksPercent}
                                className="h-2 bg-gray-950/50 border border-gray-800"
                                indicatorClassName="bg-gradient-to-r from-purple-600 to-purple-400"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 border border-gray-700 font-bold text-rose-400 shadow-inner">
                              {row.totalPending}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border ${row.statusObj.badgeClass} whitespace-nowrap shadow-sm`}
                            >
                              {row.statusObj.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
