import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { VisitRecord } from "../types/visit";
import { format } from "date-fns";

interface RevenueTrendChartProps {
  visits: VisitRecord[];
}

export function RevenueTrendChart({ visits }: RevenueTrendChartProps) {
  // Group visits by month and sum charges
  const revenueByMonth = visits
    .sort((a, b) => a.dateOfVisit.getTime() - b.dateOfVisit.getTime())
    .reduce((acc, visit) => {
      const monthKey = format(visit.dateOfVisit, "MMM yyyy");
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, revenue: 0, visits: 0 };
      }
      acc[monthKey].revenue += visit.visitorCharges;
      acc[monthKey].visits += 1;
      return acc;
    }, {} as Record<string, { month: string; revenue: number; visits: number }>);

  const chartData = Object.values(revenueByMonth);

  return (
    <Card className="border-0 bg-gray-900/50 backdrop-blur-xl border-gray-800/50 shadow-2xl min-h-[540px]">
      <CardHeader>
        <CardTitle className="text-gray-200">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" tickMargin={12} />
            <YAxis stroke="#9ca3af" width={72} tickMargin={10} />
            <Tooltip 
              formatter={(value: number) => `₹${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", color: "#fff" }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#a78bfa" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}