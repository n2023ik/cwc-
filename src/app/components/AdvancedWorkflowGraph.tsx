import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Boxes,
  ClipboardList,
  Fingerprint,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
  Warehouse,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type WorkflowNode = {
  id: number;
  title: string;
  icon: LucideIcon;
  color: string;
  glow: string;
};

type GlassNodeProps = {
  icon: LucideIcon;
  title: string;
  colorClass: string;
  glowClass: string;
};

type AdvancedWorkflowGraphProps = {
  poweredByLogoUrl: string;
  hubTitle?: string;
  hubSubtitle?: string;
};

function GlassNode({ icon: Icon, title, colorClass, glowClass }: GlassNodeProps) {
  return (
    <div className="relative z-10 group flex cursor-pointer items-center gap-4 rounded-full border border-white/10 bg-slate-900/40 p-3 pr-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-slate-800/50">
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 ${glowClass} transition-all duration-300 group-hover:scale-105`}>
        <div className={`absolute inset-0 rounded-full opacity-40 blur-md ${colorClass.replace("text-", "bg-")}`} />
        <Icon className={`relative z-10 h-5 w-5 ${colorClass}`} />
      </div>

      <span className="text-sm font-medium tracking-wide text-slate-200">{title}</span>

      <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 translate-x-1/2 items-center justify-center">
        <div className="absolute h-4 w-4 animate-ping rounded-full bg-cyan-400/40" />
        <div className="relative z-10 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      </div>
    </div>
  );
}

function RightGlassNode({ icon: Icon, title, colorClass, glowClass }: GlassNodeProps) {
  return (
    <div className="relative z-10 group flex cursor-pointer flex-row-reverse items-center gap-4 rounded-full border border-white/10 bg-slate-900/40 p-3 pl-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-slate-800/50">
      <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 ${glowClass} transition-all duration-300 group-hover:scale-105`}>
        <div className={`absolute inset-0 rounded-full opacity-40 blur-md ${colorClass.replace("text-", "bg-")}`} />
        <Icon className={`relative z-10 h-4 w-4 ${colorClass}`} />
      </div>

      <span className="text-sm font-medium tracking-wide text-slate-200">{title}</span>

      <div className="absolute left-0 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <div className="absolute h-4 w-4 animate-ping rounded-full bg-orange-400/40" />
        <div className="relative z-10 h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
      </div>
    </div>
  );
}

export function AdvancedWorkflowGraph({
  poweredByLogoUrl,
  hubTitle = "Central",
  hubSubtitle = "Warehouse System",
}: AdvancedWorkflowGraphProps) {
  const leftNodes: WorkflowNode[] = [
    { id: 1, title: "Visitor Aaya", icon: User, color: "text-blue-400", glow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]" },
    { id: 2, title: "Visit Verify Karein", icon: ShieldCheck, color: "text-emerald-400", glow: "shadow-[0_0_15px_rgba(52,211,153,0.3)]" },
    { id: 3, title: "Site Conditions Check Karein", icon: ClipboardList, color: "text-indigo-400", glow: "shadow-[0_0_15px_rgba(129,140,248,0.3)]" },
    { id: 4, title: "Status Update Karein", icon: RefreshCw, color: "text-cyan-400", glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]" },
  ];

  const rightNodes: WorkflowNode[] = [
    { id: 1, title: "Dock Assign Karein", icon: Truck, color: "text-pink-400", glow: "shadow-[0_0_15px_rgba(244,114,182,0.3)]" },
    { id: 2, title: "Inventory Sync Karein", icon: Boxes, color: "text-blue-400", glow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]" },
    { id: 3, title: "Staff Ko Alert Karein", icon: BellRing, color: "text-teal-400", glow: "shadow-[0_0_15px_rgba(45,212,191,0.3)]" },
  ];

  return (
    <section className="mt-6 rounded-3xl border border-violet-300/30 bg-[#05050a] bg-[radial-gradient(#ffffff11_1px,transparent_1px)] p-5 [background-size:20px_20px] shadow-[0_18px_40px_rgba(2,6,23,0.55)] xl:p-8">
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-orange-600/10 blur-[120px]" />

      <div className="relative hidden w-full max-w-none items-stretch xl:flex">
        <div className="z-10 flex w-72 flex-col justify-between py-12">
          {leftNodes.map((node) => (
            <GlassNode key={node.id} title={node.title} icon={node.icon} colorClass={node.color} glowClass={node.glow} />
          ))}
        </div>

        <div className="relative flex min-w-[200px] flex-1 items-center justify-center">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="line-grad-left" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow-left" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path d="M 0 15 C 50 15, 40 50, 70 50" fill="none" stroke="url(#line-grad-left)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" filter="url(#glow-left)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 0 38.3 C 50 38.3, 40 50, 70 50" fill="none" stroke="url(#line-grad-left)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" filter="url(#glow-left)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 0 61.6 C 50 61.6, 40 50, 70 50" fill="none" stroke="url(#line-grad-left)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" filter="url(#glow-left)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 0 85 C 50 85, 40 50, 70 50" fill="none" stroke="url(#line-grad-left)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" filter="url(#glow-left)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <polygon points="70,49 72,50 70,51" fill="#818cf8" filter="url(#glow-left)" />
          </svg>

          <div className="absolute right-8 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="30 15" className="opacity-60" />
                <path d="M 46 0 L 54 4 L 50 8 Z" fill="#c084fc" transform="rotate(45 50 50) translate(0 2)" />
                <path d="M 46 0 L 54 4 L 50 8 Z" fill="#c084fc" transform="rotate(225 50 50) translate(0 2)" />
              </svg>
              <div className="rounded-full border border-purple-500/30 bg-slate-900/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
                Real-time Sync
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-30 flex w-96 shrink-0 items-center justify-center">
          <div className="group relative flex h-80 w-80 items-center justify-center">
            <div className="absolute inset-0 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,theme(colors.blue.600),theme(colors.violet.500),theme(colors.orange.500),theme(colors.blue.600))] opacity-50 blur-[10px] transition-opacity duration-500 group-hover:opacity-80" />
            <div
              className="pointer-events-none absolute inset-1 animate-[spin_6s_linear_infinite_reverse] rounded-full bg-[conic-gradient(from_0deg,theme(colors.blue.500),theme(colors.violet.400),theme(colors.orange.400),theme(colors.teal.400),theme(colors.blue.500))]"
              style={{
                WebkitMask: "radial-gradient(transparent 68%, black 70%)",
                mask: "radial-gradient(transparent 68%, black 70%)",
              }}
            />
            <div className="absolute inset-4 animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-white/10" />

            <div className="absolute inset-6 flex flex-col items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-950/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="absolute top-0 h-1/2 w-full bg-gradient-to-b from-orange-500/10 to-transparent" />

              <div className="relative mb-2 mt-4">
                <div className="absolute inset-0 bg-orange-500 opacity-30 blur-xl" />
                <Warehouse className="relative z-10 h-14 w-14 text-orange-400" strokeWidth={1.5} />
                <div className="absolute bottom-2 right-2 h-3 w-3 rounded-[2px] border border-orange-300 opacity-80" />
                <div className="absolute bottom-2 left-2 h-2 w-2 rounded-[1px] border border-orange-300 opacity-80" />
              </div>

              <h3 className="relative z-10 mt-1 text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                {hubTitle}
              </h3>
              <p className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                {hubSubtitle}
              </p>

              <div className="relative z-10 mt-6 flex flex-col items-center gap-2">
                <p className="text-[9px] font-medium tracking-wide text-slate-400">Powered by</p>
                <ImageWithFallback
                  src={poweredByLogoUrl}
                  alt="Powered by logo"
                  className="h-8 rounded-md object-contain opacity-85 transition-all hover:scale-105 hover:opacity-100"
                />
              </div>
            </div>

            <div className="absolute right-4 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,1)]" />
          </div>
        </div>

        <div className="relative flex min-w-[150px] flex-1 items-center justify-center">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="line-grad-right" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow-right" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path d="M 10 50 C 40 50, 50 20, 100 20" fill="none" stroke="url(#line-grad-right)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" filter="url(#glow-right)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 10 50 C 40 50, 50 50, 100 50" fill="none" stroke="url(#line-grad-right)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" filter="url(#glow-right)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M 10 50 C 40 50, 50 80, 100 80" fill="none" stroke="url(#line-grad-right)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" filter="url(#glow-right)" strokeDasharray="3 3">
              <animate attributeName="stroke-dashoffset" from="15" to="0" dur="1s" repeatCount="indefinite" />
            </path>
            <polygon points="98,19 100,20 98,21" fill="#ec4899" filter="url(#glow-right)" />
            <polygon points="98,49 100,50 98,51" fill="#ec4899" filter="url(#glow-right)" />
            <polygon points="98,79 100,80 98,81" fill="#ec4899" filter="url(#glow-right)" />
          </svg>
        </div>

        <div className="z-10 flex w-60 flex-col justify-around py-24">
          {rightNodes.map((node) => (
            <RightGlassNode key={node.id} title={node.title} icon={node.icon} colorClass={node.color} glowClass={node.glow} />
          ))}
        </div>
      </div>

      <div className="relative space-y-3 xl:hidden">
        <div className="rounded-2xl border border-orange-300/40 bg-slate-900/70 p-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-orange-500/20">
            <Warehouse className="h-6 w-6 text-orange-300" />
          </div>
          <p className="text-xl font-bold text-white">{hubTitle}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300">{hubSubtitle}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {leftNodes.map((node) => (
            <div key={node.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
              <node.icon className={`mb-2 h-4 w-4 ${node.color}`} />
              {node.title}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 py-1 text-cyan-300">
          <Fingerprint className="h-4 w-4 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.14em]">Real-time Sync</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {rightNodes.map((node) => (
            <div key={node.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
              <node.icon className={`mb-2 h-4 w-4 ${node.color}`} />
              {node.title}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
