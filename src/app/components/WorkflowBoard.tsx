import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  ClipboardList,
  Lock,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
  UserX,
  Users,
  Wrench,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type WorkflowBoardProps = {
  lockImageUrl: string;
  cwcImageUrl: string;
  lynkitLabel?: string;
  todayVisits: number;
  todayCompleted: number;
  locksCount: number;
  gateCount: number;
  serviceCount: number;
  partiallyCompleted: number;
  rejectedByWhManager: number;
  visitorNotVisited: number;
  reputedCompleted: number;
  onTodayVisitsClick: () => void;
  onTodayCompletedClick: () => void;
  onLocksClick: () => void;
  onGateClick: () => void;
  onServiceClick: () => void;
  onPartiallyCompletedClick: () => void;
  onRejectedByWhClick: () => void;
  onVisitorNotVisitedClick: () => void;
  onReputedCompletedClick: () => void;
};

type GlassNodeProps = {
  icon: LucideIcon;
  title: string;
  colorClass: string;
  glowClass: string;
  onClick?: () => void;
};

type StatsCardProps = {
  icon: LucideIcon;
  title: string;
  value: number;
  colorTheme: "orange" | "purple" | "blue" | "green";
  onClick?: () => void;
};

type BottomGlassCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  glowColor: string;
  iconColor: string;
  hoverBorder: string;
  onClick?: () => void;
};

function CustomWarehouseIcon({
  className,
  strokeWidth = 6,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M 50 12 L 15 38 L 15 85 C 15 88 17 90 20 90 L 80 90 C 83 90 85 88 85 85 L 85 38 Z" />
      <path d="M 28 90 L 28 48 C 28 45 30 43 33 43 L 67 43 C 70 43 72 45 72 48 L 72 90" />
      <line x1="28" y1="58" x2="72" y2="58" />
      <line x1="28" y1="73" x2="72" y2="73" />
      <rect x="31" y="73" width="12" height="17" />
      <rect x="57" y="73" width="12" height="17" />
    </svg>
  );
}

function GlassNode({ icon: Icon, title, colorClass, glowClass, onClick }: GlassNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group z-10 flex w-full max-w-[clamp(210px,22vw,250px)] cursor-pointer items-center gap-3 rounded-2xl border border-b-transparent border-l border-r-transparent border-t border-white/10 bg-[#0a0f1c]/60 p-2.5 sm:p-3 sm:pr-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20 hover:bg-[#11192b]/80 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
    >
      <div className={`absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20 ${colorClass.replace("text-", "bg-")}`} />

      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-slate-900/80 shadow-inner ${glowClass} transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 sm:h-12 sm:w-12`}>
        <div className={`absolute inset-0 rounded-xl opacity-40 blur-md transition-opacity group-hover:opacity-80 ${colorClass.replace("text-", "bg-")}`} />
        <Icon className={`relative z-10 h-5 w-5 ${colorClass} drop-shadow-[0_0_8px_currentColor] sm:h-6 sm:w-6`} strokeWidth={2.5} />
      </div>

      <span className="w-[112px] whitespace-nowrap text-[11px] font-semibold uppercase leading-snug tracking-wider text-slate-200 drop-shadow-md transition-colors duration-300 group-hover:text-white sm:w-[120px] sm:text-[12px]">
        {title}
      </span>

      <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 translate-x-1/2 items-center justify-center">
        <div className="absolute h-7 w-7 animate-ping rounded-full bg-cyan-400/20" />
        <div className="absolute h-4 w-4 rounded-full border border-cyan-400/50 bg-[#0a0f1c]" />
        <div className="relative z-10 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] transition-all duration-300 group-hover:scale-150 group-hover:bg-white" />
      </div>
    </button>
  );
}

function StatsCard({ icon: Icon, title, value, colorTheme, onClick }: StatsCardProps) {
  const themes = {
    orange: {
      border: "border-orange-500/30 hover:border-orange-400/60 border-l-orange-400/50 border-t-orange-400/50",
      bg: "bg-gradient-to-br from-[#0a0f1c]/90 to-orange-950/40",
      text: "text-orange-400",
      glow: "shadow-[0_8px_30px_rgba(249,115,22,0.15)] group-hover:shadow-[0_15px_40px_rgba(249,115,22,0.4)]",
      iconGlow: "drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]",
      nodeBg: "bg-orange-400",
      nodePing: "bg-orange-400/30",
      textGradient: "from-orange-200 to-orange-500",
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-400/60 border-l-purple-400/50 border-t-purple-400/50",
      bg: "bg-gradient-to-br from-[#0a0f1c]/90 to-purple-950/40",
      text: "text-purple-400",
      glow: "shadow-[0_8px_30px_rgba(168,85,247,0.15)] group-hover:shadow-[0_15px_40px_rgba(168,85,247,0.4)]",
      iconGlow: "drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]",
      nodeBg: "bg-purple-400",
      nodePing: "bg-purple-400/30",
      textGradient: "from-purple-200 to-purple-500",
    },
    blue: {
      border: "border-blue-500/30 hover:border-blue-400/60 border-l-blue-400/50 border-t-blue-400/50",
      bg: "bg-gradient-to-br from-[#0a0f1c]/90 to-blue-950/40",
      text: "text-blue-400",
      glow: "shadow-[0_8px_30px_rgba(59,130,246,0.15)] group-hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)]",
      iconGlow: "drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]",
      nodeBg: "bg-blue-400",
      nodePing: "bg-blue-400/30",
      textGradient: "from-blue-200 to-blue-500",
    },
    green: {
      border: "border-emerald-500/30 hover:border-emerald-400/60 border-l-emerald-400/50 border-t-emerald-400/50",
      bg: "bg-gradient-to-br from-[#0a0f1c]/90 to-emerald-950/40",
      text: "text-emerald-400",
      glow: "shadow-[0_8px_30px_rgba(16,185,129,0.15)] group-hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]",
      iconGlow: "drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]",
      nodeBg: "bg-emerald-400",
      nodePing: "bg-emerald-400/30",
      textGradient: "from-emerald-200 to-emerald-500",
    },
  } as const;

  const theme = themes[colorTheme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-[clamp(76px,9.5vh,92px)] w-full max-w-[clamp(210px,24vw,270px)] cursor-pointer items-center justify-between overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} px-3.5 sm:px-5 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.05]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.text.replace("text-", "from-")}/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
      <div className={`absolute right-0 top-0 h-8 w-8 rounded-tr-xl bg-gradient-to-bl ${theme.text.replace("text-", "from-")}/20 to-transparent`} />

      <div className="absolute left-0 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <div className={`absolute h-7 w-7 animate-ping rounded-full ${theme.nodePing}`} />
        <div className="absolute h-4 w-4 rounded-full border border-white/20 bg-[#0a0f1c]" />
        <div className={`relative z-10 h-2 w-2 rounded-full ${theme.nodeBg} ${theme.text} shadow-[0_0_15px_currentColor] transition-all duration-300 group-hover:scale-150 group-hover:bg-white`} />
      </div>

      <div className="z-10 flex flex-col justify-center">
        <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400 transition-colors group-hover:text-slate-200 sm:text-[10px]">
          {title}
        </span>
        <span className={`bg-gradient-to-b ${theme.textGradient} bg-clip-text text-[clamp(1.6rem,2.8vw,2.25rem)] font-black leading-none tracking-tight text-transparent`}>
          {value}
        </span>
      </div>

      <div className="relative z-10">
        <Icon className={`h-8 w-8 ${theme.text} ${theme.iconGlow} opacity-90 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:opacity-100 sm:h-10 sm:w-10`} strokeWidth={2} />
      </div>
    </button>
  );
}

function BottomGlassCard({
  title,
  value,
  icon: Icon,
  glowColor,
  iconColor,
  hoverBorder,
  onClick,
}: BottomGlassCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.08] sm:p-5 ${hoverBorder}`}
    >
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60 ${glowColor}`} />
      <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      <div className="relative z-10 flex w-full items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300/80">{title}</p>
          <p className="mt-1 text-[clamp(1.5rem,2.6vw,1.875rem)] font-bold tracking-tight text-white drop-shadow-sm">{value}</p>
        </div>
        <div className={`flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${iconColor}`}>
          <div className="relative">
            <div className={`absolute inset-0 opacity-40 blur-lg ${glowColor}`} />
            <Icon size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-lg sm:h-[34px] sm:w-[34px]" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function WorkflowBoard({
  lockImageUrl,
  cwcImageUrl,
  lynkitLabel = "Lynkit",
  todayVisits,
  todayCompleted,
  locksCount,
  gateCount,
  serviceCount,
  partiallyCompleted,
  rejectedByWhManager,
  visitorNotVisited,
  reputedCompleted,
  onTodayVisitsClick,
  onTodayCompletedClick,
  onLocksClick,
  onGateClick,
  onServiceClick,
  onPartiallyCompletedClick,
  onRejectedByWhClick,
  onVisitorNotVisitedClick,
  onReputedCompletedClick,
}: WorkflowBoardProps) {
  const flowFrameRef = useRef<HTMLDivElement | null>(null);
  const flowContentRef = useRef<HTMLDivElement | null>(null);
  const [flowScale, setFlowScale] = useState(1);
  const [flowHeight, setFlowHeight] = useState<number | null>(null);

  useEffect(() => {
    const fitFlow = () => {
      const frame = flowFrameRef.current;
      const content = flowContentRef.current;
      if (!frame || !content) {
        return;
      }

      const naturalWidth = content.scrollWidth;
      const naturalHeight = content.scrollHeight;
      if (!naturalWidth || !naturalHeight) {
        return;
      }

      const availableWidth = frame.clientWidth;
      const nextScale = Math.min(1, availableWidth / naturalWidth);

      setFlowScale(nextScale);
      setFlowHeight(naturalHeight * nextScale);
    };

    const scheduleFit = () => window.requestAnimationFrame(fitFlow);

    scheduleFit();

    const observer = new ResizeObserver(scheduleFit);
    if (flowFrameRef.current) {
      observer.observe(flowFrameRef.current);
    }
    if (flowContentRef.current) {
      observer.observe(flowContentRef.current);
    }

    window.addEventListener("resize", scheduleFit);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleFit);
    };
  }, []);

  const leftNodes = [
    { title: "Visitor Arrives", icon: User, color: "text-blue-400", glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]", onClick: onTodayVisitsClick },
    { title: "Authenticate Visit", icon: ShieldCheck, color: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]", onClick: onGateClick },
    { title: "Check Site Conditions", icon: ClipboardList, color: "text-indigo-400", glow: "shadow-[0_0_20px_rgba(129,140,248,0.3)]", onClick: onPartiallyCompletedClick },
    { title: "Update Status", icon: RefreshCw, color: "text-cyan-400", glow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]", onClick: onTodayCompletedClick },
  ] as const;

  const rightNodes = [
    { title: "LOCKS COUNT", value: locksCount, icon: Lock, colorTheme: "orange" as const, onClick: onLocksClick },
    { title: "GATE COUNT", value: gateCount, icon: Truck, colorTheme: "purple" as const, onClick: onGateClick },
    { title: "SERVICE COUNT", value: serviceCount, icon: Wrench, colorTheme: "blue" as const, onClick: onServiceClick },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-[#04060c] p-3 md:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#04060c]/80 to-[#04060c]" />

      <div className="relative z-10 pb-6">
        <div
          ref={flowFrameRef}
          className="relative overflow-hidden"
          style={{ height: flowHeight ? `${flowHeight}px` : undefined }}
        >
          <div
            ref={flowContentRef}
            style={{
              transform: `scale(${flowScale})`,
              transformOrigin: "top left",
              width: flowScale < 1 ? `${100 / flowScale}%` : "100%",
            }}
          >
            <div className="flex min-h-[430px] min-w-[1024px] items-stretch lg:min-h-[500px] xl:min-w-[1140px]">
          <div className="grid w-[clamp(210px,20vw,250px)] shrink-0 grid-rows-4 py-5 lg:py-7">
            {leftNodes.map((node) => (
              <div key={node.title} className="flex items-center">
                <GlassNode
                  title={node.title}
                  icon={node.icon}
                  colorClass={node.color}
                  glowClass={node.glow}
                  onClick={node.onClick}
                />
              </div>
            ))}
          </div>

          <div className="relative flex min-w-[150px] flex-1 items-center justify-center">
            <svg className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="wf-left-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
                </linearGradient>
              </defs>

              <path d="M 0 12.5 C 50 12.5, 50 50, 100 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M 0 37.5 C 50 37.5, 50 50, 100 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M 0 62.5 C 50 62.5, 50 50, 100 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M 0 87.5 C 50 87.5, 50 50, 100 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />

              <path d="M 0 12.5 C 50 12.5, 50 50, 100 50" fill="none" stroke="url(#wf-left-grad)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray="15 45">
                <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 37.5 C 50 37.5, 50 50, 100 50" fill="none" stroke="url(#wf-left-grad)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray="15 45">
                <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 62.5 C 50 62.5, 50 50, 100 50" fill="none" stroke="url(#wf-left-grad)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray="15 45">
                <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 87.5 C 50 87.5, 50 50, 100 50" fill="none" stroke="url(#wf-left-grad)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" strokeDasharray="15 45">
                <animate attributeName="stroke-dashoffset" from="60" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>

          <div className="relative z-30 mx-2 flex w-[clamp(260px,29vw,330px)] shrink-0 items-center justify-center lg:mx-4">
            <div className="group absolute -left-8 top-1/2 z-40 hidden h-[clamp(84px,8.5vw,100px)] w-[clamp(84px,8.5vw,100px)] -translate-y-1/2 items-center justify-center lg:flex lg:-left-12">
              <svg className="absolute inset-0 h-full w-full animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="8 8" className="opacity-80 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </svg>

              <div className="z-10 flex h-[clamp(42px,4.6vw,52px)] w-[clamp(74px,7vw,88px)] flex-col items-center justify-center rounded-full border border-purple-500/50 bg-[#0b101a] shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                <RefreshCw className="mb-0.5 h-3.5 w-3.5 animate-[spin_2s_linear_infinite] text-purple-400" />
                <span className="text-[6.5px] font-black uppercase tracking-widest text-white">Real-Time</span>
                <span className="text-[6px] uppercase tracking-widest text-purple-300/80">Syncing</span>
              </div>

              <div className="absolute -left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,1)]" />
            </div>

            <div className="relative flex h-[clamp(220px,24vw,300px)] w-[clamp(220px,24vw,300px)] items-center justify-center">
              <div className="absolute inset-[-6px] animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#f97316,#10b981,#3b82f6)] opacity-60 blur-[8px]" />
              <div className="absolute inset-0 z-0 rounded-full border-[2px] border-white/20" />

              <div className="absolute inset-[4px] z-10 flex flex-col items-center justify-center overflow-hidden rounded-full border border-white/5 bg-gradient-to-br from-[#0f1420] to-[#080b12] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.9)]">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="pointer-events-none absolute -top-1/4 h-full w-full bg-orange-500/10 blur-3xl" />

                <div className="relative mb-1 mt-4">
                  <div className="absolute inset-0 bg-orange-500 opacity-40 blur-[35px]" />
                  <CustomWarehouseIcon className="relative z-20 h-[clamp(68px,8vw,100px)] w-[clamp(68px,8vw,100px)] text-[#ff8b3d] drop-shadow-[0_0_15px_rgba(251,146,60,0.9)]" strokeWidth={5.5} />
                </div>

                <h3 className="relative z-20 mt-1 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-[clamp(2rem,4vw,3.25rem)] font-black leading-none tracking-tighter text-transparent drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                  Central
                </h3>
                <p className="relative z-20 mt-2 pb-8 text-[clamp(9px,1vw,12px)] font-bold uppercase tracking-[0.3em] text-[#ff8b3d] drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]">
                  Warehouse System
                </p>
              </div>

              <div className="absolute -bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 rounded-[1rem] border border-white/10 bg-[#131926] px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.95)] lg:-bottom-9 lg:px-6 lg:py-2.5">
                <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Powered by</p>
                <div className="flex items-center justify-center">
                  <span className="text-[clamp(17px,1.8vw,20px)] font-black tracking-tight">
                    <span className="text-slate-100">{lynkitLabel.slice(0, -2) || "Lynk"}</span>
                    <span className="text-[#ff8b3d]">{lynkitLabel.slice(-2) || "it"}</span>
                  </span>
                </div>
              </div>

              <div className="absolute right-0 top-1/2 z-40 flex h-6 w-6 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-orange-500/50 bg-[#131926] shadow-[0_0_15px_rgba(251,146,60,0.8)]">
                <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]" />
              </div>
            </div>
          </div>

          <div className="relative flex min-w-[150px] flex-1 items-center justify-center">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0 47 L 4 50 L 0 53" fill="none" stroke="#ff8b3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

              <path d="M 4 50 C 30 50, 40 20, 95 20" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 8" vectorEffect="non-scaling-stroke">
                <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
              </path>
              <polygon points="94,18 100,20 94,22" fill="#f97316" />

              <path d="M 4 50 C 30 50, 40 50, 95 50" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="6 8" vectorEffect="non-scaling-stroke">
                <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
              </path>
              <polygon points="94,48 100,50 94,52" fill="#c084fc" />

              <path d="M 4 50 C 30 50, 40 80, 95 80" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 8" vectorEffect="non-scaling-stroke">
                <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
              </path>
              <polygon points="94,78 100,80 94,82" fill="#3b82f6" />
            </svg>
          </div>

          <div className="grid w-[clamp(210px,22vw,270px)] shrink-0 grid-rows-3 py-5 lg:py-7">
            {rightNodes.map((node) => (
              <div key={node.title} className="flex items-center justify-end">
                <StatsCard {...node} />
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-1.5 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <BottomGlassCard
            title="Today Visit"
            value={todayVisits}
            icon={Users}
            glowColor="bg-cyan-500"
            iconColor="text-cyan-400"
            hoverBorder="hover:border-cyan-500/40 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]"
            onClick={onTodayVisitsClick}
          />
          <BottomGlassCard
            title="Today Completed"
            value={todayCompleted}
            icon={CheckCircle}
            glowColor="bg-emerald-500"
            iconColor="text-emerald-400"
            hoverBorder="hover:border-emerald-500/40 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]"
            onClick={onTodayCompletedClick}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BottomGlassCard
          title="Partially Completed"
          value={partiallyCompleted}
          icon={RefreshCw}
          glowColor="bg-orange-500"
          iconColor="text-orange-400"
          hoverBorder="hover:border-orange-500/40 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]"
          onClick={onPartiallyCompletedClick}
        />
        <BottomGlassCard
          title="Rejected by WH Manager"
          value={rejectedByWhManager}
          icon={UserX}
          glowColor="bg-rose-500"
          iconColor="text-rose-400"
          hoverBorder="hover:border-rose-500/40 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]"
          onClick={onRejectedByWhClick}
        />
        <BottomGlassCard
          title="Visitor Not Visited"
          value={visitorNotVisited}
          icon={Users}
          glowColor="bg-amber-500"
          iconColor="text-amber-400"
          hoverBorder="hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]"
          onClick={onVisitorNotVisitedClick}
        />
        </div>
      </div>

      <div className="sr-only">
        <button onClick={onReputedCompletedClick}>Reputed Completed {reputedCompleted}</button>
        <ImageWithFallback src={lockImageUrl} alt="Lock image preload" className="h-1 w-1" />
      </div>
    </section>
  );
}
