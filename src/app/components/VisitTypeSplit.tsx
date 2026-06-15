import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { VisitRecord } from "../types/visit";

interface VisitTypeSplitProps {
  visits: VisitRecord[];
}

export function VisitTypeSplit({ visits }: VisitTypeSplitProps) {
  const splitVisitPurposes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const typeData = Object.entries(
    visits.reduce((acc, visit) => {
      const purposes = splitVisitPurposes(visit.visitType);
      purposes.forEach((type) => {
        if (!acc[type]) {
          acc[type] = { type, count: 0, revenue: 0 };
        }
        acc[type].count += 1;
        acc[type].revenue += visit.visitorCharges;
      });
      return acc;
    }, {} as Record<string, { type: string; count: number; revenue: number }>)
  )
    .map(([_, data]) => data)
    .sort((a, b) => b.count - a.count);

  const formatPurposeLabel = (value: string) =>
    value.length > 18 ? `${value.slice(0, 18)}...` : value;

  const hasData = typeData.length > 0;

  return (
    <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl min-h-[540px]">
      <CardHeader>
        <CardTitle className="text-gray-200">Visit Type Split</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={typeData}
            layout="vertical"
            barCategoryGap={14}
            margin={{ top: 8, right: 28, bottom: 8, left: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              xAxisId="countAxis"
              type="number"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              allowDecimals={false}
            />
            <XAxis xAxisId="revenueAxis" type="number" hide />
            <YAxis
              dataKey="type"
              type="category"
              width={132}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={formatPurposeLabel}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff" }}
              formatter={(value: number, name: string) => {
                if (name === "revenue") return `₹${value.toLocaleString()}`;
                return value;
              }}
            />
            <Legend wrapperStyle={{ color: "#9ca3af" }} />
            <Bar
              xAxisId="countAxis"
              dataKey="count"
              fill="#3b82f6"
              name="Visit Count"
              radius={[0, 6, 6, 0]}
            />
            <Bar
              xAxisId="revenueAxis"
              dataKey="revenue"
              fill="#10b981"
              name="Revenue (₹)"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-400">
            No visit type data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}