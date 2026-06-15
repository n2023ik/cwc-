import { lazy, Suspense, useMemo, useState } from "react";
import { Activity, CalendarCheck2, Clock3 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { VisitRecord } from "../types/visit";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type VisitClassification = "scheduled" | "nonScheduled";

interface VisitClassificationAnalyticsProps {
  visits: VisitRecord[];
}

interface ClassificationStats {
  key: VisitClassification;
  label: string;
  total: number;
  percentage: number;
  completed: number;
  pending: number;
  completionRate: number;
  visits: VisitRecord[];
}

interface BreakdownRow {
  name: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

const CLASSIFICATION_COLORS: Record<VisitClassification, string> = {
  scheduled: "#06b6d4",
  nonScheduled: "#f97316",
};

const DetailedTable = lazy(() =>
  import("./DetailedTable").then((module) => ({ default: module.DetailedTable })),
);

const splitVisitPurposes = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const isScheduledPurpose = (purpose: string) => {
  const normalized = purpose.trim().toLowerCase().replace(/\s+/g, " ");

  if (/^q(?:[1-9]|1[0-9]|20)$/.test(normalized)) return true;
  if (/^hy(?:[1-9]|10)$/.test(normalized)) return true;

  return [
    "installation",
    "re-installation",
    "reinstallation",
    "re installation",
    "onsite training",
    "on-site training",
  ].includes(normalized);
};

const isScheduledVisit = (visit: VisitRecord) => {
  const purposes = [
    ...splitVisitPurposes(visit.visitType),
    ...splitVisitPurposes(visit.cycle ?? ""),
  ];
  return purposes.length > 0 && purposes.some(isScheduledPurpose);
};

const buildBreakdown = (
  visits: VisitRecord[],
  getKeys: (visit: VisitRecord) => string[],
): BreakdownRow[] => {
  const rows = new Map<string, { total: number; completed: number }>();

  visits.forEach((visit) => {
    getKeys(visit).forEach((rawKey) => {
      const key = rawKey.trim() || "Unknown";
      const current = rows.get(key) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (visit.status === "Completed") current.completed += 1;
      rows.set(key, current);
    });
  });

  return Array.from(rows.entries())
    .map(([name, value]) => {
      const pending = value.total - value.completed;
      return {
        name,
        total: value.total,
        completed: value.completed,
        pending,
        completionRate: value.total > 0 ? (value.completed / value.total) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

function ClassificationCard({
  stats,
  onClick,
}: {
  stats: ClassificationStats;
  onClick: () => void;
}) {
  const isScheduled = stats.key === "scheduled";
  const Icon = isScheduled ? CalendarCheck2 : Clock3;
  const accent = CLASSIFICATION_COLORS[stats.key];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <Card className="min-h-[220px] overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-900/60 shadow-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-100">
              {stats.label}
            </CardTitle>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: accent }}
          >
            <Icon className="h-5 w-5 text-white" strokeWidth={2.8} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl font-bold leading-none text-white">
                {stats.total}
              </div>
              <p className="mt-1 text-xs text-gray-400">Total count</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-100">
                {formatPercent(stats.percentage)}
              </div>
              <p className="mt-1 text-xs text-gray-400">of total visits</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-200">Completed</p>
              <p className="mt-1 text-xl font-semibold text-white">{stats.completed}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-200">Pending</p>
              <p className="mt-1 text-xl font-semibold text-white">{stats.pending}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Completion Rate</span>
              <span className="font-semibold text-gray-100">
                {formatPercent(stats.completionRate)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: BreakdownRow[];
}) {
  return (
    <Card className="border border-gray-800 bg-gray-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-200">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-72 overflow-auto rounded-lg border border-gray-800">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-right text-gray-300">Total</TableHead>
                <TableHead className="text-right text-gray-300">Done</TableHead>
                <TableHead className="text-right text-gray-300">Pending</TableHead>
                <TableHead className="text-right text-gray-300">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.name} className="border-gray-800">
                    <TableCell className="font-medium text-gray-200">{row.name}</TableCell>
                    <TableCell className="text-right text-gray-300">{row.total}</TableCell>
                    <TableCell className="text-right text-emerald-300">{row.completed}</TableCell>
                    <TableCell className="text-right text-amber-300">{row.pending}</TableCell>
                    <TableCell className="text-right text-gray-300">
                      {formatPercent(row.completionRate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisitClassificationAnalytics({
  visits,
}: VisitClassificationAnalyticsProps) {
  const [activeDrilldown, setActiveDrilldown] =
    useState<VisitClassification | null>(null);

  const stats = useMemo(() => {
    const scheduledVisits = visits.filter(isScheduledVisit);
    const nonScheduledVisits = visits.filter((visit) => !isScheduledVisit(visit));

    const buildStats = (
      key: VisitClassification,
      label: string,
      classifiedVisits: VisitRecord[],
    ): ClassificationStats => {
      const completed = classifiedVisits.filter(
        (visit) => visit.status === "Completed",
      ).length;
      const total = classifiedVisits.length;

      return {
        key,
        label,
        total,
        percentage: visits.length > 0 ? (total / visits.length) * 100 : 0,
        completed,
        pending: total - completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        visits: classifiedVisits,
      };
    };

    return {
      scheduled: buildStats("scheduled", "Scheduled Visits", scheduledVisits),
      nonScheduled: buildStats(
        "nonScheduled",
        "Non-Scheduled Visits",
        nonScheduledVisits,
      ),
    };
  }, [visits]);

  const donutData = [
    { name: "Scheduled Visits", value: stats.scheduled.total, key: "scheduled" },
    {
      name: "Non-Scheduled Visits",
      value: stats.nonScheduled.total,
      key: "nonScheduled",
    },
  ];

  const activeStats = activeDrilldown ? stats[activeDrilldown] : null;
  const purposeRows = activeStats
    ? buildBreakdown(activeStats.visits, (visit) => splitVisitPurposes(visit.visitType))
    : [];
  const zoneRows = activeStats
    ? buildBreakdown(activeStats.visits, (visit) => [visit.zone])
    : [];
  const siteRows = activeStats
    ? buildBreakdown(activeStats.visits, (visit) => [visit.siteName])
    : [];

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              Visit Classification Analytics
            </h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="grid gap-4 md:grid-cols-2">
            <ClassificationCard
              stats={stats.scheduled}
              onClick={() => setActiveDrilldown("scheduled")}
            />
            <ClassificationCard
              stats={stats.nonScheduled}
              onClick={() => setActiveDrilldown("nonScheduled")}
            />
          </div>

          <Card className="min-h-[300px] border border-gray-800 bg-gray-900/50 shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-200">
                <Activity className="h-4 w-4 text-cyan-300" />
                Scheduled vs Non-Scheduled Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={96}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {donutData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={CLASSIFICATION_COLORS[entry.key as VisitClassification]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          color: "#fff",
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} (${formatPercent((value / visits.length) * 100)})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-400">
                  No visit classification data available
                </div>
              )}

              <div className="grid gap-2 text-sm">
                {donutData.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveDrilldown(item.key as VisitClassification)}
                    className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2 text-left transition-colors hover:border-cyan-400/50"
                  >
                    <span className="flex items-center gap-2 text-gray-300">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            CLASSIFICATION_COLORS[item.key as VisitClassification],
                        }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog
        open={activeDrilldown !== null}
        onOpenChange={(open) => {
          if (!open) setActiveDrilldown(null);
        }}
      >
        <DialogContent className="top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 overflow-auto rounded-none border-gray-700 bg-gray-950 p-4 text-gray-100 sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>{activeStats?.label ?? "Visit Classification"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Showing {activeStats?.total ?? 0} records based on current filters.
            </DialogDescription>
          </DialogHeader>

          {activeStats && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="text-xs text-gray-400">Total Count</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{activeStats.total}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="text-xs text-gray-400">Percentage</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatPercent(activeStats.percentage)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="text-xs text-gray-400">Completed</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">
                    {activeStats.completed}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-300">
                    {activeStats.pending}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <p className="text-xs text-gray-400">Completion Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatPercent(activeStats.completionRate)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <BreakdownTable title="Purpose-wise Breakdown" rows={purposeRows} />
                <BreakdownTable title="Zone-wise Breakdown" rows={zoneRows} />
                <BreakdownTable title="Site-wise Breakdown" rows={siteRows} />
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <Suspense
                  fallback={
                    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-6 text-sm text-gray-400">
                      Loading detailed visits...
                    </div>
                  }
                >
                  <DetailedTable visits={activeStats.visits} />
                </Suspense>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
