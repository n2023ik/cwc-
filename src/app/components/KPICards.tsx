import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, Check, X, IndianRupee } from "lucide-react";

interface KPICardsProps {
  totalVisits: number;
  completedCount: number;
  rejectedCount: number;
  totalRevenue: number;
  previousRevenue?: number;
  onTotalVisitsClick?: () => void;
  onCompletedClick?: () => void;
  onRejectedClick?: () => void;
  onRevenueClick?: () => void;
}

export function KPICards({
  totalVisits,
  completedCount,
  rejectedCount,
  totalRevenue,
  previousRevenue = 0,
  onTotalVisitsClick,
  onCompletedClick,
  onRejectedClick,
  onRevenueClick,
}: KPICardsProps) {
  const revenueChange =
    previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
  const completedPercent = totalVisits > 0 ? (completedCount / totalVisits) * 100 : 0;
  const rejectedPercent = totalVisits > 0 ? (rejectedCount / totalVisits) * 100 : 0;

  const cardBase =
    "relative min-h-[110px] overflow-hidden rounded-2xl border p-4 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl";

  const CoinStacks = () => (
    <svg
      width="54"
      height="48"
      viewBox="0 0 48 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute bottom-3 right-4 opacity-95 drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]"
    >
      <g transform="translate(0, 8)">
        <ellipse cx="14" cy="20" rx="12" ry="4.5" fill="#78350f" />
        <path d="M2 20 v5 a12 4.5 0 0 0 24 0 v-5" fill="#92400e" />
        <ellipse cx="14" cy="15" rx="12" ry="4.5" fill="#92400e" />
        <path d="M2 15 v5 a12 4.5 0 0 0 24 0 v-5" fill="#b45309" />
        <ellipse cx="14" cy="10" rx="12" ry="4.5" fill="#b45309" />
        <path d="M2 10 v5 a12 4.5 0 0 0 24 0 v-5" fill="#d97706" />
        <ellipse cx="14" cy="5" rx="12" ry="4.5" fill="#fde047" stroke="#d97706" strokeWidth="0.5" />
      </g>
      <g transform="translate(18, 0)">
        <ellipse cx="14" cy="25" rx="12" ry="4.5" fill="#78350f" />
        <path d="M2 25 v5 a12 4.5 0 0 0 24 0 v-5" fill="#92400e" />
        <ellipse cx="14" cy="20" rx="12" ry="4.5" fill="#92400e" />
        <path d="M2 20 v5 a12 4.5 0 0 0 24 0 v-5" fill="#b45309" />
        <ellipse cx="14" cy="15" rx="12" ry="4.5" fill="#b45309" />
        <path d="M2 15 v5 a12 4.5 0 0 0 24 0 v-5" fill="#d97706" />
        <ellipse cx="14" cy="10" rx="12" ry="4.5" fill="#b45309" />
        <path d="M2 10 v5 a12 4.5 0 0 0 24 0 v-5" fill="#f59e0b" />
        <ellipse cx="14" cy="5" rx="12" ry="4.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.5" />
      </g>
    </svg>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        className={`${cardBase} border-blue-500/40 border-l-blue-400/50 border-t-blue-400/50 bg-[#111827]/40 ${onTotalVisitsClick ? "cursor-pointer" : ""}`}
        onClick={onTotalVisitsClick}
      >
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-[13px] font-medium tracking-wide text-gray-300">Total Visits</CardTitle>
          <div className="flex h-10 w-10 sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-[#0052CC] ring-2 ring-white/10 shadow-[0_0_15px_rgba(0,82,204,0.6)]">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 mt-2.5">
          <div className="text-[clamp(1.65rem,3vw,2.125rem)] font-bold leading-none tracking-tight text-white">{totalVisits}</div>
          <p className="mt-1.5 text-xs sm:text-[13px] text-gray-400">Across all zones</p>
        </CardContent>
      </Card>

      <Card
        className={`${cardBase} border-green-500/40 border-l-green-400/50 border-t-green-400/50 bg-[#111827]/40 ${onCompletedClick ? "cursor-pointer" : ""}`}
        onClick={onCompletedClick}
      >
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-[13px] font-medium tracking-wide text-gray-300">Completed</CardTitle>
          <div className="flex h-10 w-10 sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-[#0F8A46] ring-2 ring-white/10 shadow-[0_0_15px_rgba(15,138,70,0.6)]">
            <Check className="h-5 w-5 text-white" strokeWidth={3.5} />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 mt-2.5">
          <div className="text-[clamp(1.65rem,3vw,2.125rem)] font-bold leading-none tracking-tight text-white">{completedCount}</div>
          <div className="mt-2.5 flex items-end justify-between text-xs sm:text-[13px]">
            <span className="text-gray-400">Completed visits</span>
            <span className="font-semibold text-gray-200">{completedPercent.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08] shadow-inner">
            <div className="h-full rounded-full bg-[#10b981] transition-all duration-1000 ease-out" style={{ width: `${completedPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${cardBase} border-red-500/40 border-l-red-400/50 border-t-red-400/50 bg-[#111827]/40 ${onRejectedClick ? "cursor-pointer" : ""}`}
        onClick={onRejectedClick}
      >
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-[13px] font-medium tracking-wide text-gray-300">Rejected</CardTitle>
          <div className="flex h-10 w-10 sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-[#6b1c28] ring-2 ring-white/10 shadow-[0_0_15px_rgba(153,27,27,0.6)]">
            <X className="h-5 w-5 text-white" strokeWidth={3.5} />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 mt-2.5">
          <div className="text-[clamp(1.65rem,3vw,2.125rem)] font-bold leading-none tracking-tight text-white">{rejectedCount}</div>
          <div className="mt-2.5 flex items-end justify-between text-xs sm:text-[13px]">
            <span className="text-gray-400">Rejected visits</span>
            <span className="font-semibold text-gray-200">{rejectedPercent.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08] shadow-inner">
            <div className="h-full rounded-full bg-[#ef4444] transition-all duration-1000 ease-out" style={{ width: `${rejectedPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${cardBase} border-purple-500/40 border-l-purple-400/50 border-t-purple-400/50 bg-[#111827]/40 ${onRevenueClick ? "cursor-pointer" : ""}`}
        onClick={onRevenueClick}
      >
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-[13px] font-medium tracking-wide text-gray-300">Total Expense</CardTitle>
          <div className="flex h-10 w-10 sm:h-[42px] sm:w-[42px] items-center justify-center rounded-full bg-[#7e22ce] ring-2 ring-white/10 shadow-[0_0_15px_rgba(126,34,206,0.6)]">
            <IndianRupee className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 mt-2.5">
          <div className="text-[clamp(1.4rem,2.5vw,2.125rem)] font-bold leading-none tracking-tight text-white">₹{totalRevenue.toLocaleString()}</div>
          <p className="mt-1.5 text-xs sm:text-[13px] text-gray-400">Across all zones</p>
          {revenueChange !== 0 && (
            <p className={`mt-2 text-xs ${revenueChange > 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {revenueChange > 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}% from last period
            </p>
          )}
          <CoinStacks />
        </CardContent>
      </Card>
    </div>
  );
}