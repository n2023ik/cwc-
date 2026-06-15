import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { VisitRecord } from "../types/visit";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface CostAnalysisProps {
  visits: VisitRecord[];
}

export function CostAnalysis({ visits }: CostAnalysisProps) {
  const splitVisitPurposes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const totalCharges = visits.reduce((sum, v) => sum + v.visitorCharges, 0);
  const totalProcurement = visits.reduce((sum, v) => sum + v.procurementAmount, 0);
  const avgChargePerVisit = totalCharges / (visits.length || 1);
  
  const chargesByType = Object.entries(
    visits.reduce((acc, visit) => {
      const purposes = splitVisitPurposes(visit.visitType);
      purposes.forEach((type) => {
        if (!acc[type]) {
          acc[type] = { total: 0, count: 0 };
        }
        acc[type].total += visit.visitorCharges;
        acc[type].count += 1;
      });
      return acc;
    }, {} as Record<string, { total: number; count: number }>)
  ).map(([type, data]) => ({
    type,
    total: data.total,
    average: data.total / data.count,
  }));

  const chargesByStatus = visits.reduce((acc, visit) => {
    if (!acc[visit.status]) {
      acc[visit.status] = 0;
    }
    acc[visit.status] += visit.visitorCharges;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="border-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-purple-500/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <DollarSign className="h-5 w-5 text-purple-400" />
          Cost Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">Total Visitor Charges</p>
            <p className="text-2xl font-bold text-white">₹{totalCharges.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1">Total Procurement</p>
            <p className="text-2xl font-bold text-white">₹{totalProcurement.toLocaleString()}</p>
          </div>
        </div>

        {/* Average Cost */}
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Avg Cost Per Visit</p>
              <p className="text-xl font-bold text-white">₹{avgChargePerVisit.toFixed(0)}</p>
            </div>
            <div className="bg-purple-500/20 rounded-full p-3">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Cost by Visit Type */}
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">Cost by Visit Type</h4>
          <div className="space-y-3">
            {chargesByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{item.type}</p>
                  <p className="text-xs text-gray-400">Avg: ₹{item.average.toFixed(0)}</p>
                </div>
                <p className="text-sm font-bold text-purple-400">₹{item.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cost by Status */}
        <div className="bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">Cost by Status</h4>
          <div className="space-y-2">
            {Object.entries(chargesByStatus).map(([status, amount]) => (
              <div key={status} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-400">{status}</span>
                <span className="text-sm font-semibold text-gray-200">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}