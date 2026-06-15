import { Menu } from "lucide-react";

type FloatingTopHeaderProps = {
  isLoadingData: boolean;
  onSignOut: () => void;
};

export function FloatingTopHeader({ isLoadingData, onSignOut }: FloatingTopHeaderProps) {
  return (
    <header className="fixed left-2 right-2 top-2 z-50 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[16px] transition-all duration-300 hover:border-white/20 md:left-2 md:right-2 md:top-4 md:rounded-2xl">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-center justify-between gap-4 p-3 md:p-4 lg:px-6">
        <div className="group flex shrink-0 cursor-pointer items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 transition-transform duration-500 group-hover:scale-105 md:h-12 md:w-12">
            <div className="absolute inset-0 rounded-full bg-[#F68F1F] opacity-20 blur-lg" />
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative h-full w-full drop-shadow-md">
              <path d="M10 45 L50 15 L90 45 V85 H10 Z" stroke="#F68F1F" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M25 85 V45 H45 V85" stroke="#F68F1F" strokeWidth="5" strokeLinejoin="round"/>
              <rect x="30" y="55" width="10" height="10" fill="#F68F1F" />
              <rect x="30" y="70" width="10" height="10" fill="#F68F1F" />
              <path d="M55 85 V55 H75" stroke="#F68F1F" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="65" cy="70" r="4" fill="#F68F1F" />
            </svg>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="mb-[2px] text-xl font-bold leading-none tracking-tight text-white drop-shadow-sm md:text-2xl">Central</h1>
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.2em] text-[#F68F1F] md:text-[0.62rem]" style={{ textShadow: "0 0 15px rgba(246, 143, 31, 0.4)" }}>
              Warehouse System
            </p>
          </div>
        </div>

        <div className="mx-2 hidden h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />

        <div className="hidden shrink-0 cursor-pointer flex-col items-start sm:flex">
          <span className="mb-[2px] ml-1 text-[0.52rem] font-medium tracking-wide text-gray-400 md:text-[0.62rem]">Powered by</span>
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-md">
                <rect x="15" y="15" width="70" height="70" stroke="#F68F1F" strokeWidth="6" strokeLinejoin="round"/>
                <path d="M15 15 L50 50 L15 85" stroke="#F68F1F" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>
                <path d="M50 15 V50" stroke="#F68F1F" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>
                <path d="M50 50 L85 15" stroke="#9CA3AF" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-200 md:text-xl">
              Lynk<span className="text-[#F68F1F]">it</span>
            </span>
          </div>
        </div>

        <div className="hidden flex-grow flex-col items-end text-right lg:flex">
          <h2 className="mb-1 text-xs font-medium tracking-wider text-white drop-shadow-sm md:text-sm">
            SMARTER WAREHOUSE. SEAMLESS OPERATIONS.
          </h2>
          <p className="text-[0.56rem] font-semibold uppercase tracking-widest text-[#F68F1F] md:text-[0.66rem]" style={{ textShadow: "0 0 15px rgba(246, 143, 31, 0.4)" }}>
            Central + Lynkit = Complete Visibility.
          </p>
        </div>

        <div className="hidden items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 md:flex">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <span className="text-xs font-medium text-gray-300">
            {isLoadingData ? "Syncing" : "Live"}
          </span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-gray-600/60 bg-gray-800/80 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700/80"
          >
            Sign out
          </button>
        </div>

        <button className="pr-2 text-white sm:hidden" aria-label="Open navigation menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
