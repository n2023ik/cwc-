import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { VisitRecord } from "../types/visit";

interface StatusChartProps {
  visits: VisitRecord[];
  onStatusClick?: (status: string) => void;
}

const COLORS = {
  Completed: "#10b981",
  Partial: "#f59e0b",
  Rejected: "#ef4444",
  "Not Visited": "#6b7280",
};

function getStatusColor(status: string): string {
  return COLORS[status as keyof typeof COLORS] || "#3b82f6";
}

export function StatusChart({ visits, onStatusClick }: StatusChartProps) {
  const statusData = Object.entries(
    visits.reduce((acc, visit) => {
      acc[visit.status] = (acc[visit.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / visits.length) * 100).toFixed(1),
  }));

  return (
    <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl min-h-[540px]">
      <CardHeader>
        <CardTitle className="text-gray-200">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={112}
              fill="#8884d8"
              dataKey="value"
              onClick={(data) => {
                if (data?.name) {
                  onStatusClick?.(String(data.name));
                }
              }}
            >
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={getStatusColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff" }} />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3">
          {statusData.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onStatusClick?.(item.name)}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors text-left"
              title={`Show ${item.name} list`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(item.name) }}
                />
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}