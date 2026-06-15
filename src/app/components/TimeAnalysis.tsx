import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { Calendar, Clock } from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

interface TimeAnalysisProps {
  visits: VisitRecord[];
}

export function TimeAnalysis({ visits }: TimeAnalysisProps) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonthVisits = visits.filter(
    (v) => v.dateOfVisit >= thisMonthStart && v.dateOfVisit <= thisMonthEnd
  );

  const visitsByMonth = Object.entries(
    visits.reduce((acc, visit) => {
      const monthKey = format(visit.dateOfVisit, "MMM yyyy");
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, revenue: 0 };
      }
      acc[monthKey].count += 1;
      acc[monthKey].revenue += visit.visitorCharges;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>)
  ).sort((a, b) => {
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateB.getTime() - dateA.getTime();
  });

  const avgVisitsPerMonth = visits.length / (visitsByMonth.length || 1);

  // Find busiest day
  const visitsByDay = visits.reduce((acc, visit) => {
    const dayKey = format(visit.dateOfVisit, "EEEE");
    acc[dayKey] = (acc[dayKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const busiestDay = Object.entries(visitsByDay).sort((a, b) => b[1] - a[1])[0];

  return (
    <Card className="border-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <Clock className="h-5 w-5 text-cyan-400" />
          Time Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* This Month */}
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border-l-4 border-l-cyan-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">This Month</p>
              <p className="text-2xl font-bold text-white mt-1">{thisMonthVisits.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(thisMonthStart, "MMM yyyy")}
              </p>
            </div>
            <div className="bg-cyan-500/20 rounded-full p-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Average per Month */}
        <div className="bg-gray-800/50 rounded-lg p-3 shadow-sm border border-gray-700/50">
          <p className="text-sm text-gray-400">Avg Visits per Month</p>
          <p className="text-xl font-bold text-white">{avgVisitsPerMonth.toFixed(1)}</p>
        </div>

        {/* Busiest Day */}
        {busiestDay && (
          <div className="bg-gray-800/50 rounded-lg p-3 shadow-sm border border-gray-700/50">
            <p className="text-sm text-gray-400">Busiest Day</p>
            <p className="text-xl font-bold text-white">{busiestDay[0]}</p>
            <p className="text-xs text-gray-500">{busiestDay[1]} visits</p>
          </div>
        )}

        {/* Monthly Breakdown */}
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">Monthly Breakdown</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {visitsByMonth.map(([month, data]) => (
              <div key={month} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-200">{month}</p>
                  <p className="text-xs text-gray-400">{data.count} visits</p>
                </div>
                <p className="text-sm font-semibold text-cyan-400">₹{data.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}