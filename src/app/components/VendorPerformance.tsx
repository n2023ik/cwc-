import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "./ui/progress";

interface VendorPerformanceProps {
  visits: VisitRecord[];
}

export function VendorPerformance({ visits }: VendorPerformanceProps) {
  const vendorStats = Object.entries(
    visits.reduce((acc, visit) => {
      const key = visit.vendorName;
      if (!acc[key]) {
        acc[key] = {
          vendor: key,
          totalVisits: 0,
          completed: 0,
          revenue: 0,
          avgCharges: 0,
        };
      }
      acc[key].totalVisits += 1;
      if (visit.status === "Completed") acc[key].completed += 1;
      acc[key].revenue += visit.visitorCharges;
      return acc;
    }, {} as Record<string, { vendor: string; totalVisits: number; completed: number; revenue: number; avgCharges: number }>)
  )
    .map(([_, data]) => ({
      ...data,
      avgCharges: data.revenue / data.totalVisits,
      completionRate: (data.completed / data.totalVisits) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topPerformer = vendorStats[0];

  return (
    <Card className="h-full border-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border-orange-500/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <Trophy className="h-5 w-5 text-orange-400" />
          Vendor Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col space-y-4">
        {/* Top Performer Highlight */}
        {topPerformer && (
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-orange-500/50 shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide">Top Performer</p>
                <h3 className="text-lg font-bold text-white">{topPerformer.vendor}</h3>
              </div>
              <div className="bg-orange-500/20 rounded-full p-2">
                <Trophy className="h-5 w-5 text-orange-400" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="text-sm font-bold text-white">₹{topPerformer.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Visits</p>
                <p className="text-sm font-bold text-white">{topPerformer.totalVisits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Success</p>
                <p className="text-sm font-bold text-green-400">{topPerformer.completionRate.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* All Vendors */}
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {vendorStats.map((vendor, index) => (
            <div key={vendor.vendor} className="bg-gray-800/50 rounded-lg p-3 shadow-sm border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-gray-300">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-200">{vendor.vendor}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">₹{vendor.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{vendor.totalVisits} visits</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Completion Rate</span>
                  <span className="font-semibold text-gray-200">{vendor.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={vendor.completionRate} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}