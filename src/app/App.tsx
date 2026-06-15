import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { KPICards } from "./components/KPICards";
import {
  DashboardFilters,
  FilterOption,
  FilterState,
} from "./components/DashboardFilters";
import {
  DateRangeFilter,
  DateRange,
} from "./components/DateRangeFilter";
import { StatusChart } from "./components/StatusChart";
import { RevenueTrendChart } from "./components/RevenueTrendChart";
import { VisitTypeSplit } from "./components/VisitTypeSplit";
import { VisitClassificationAnalytics } from "./components/VisitClassificationAnalytics";
import { ZonePerformance } from "./components/ZonePerformance";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VendorPerformance } from "./components/VendorPerformance";
import { CostAnalysis } from "./components/CostAnalysis";
import { TimeAnalysis } from "./components/TimeAnalysis";
import { WorkflowBoard } from "./components/WorkflowBoard";
import { CurrentDueServices } from "./components/CurrentDueServices";
import { FloatingTopHeader } from "./components/FloatingTopHeader";
import { fetchVisitsFromGoogleSheet } from "./data/googleSheets";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Fingerprint,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { VisitRecord } from "./types/visit";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { format } from "date-fns";

const SHEET_CACHE_TTL_MS = 5 * 60_000;
const BACKGROUND_REFRESH_INTERVAL_MS = 30_000;
const LOCK_IMAGE_URL = "https://raw.githubusercontent.com/n2023ik/project-imh/main/lora%20lock.png";
const CWC_IMAGE_URL = "https://raw.githubusercontent.com/n2023ik/project-imh/main/Gemini_Generated_Image_utb4tkutb4tkutb4.png";

const DetailedTable = lazy(() =>
  import("./components/DetailedTable").then((module) => ({ default: module.DetailedTable })),
);
const ExpenseAnalytics = lazy(() =>
  import("./components/ExpenseAnalytics").then((module) => ({ default: module.ExpenseAnalytics })),
);
const ReportExport = lazy(() =>
  import("./components/ReportExport").then((module) => ({ default: module.ReportExport })),
);
const ServiceAnalysis = lazy(() =>
  import("./components/ServiceAnalysis").then((module) => ({ default: module.ServiceAnalysis })),
);
const ServiceOperationsAnalytics = lazy(() =>
  import("./components/ServiceOperationsAnalytics").then((module) => ({ default: module.ServiceOperationsAnalytics })),
);

type TodayDialogMode = "all" | "completed";
type SignOffCategory = "gate" | "locks" | "service";
type KpiDialogMode = "all" | "completed" | "rejected" | "revenue";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number | boolean>,
      ) => void;
      disableAutoSelect: () => void;
      prompt: () => void;
    };
  };
};

type WindowWithGoogle = Window & {
  google?: GoogleIdApi;
};

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const GOOGLE_LOADING_PHRASES = [
  "Contacting Google...",
  "Verifying your credentials...",
  "Securing your connection...",
  "Finalizing sign in...",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
      </g>
    </svg>
  );
}

export default function App() {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  const sheetId = env.VITE_GOOGLE_SHEET_ID ?? "";
  const sheetName = env.VITE_GOOGLE_SHEET_NAME || "Sheet1";
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID ?? "";
  const authScriptUrl = env.VITE_GOOGLE_AUTH_SCRIPT_URL ?? "";

  const [activeTab, setActiveTab] = useState("overview");
  const [activePage, setActivePage] = useState<"dashboard" | "service-analysis">("dashboard");
  const [allVisits, setAllVisits] = useState<VisitRecord[]>(() => {
    try {
      const cached = localStorage.getItem("dashboard_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map((v: any) => ({
          ...v,
          dateOfVisit: new Date(v.dateOfVisit)
        }));
      }
    } catch (e) {
      console.error("Failed to load cache", e);
    }
    return [];
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    try {
      const cachedTime = localStorage.getItem("dashboard_cache_time");
      if (cachedTime) return new Date(cachedTime);
    } catch (e) {
      console.error("Failed to load cached time", e);
    }
    return null;
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading, login, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [isTodayDialogOpen, setIsTodayDialogOpen] = useState(false);
  const [todayDialogMode, setTodayDialogMode] =
    useState<TodayDialogMode>("all");
  const [isSignOffDialogOpen, setIsSignOffDialogOpen] = useState(false);
  const [signOffDialogCategory, setSignOffDialogCategory] =
    useState<SignOffCategory>("gate");
  const [isStatusSummaryDialogOpen, setIsStatusSummaryDialogOpen] =
    useState(false);
  const [statusSummaryDialogStatus, setStatusSummaryDialogStatus] =
    useState<string>("Partially Completed");
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false);
  const [kpiDialogMode, setKpiDialogMode] = useState<KpiDialogMode>("all");
  const signInButtonRef = useRef<HTMLDivElement | null>(null);
  const googleIdentityInitializedRef = useRef(false);

  useEffect(() => {
    console.log("Dashboard Mounted");
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      .animate-blob {
        animation: blob 7s infinite;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-4000 {
        animation-delay: 4s;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !isVerifying) {
      setLoadingStep(0);
      return;
    }

    const messageInterval = window.setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < GOOGLE_LOADING_PHRASES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    return () => {
      window.clearInterval(messageInterval);
    };
  }, [authLoading, isVerifying]);

  const hasRequiredVisitFields = (visit: VisitRecord) => {
    const hasSrNo = Number.isFinite(visit.srNo) && visit.srNo > 0;
    const normalizedZone = (visit.zone || "").trim().toLowerCase();
    const hasZone =
      normalizedZone.length > 0 &&
      normalizedZone !== "unknown" &&
      normalizedZone !== "#n/a" &&
      normalizedZone !== "n/a";
    return hasSrNo && hasZone;
  };

  const [filters, setFilters] = useState<FilterState>({
    zone: "all",
    state: "all",
    site: "all",
    siteType: "all",
    visitType: "all",
    visitorType: "all",
    vendor: "all",
    status: "all",
    signOffStatus: "all",
  });

  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  const emptyFilters: FilterState = {
    zone: "all",
    state: "all",
    site: "all",
    siteType: "all",
    visitType: "all",
    visitorType: "all",
    vendor: "all",
    status: "all",
    signOffStatus: "all",
  };

  const splitVisitPurposes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const filterVisitRecords = (
    visits: VisitRecord[],
    activeFilters: FilterState,
    activeDateRange: DateRange,
    omitFilter?: keyof FilterState,
  ) =>
    visits.filter((visit) => {
      if (activeDateRange.from && visit.dateOfVisit < activeDateRange.from)
        return false;
      if (activeDateRange.to && visit.dateOfVisit > activeDateRange.to)
        return false;
      if (omitFilter !== "zone" && activeFilters.zone !== "all" && visit.zone !== activeFilters.zone)
        return false;
      if (omitFilter !== "state" && activeFilters.state !== "all" && visit.state !== activeFilters.state)
        return false;
      if (omitFilter !== "site" && activeFilters.site !== "all" && visit.siteName !== activeFilters.site)
        return false;
      if (omitFilter !== "siteType" && activeFilters.siteType !== "all" && visit.siteType !== activeFilters.siteType)
        return false;
      if (
        omitFilter !== "visitType" &&
        activeFilters.visitType !== "all" &&
        !splitVisitPurposes(visit.visitType).includes(activeFilters.visitType)
      )
        return false;
      if (omitFilter !== "visitorType" && activeFilters.visitorType !== "all" && visit.visitorType !== activeFilters.visitorType)
        return false;
      if (omitFilter !== "vendor" && activeFilters.vendor !== "all" && visit.vendorName !== activeFilters.vendor)
        return false;
      if (omitFilter !== "status" && activeFilters.status !== "all" && (visit.rawStatus || visit.status) !== activeFilters.status)
        return false;
      if (omitFilter !== "signOffStatus" && activeFilters.signOffStatus !== "all") {
        const signOffValue = (visit.signOffValue || "").trim().toLowerCase();

        if (activeFilters.signOffStatus === "gate" && !signOffValue.includes("gate")) {
          return false;
        }
        if (activeFilters.signOffStatus === "locks" && !signOffValue.includes("lock")) {
          return false;
        }
        if (activeFilters.signOffStatus === "service" && !signOffValue.includes("service")) {
          return false;
        }
      }
      return true;
    });

  const buildCountOptions = (
    visits: VisitRecord[],
    getValues: (visit: VisitRecord) => string | string[],
  ): FilterOption[] => {
    const counts = new Map<string, number>();

    visits.forEach((visit) => {
      const rawValues = getValues(visit);
      const values = Array.isArray(rawValues) ? rawValues : [rawValues];

      values.forEach((value) => {
        const normalized = value?.trim();
        if (!normalized) return;
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  };

  const mapAuthErrorCode = (code: string) => {
    switch (code) {
      case "NO_TOKEN":
        return "No token received from Google sign-in.";
      case "INVALID_TOKEN":
        return "Google token is invalid. Please sign in again.";
      case "INVALID_AUDIENCE":
        return "Google client ID mismatch. Check VITE_GOOGLE_CLIENT_ID.";
      case "EMAIL_NOT_VERIFIED":
        return "Your Google email is not verified.";
      case "SERVER_ERROR":
        return "Auth server error. Please try again.";
      default:
        return "You are not authorized to access this dashboard.";
    }
  };

  const verifyGoogleToken = useCallback(
    async (idToken: string) => {
      console.log("Fetching URL:", authScriptUrl);
      const response = await fetch(authScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ token: idToken }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Auth HTTP ${response.status}`);
      }

      return (await response.text()).trim();
    },
    [authScriptUrl],
  );

  useEffect(() => {
    console.log("Auth state changed:", { isAuthenticated, loading: authLoading });
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const googleWindow = window as WindowWithGoogle;

    if (authLoading) {
      console.log("Google OAuth init deferred: auth is still loading");
      return;
    }

    if (!googleClientId || !authScriptUrl) {
      setAuthError(
        "Google auth config missing. Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_AUTH_SCRIPT_URL in .env.",
      );
      return;
    }

    if (isAuthenticated) {
      console.log("Google OAuth init skipped: user is already authenticated");
      return;
    }

    let effectActive = true;

    const initGoogleSignIn = () => {
      if (!effectActive) return;

      const idApi = googleWindow.google?.accounts?.id;
      if (!idApi) {
        setAuthError("Google Identity script failed to initialize.");
        return;
      }

      if (!googleIdentityInitializedRef.current) {
        console.log("google.accounts.id.initialize()");
        googleIdentityInitializedRef.current = true;
        idApi.initialize({
          client_id: googleClientId,
          callback: async (response: GoogleCredentialResponse) => {
            const token = response.credential;
            if (!token) {
              setAuthError("Google sign-in did not return a credential.");
              return;
            }

            setIsVerifying(true);
            setAuthError(null);

            try {
              const authResult = await verifyGoogleToken(token);

              if (authResult === "AUTHORIZED") {
                console.log("Google auth authorized; updating auth context");
                login(token); // Update context with token
                setAuthError(null);
                return;
              }

              if (authResult.startsWith("UNAUTHORIZED|")) {
                const email = authResult.split("|")[1] || "";
                setAuthEmail(email);
                setAuthError(`Unauthorized email: ${email}`);
                setIsVerifying(false);
                return;
              }

              setAuthError(mapAuthErrorCode(authResult));
              setIsVerifying(false);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unknown auth error";
              setAuthError(`Authentication failed: ${message}`);
            } finally {
              setIsVerifying(false);
            }
          },
        });
      } else {
        console.log("google.accounts.id.initialize() skipped: already initialized");
      }

      if (signInButtonRef.current) {
        signInButtonRef.current.innerHTML = "";
        idApi.renderButton(signInButtonRef.current, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 300,
        });
      }
    };

    const existingScript = document.querySelector(
      'script[data-google-identity="true"]',
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (googleWindow.google?.accounts?.id) {
        initGoogleSignIn();
      } else {
        existingScript.addEventListener("load", initGoogleSignIn, {
          once: true,
        });
      }
    } else {
      const script = document.createElement("script");
      script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = initGoogleSignIn;
      script.onerror = () => {
        if (!effectActive) return;
        setAuthError("Failed to load Google Identity Services script.");
      };
      document.head.appendChild(script);
    }

    return () => {
      effectActive = false;
    };
  }, [authLoading, authScriptUrl, googleClientId, verifyGoogleToken, isAuthenticated, login]);

  const handleSignOut = () => {
    const googleWindow = window as WindowWithGoogle;
    googleWindow.google?.accounts?.id?.disableAutoSelect();
    logout();
    setAuthEmail("");
    setAllVisits([]);
  };

  useEffect(() => {
    console.log("Sheet load effect state:", {
      authLoading,
      isAuthenticated,
      sheetIdConfigured: Boolean(sheetId),
      sheetName,
      lastUpdated: lastUpdated?.toISOString() ?? null,
    });

    if (authLoading) {
      console.log("Sheet fetch blocked: auth is still loading");
      return;
    }

    if (!isAuthenticated) {
      console.log("Sheet fetch blocked: user is not authenticated");
      return;
    }

    if (!sheetId) {
      setLoadError(
        "Google Sheet ID is not set. Add VITE_GOOGLE_SHEET_ID in .env.",
      );
      setAllVisits([]);
      return;
    }

    let mounted = true;
    let latestRequestId = 0;
    let isRequestInFlight = false;
    let pollTimerId: number | undefined;

    async function loadSheetData(isBackgroundRefresh = false) {
      if (isRequestInFlight) {
        console.log("Sheet fetch skipped: request already in flight");
        return;
      }
      isRequestInFlight = true;
      const requestId = ++latestRequestId;
      console.log("Fetch Started", {
        requestId,
        isBackgroundRefresh,
        sheetName,
      });
      if (!isBackgroundRefresh) {
        setIsLoadingData(true);
      }
      setLoadError(null);

      try {
        const rows = await fetchVisitsFromGoogleSheet(
          sheetId,
          sheetName,
        );
        if (!mounted || requestId !== latestRequestId) return;

        const validRows = rows.filter(hasRequiredVisitFields);

        if (validRows.length === 0) {
          setLoadError(
            "Google Sheet has no valid rows. A visit is counted only when both Sr. No. and Zone have data.",
          );
          setAllVisits([]);
          return;
        }

        setAllVisits(validRows);
        setLastUpdated(new Date());
        localStorage.setItem("dashboard_cache", JSON.stringify(validRows));
        localStorage.setItem("dashboard_cache_time", new Date().toISOString());
        console.log("Data loaded", validRows.length);
      } catch (error) {
        if (!mounted || requestId !== latestRequestId) return;
        const message =
          error instanceof Error ? error.message : "Unknown fetch error";
        setLoadError(
          `Could not load Google Sheet data (${message}).`,
        );
        if (!isBackgroundRefresh) {
          setAllVisits([]);
        }
      } finally {
        isRequestInFlight = false;
        console.log("Sheet fetch finished:", {
          requestId,
          isBackgroundRefresh,
        });
        if (mounted && requestId === latestRequestId) {
          setIsLoadingData(false);
        }
      }
    }

    const cachedAt = lastUpdated?.getTime() ?? 0;
    const hasFreshCache = cachedAt > 0 && Date.now() - cachedAt < SHEET_CACHE_TTL_MS;

    if (!hasFreshCache) {
      void loadSheetData();
    }

    pollTimerId = window.setInterval(() => {
      if (document.hidden) return;
      void loadSheetData(true);
    }, BACKGROUND_REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      latestRequestId += 1;
      if (pollTimerId) {
        window.clearInterval(pollTimerId);
      }
    };
  }, [authLoading, isAuthenticated, sheetId, sheetName, lastUpdated]);

  // Extract unique values for filters
  const zones = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "zone"), (v) => v.zone),
    [allVisits, filters, dateRange],
  );
  const states = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "state"), (v) => v.state),
    [allVisits, filters, dateRange],
  );
  const sites = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "site"), (v) => v.siteName),
    [allVisits, filters, dateRange],
  );
  const siteTypes = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "siteType"), (v) => v.siteType),
    [allVisits, filters, dateRange],
  );
  const visitPurposes = useMemo(
    () =>
      buildCountOptions(
        filterVisitRecords(allVisits, filters, dateRange, "visitType"),
        (v) => splitVisitPurposes(v.visitType),
      ),
    [allVisits, filters, dateRange],
  );
  const visitorTypes = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "visitorType"), (v) => v.visitorType),
    [allVisits, filters, dateRange],
  );
  const vendors = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "vendor"), (v) => v.vendorName),
    [allVisits, filters, dateRange],
  );
  const statuses = useMemo(
    () => buildCountOptions(filterVisitRecords(allVisits, filters, dateRange, "status"), (v) => v.rawStatus || v.status),
    [allVisits, filters, dateRange],
  );
  const statusCounts = useMemo(
    () =>
      allVisits.reduce((acc, visit) => {
        const status = (visit.rawStatus || visit.status || "").trim();
        if (!status) return acc;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [allVisits],
  );
  const statusTotals = useMemo(
    () => ({
      partiallyCompleted: statusCounts["Partially Completed"] || 0,
      rejectedByWhManager: statusCounts["Rejected By WH Manager"] || 0,
      visitorNotVisited: statusCounts["Visitor Not Visited"] || 0,
      reputedCompleted:
        statusCounts["Reputed Completed"] ||
        statusCounts["Reputed* Completed"] ||
        0,
    }),
    [statusCounts],
  );

  useEffect(() => {
    if (filters.site === "all") return;
    if (sites.some((site) => site.value === filters.site)) return;
    setFilters((prev) => ({ ...prev, site: "all" }));
  }, [filters.site, sites]);

  const activeFilterBadges = useMemo(() => {
    const badges: Array<{ label: string; value: string }> = [];

    if (filters.zone !== "all") badges.push({ label: "Zone", value: filters.zone });
    if (filters.site !== "all") badges.push({ label: "Site", value: filters.site });
    if (filters.state !== "all") badges.push({ label: "State", value: filters.state });
    if (filters.siteType !== "all") badges.push({ label: "Site Type", value: filters.siteType });
    if (filters.visitType !== "all") badges.push({ label: "Purpose", value: filters.visitType });
    if (filters.visitorType !== "all") badges.push({ label: "Visitor Type", value: filters.visitorType });
    if (filters.vendor !== "all") badges.push({ label: "Vendor", value: filters.vendor });
    if (filters.status !== "all") badges.push({ label: "Status", value: filters.status });
    if (filters.signOffStatus !== "all") badges.push({ label: "Sign Off", value: filters.signOffStatus });
    if (dateRange.from || dateRange.to) {
      const from = dateRange.from ? format(dateRange.from, "dd MMM yyyy") : "Start";
      const to = dateRange.to ? format(dateRange.to, "dd MMM yyyy") : "Today";
      badges.push({ label: "Date", value: `${from} - ${to}` });
    }

    return badges;
  }, [filters, dateRange]);

  const clearAllFilters = useCallback(() => {
    setFilters(emptyFilters);
    setDateRange({ from: null, to: null });
  }, []);

  // Apply base filters - Fast O(n) single pass with date filtering
  const baseFilteredVisits = useMemo(() => {
    return filterVisitRecords(allVisits, filters, dateRange);
  }, [allVisits, filters, dateRange]);

  const filteredVisits = baseFilteredVisits;

  // Calculate KPIs
  const totalVisits = filteredVisits.length;
  const completedVisits = filteredVisits.filter(
    (v) => v.status === "Completed",
  ).length;
  const rejectedVisits = filteredVisits.filter(
    (v) => v.status === "Rejected",
  ).length;
  const totalRevenue = filteredVisits.reduce(
    (sum, v) => sum + v.visitorCharges,
    0,
  );

  const signOffCategoryCounts = useMemo(() => {
    return baseFilteredVisits.reduce(
      (acc, visit) => {
        const value = (visit.signOffValue || "").trim().toLowerCase();
        if (!value) return acc;

        if (value.includes("gate")) {
          acc.gate += 1;
        }
        if (value.includes("lock")) {
          acc.locks += 1;
        }
        if (value.includes("service")) {
          acc.service += 1;
        }

        return acc;
      },
      { gate: 0, locks: 0, service: 0 },
    );
  }, [baseFilteredVisits]);

  const today = new Date();
  const todayVisits = filteredVisits.filter((v) =>
    isSameDate(v.dateOfVisit, today),
  );
  const todayCompletedVisits = todayVisits.filter(
    (v) => v.status === "Completed",
  );
  const todayCompleted = todayVisits.filter(
    (v) => v.status === "Completed",
  ).length;
  const todayDialogRows =
    todayDialogMode === "completed"
      ? todayCompletedVisits
      : todayVisits;

  const signOffDialogRows = useMemo(
    () =>
      baseFilteredVisits.filter((visit) => {
        const value = (visit.signOffValue || "").trim().toLowerCase();
        if (!value) return false;

        if (signOffDialogCategory === "gate") {
          return value.includes("gate");
        }

        if (signOffDialogCategory === "locks") {
          return value.includes("lock");
        }

        return value.includes("service");
      }),
    [baseFilteredVisits, signOffDialogCategory],
  );

  const todayDialogTitle =
    todayDialogMode === "completed"
      ? "Today Completed Visits"
      : "Today Visits";

  const openTodayDialog = (mode: TodayDialogMode) => {
    setTodayDialogMode(mode);
    setIsTodayDialogOpen(true);
  };

  const openStatusList = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
    setActiveTab("data");
  };

  const openSignOffCategoryList = (category: SignOffCategory) => {
    setSignOffDialogCategory(category);
    setIsSignOffDialogOpen(true);
  };

  const openStatusSummaryList = (status: string) => {
    setStatusSummaryDialogStatus(status);
    setIsStatusSummaryDialogOpen(true);
  };

  const openKpiList = (mode: KpiDialogMode) => {
    setKpiDialogMode(mode);
    setIsKpiDialogOpen(true);
  };

  const kpiDialogRows = useMemo(() => {
    if (kpiDialogMode === "completed") {
      return filteredVisits.filter((visit) => visit.status === "Completed");
    }

    if (kpiDialogMode === "rejected") {
      return filteredVisits.filter((visit) => visit.status === "Rejected");
    }

    if (kpiDialogMode === "revenue") {
      return filteredVisits.filter((visit) => visit.visitorCharges > 0);
    }

    return filteredVisits;
  }, [filteredVisits, kpiDialogMode]);

  const kpiDialogTitle =
    kpiDialogMode === "completed"
      ? "Completed Records"
      : kpiDialogMode === "rejected"
        ? "Rejected Records"
        : kpiDialogMode === "revenue"
          ? "Revenue Records"
          : "All Visit Records";

  const statusSummaryDialogRows = useMemo(
    () =>
      baseFilteredVisits.filter(
        (visit) => (visit.rawStatus || visit.status || "").trim() === statusSummaryDialogStatus,
      ),
    [baseFilteredVisits, statusSummaryDialogStatus],
  );

  const lazyFallback = (
    <div className="rounded-xl border border-cyan-500/20 bg-gray-900/50 p-6 text-sm text-cyan-200 shadow-xl backdrop-blur-xl">
      Loading section...
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 text-white">
        <main className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-700/50 bg-slate-900/55 p-8 shadow-2xl backdrop-blur-2xl md:p-10 overflow-hidden">
          <div className="flex flex-col items-center py-6 animate-in fade-in duration-500">
             <h2 className="text-xl font-semibold">Restoring Session...</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 text-white">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-600/30 mix-blend-screen blur-[100px] animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-indigo-600/25 mix-blend-screen blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-600/25 mix-blend-screen blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <main className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-700/50 bg-slate-900/55 p-8 shadow-2xl backdrop-blur-2xl md:p-10 overflow-hidden">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />

          {isVerifying ? (
            <div className="flex flex-col items-center py-6 animate-in fade-in duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-blue-500/40 bg-slate-800 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <Fingerprint className="h-10 w-10 text-blue-300 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl font-semibold">Authenticating</h2>
              <div className="relative mt-2 flex h-6 w-full items-center justify-center overflow-hidden">
                <p key={loadingStep} className="text-sm font-medium text-blue-300 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  {GOOGLE_LOADING_PHRASES[loadingStep]}
                </p>
              </div>

              <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 shadow-inner">
                <Lock className="h-8 w-8 text-blue-300" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
              <p className="mt-2 text-center text-sm text-slate-300">
                Please sign in to continue to your dashboard.
              </p>

              <div className="mt-8 flex w-full items-center justify-center rounded-xl border border-slate-600/70 bg-white/95 py-3 shadow-xl">
                <div className="mr-3 text-black">
                  <GoogleIcon />
                </div>
                <div ref={signInButtonRef} className="min-h-10" />
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200">
                <ShieldCheck className="h-4 w-4" />
                Secure Google authentication enabled
              </div>

              {authError && (
                <div className="mt-5 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {authError}
                </div>
              )}

              {authEmail && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Attempted account: {authEmail}
                </p>
              )}

              <p className="mt-7 text-center text-xs text-slate-500">
                By continuing, you agree to secure access verification.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <FloatingTopHeader
        isLoadingData={isLoadingData}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="relative mx-auto w-full max-w-[1360px] px-4 pb-6 pt-24 md:px-4 md:pt-24">
        <div className="space-y-4 md:space-y-5">
          {loadError && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {loadError}
            </div>
          )}

          {/* Page Navigation */}
          <div className="animate-fade-in flex gap-2 rounded-xl border border-blue-300/30 bg-slate-950/90 p-1 shadow-[0_12px_24px_rgba(2,6,23,0.45)]">
            <button
              onClick={() => setActivePage("dashboard")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activePage === "dashboard"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow shadow-cyan-500/30"
                  : "text-slate-300 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActivePage("service-analysis")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activePage === "service-analysis"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow shadow-cyan-500/30"
                  : "text-slate-300 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              🔧 Service Analysis
            </button>
          </div>

          {/* Dashboard Page */}
          {activePage === "dashboard" && (
            <>
          {/* Date Range Filter */}
          <div
            className="animate-fade-in relative overflow-hidden flex items-center gap-3 rounded-xl border border-cyan-300/25 bg-gradient-to-r from-slate-900/85 via-slate-900/80 to-blue-950/70 p-3.5 shadow-[0_18px_35px_rgba(2,6,23,0.55)] md:p-4"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/65 to-transparent" />
            <CalendarIcon className="h-5 w-5 text-cyan-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-200 mb-1">
                Date Range
              </h3>
              <p className="text-xs text-gray-400">
                Filter visits by date period
              </p>
            </div>
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Filters */}
          <div
            className="animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <DashboardFilters
              filters={filters}
              onFilterChange={setFilters}
              zones={zones}
              states={states}
              sites={sites}
              siteTypes={siteTypes}
              visitPurposes={visitPurposes}
              visitorTypes={visitorTypes}
              vendors={vendors}
              statuses={statuses}
              activeBadges={activeFilterBadges}
              hasExternalFilters={Boolean(dateRange.from || dateRange.to)}
              onClearAll={clearAllFilters}
            />
          </div>

          <div className="space-y-4 md:space-y-5">
            {/* KPIs */}
            <div className="animate-fade-in">
              <KPICards
                totalVisits={totalVisits}
                completedCount={completedVisits}
                rejectedCount={rejectedVisits}
                totalRevenue={totalRevenue}
                onTotalVisitsClick={() => openKpiList("all")}
                onCompletedClick={() => openKpiList("completed")}
                onRejectedClick={() => openKpiList("rejected")}
                onRevenueClick={() => openKpiList("revenue")}
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.03s" }}>
              <WorkflowBoard
                lockImageUrl={LOCK_IMAGE_URL}
                cwcImageUrl={CWC_IMAGE_URL}
                lynkitLabel="Lynkit"
                todayVisits={todayVisits.length}
                todayCompleted={todayCompleted}
               
                partiallyCompleted={statusTotals.partiallyCompleted}
                rejectedByWhManager={statusTotals.rejectedByWhManager}
                visitorNotVisited={statusTotals.visitorNotVisited}
                reputedCompleted={statusTotals.reputedCompleted}
                onTodayVisitsClick={() => openTodayDialog("all")}
                onTodayCompletedClick={() => openTodayDialog("completed")}
                onGateClick={() => openSignOffCategoryList("gate")}
                onLocksClick={() => openSignOffCategoryList("locks")}
                onServiceClick={() => openSignOffCategoryList("service")}
                onPartiallyCompletedClick={() => openStatusSummaryList("Partially Completed")}
                onRejectedByWhClick={() => openStatusSummaryList("Rejected By WH Manager")}
                onVisitorNotVisitedClick={() => openStatusSummaryList("Visitor Not Visited")}
                onReputedCompletedClick={() => openStatusSummaryList("Reputed Completed")}
              />
            </div>
          </div>

          {/* Service Cycle Tracker Section */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CurrentDueServices
              visits={baseFilteredVisits}
              filters={filters}
              dateRange={dateRange}
            />
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid rounded-xl border border-blue-300/30 bg-slate-950/90 p-1 shadow-[0_12px_24px_rgba(2,6,23,0.45)]">
              <TabsTrigger
                value="overview"
                className="text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:shadow-cyan-500/30"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:shadow-cyan-500/30"
              >
                Deep Analytics
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:shadow-cyan-500/30"
              >
                Financial Analytics
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=active]:shadow-cyan-500/30"
              >
                Detailed Data
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <VisitClassificationAnalytics visits={filteredVisits} />

              {/* Charts Grid */}
              <div className="grid gap-6 xl:grid-cols-2">
                <StatusChart
                  visits={filteredVisits}
                  onStatusClick={openStatusList}
                />
                <RevenueTrendChart visits={filteredVisits} />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <VisitTypeSplit visits={filteredVisits} />

              </div>
            </TabsContent>

            {/* Deep Analytics Tab */}
            <TabsContent
              value="analytics"
              className="space-y-6"
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <RevenueTrendChart visits={filteredVisits} />
                  <div className="grid gap-6 xl:grid-cols-2">
                    <StatusChart
                      visits={filteredVisits}
                      onStatusClick={openStatusList}
                    />
                    <VisitTypeSplit visits={filteredVisits} />
                  </div>
                  <VisitClassificationAnalytics visits={filteredVisits} />
                </div>

                <div className="space-y-6">
                  <Suspense fallback={lazyFallback}>
                    <ReportExport
                      visits={filteredVisits}
                      filteredCount={totalVisits}
                      totalCount={allVisits.length}
                    />
                  </Suspense>
                  <TimeAnalysis visits={filteredVisits} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <VendorPerformance visits={filteredVisits} />
                <CostAnalysis visits={filteredVisits} />
              </div>
            </TabsContent>

            {/* Financial Analytics Tab */}
            <TabsContent value="financial" className="space-y-6">
              <Suspense fallback={lazyFallback}>
                <ExpenseAnalytics visits={filteredVisits} />
              </Suspense>
            </TabsContent>

            {/* Detailed Data Tab */}
            <TabsContent value="data" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 shadow-2xl p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-200">
                        All Site Visits
                      </h2>
                      <p className="text-sm text-gray-400">
                        Complete detailed records with sorting
                        and search
                      </p>
                    </div>
                    <Suspense fallback={lazyFallback}>
                      <DetailedTable visits={filteredVisits} />
                    </Suspense>
                  </div>
                </div>

                <div className="space-y-6">
                  <Suspense fallback={lazyFallback}>
                    <ReportExport
                      visits={filteredVisits}
                      filteredCount={totalVisits}
                      totalCount={allVisits.length}
                    />
                  </Suspense>
  
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Dedicated Operations Command Center */}
          <div className="mt-12 pt-8 border-t border-gray-800/50 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <ErrorBoundary fallback={<div className="p-4 border border-rose-500/50 bg-rose-500/10 text-rose-300 rounded-lg">Service Operations Analytics failed to load. Please check console for errors.</div>}>
              <Suspense fallback={lazyFallback}>
                <ServiceOperationsAnalytics visits={filteredVisits} />
              </Suspense>
            </ErrorBoundary>
          </div>
            </>
          )}

          {/* Service Analysis Page */}
          {activePage === "service-analysis" && (
            <Suspense fallback={lazyFallback}>
              <ServiceAnalysis visits={filteredVisits} />
            </Suspense>
          )}

        </div>
      </main>

      {/* Enhanced Styles */}
      <Dialog open={isTodayDialogOpen} onOpenChange={setIsTodayDialogOpen}>
        <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-screen w-screen max-w-none rounded-none border-gray-700 bg-gray-950 text-gray-100 p-4 sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>{todayDialogTitle}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Showing records for {format(today, "dd MMM yyyy")} based on current filters.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[calc(100vh-140px)] overflow-auto rounded-lg border border-gray-800">
            <Table className="table-fixed text-xs">
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="w-[70px] whitespace-normal text-gray-300">Sr. No.</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Zone</TableHead>
                  <TableHead className="w-[140px] whitespace-normal text-gray-300">State</TableHead>
                  <TableHead className="w-[210px] whitespace-normal text-gray-300">Site Name</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Visit Type</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Visitor Type</TableHead>
                  <TableHead className="w-[150px] whitespace-normal text-gray-300">Vendor</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Status</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Sign Off</TableHead>
                  <TableHead className="w-[90px] whitespace-normal text-right text-gray-300">Charges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayDialogRows.length === 0 ? (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                      No records found for today.
                    </TableCell>
                  </TableRow>
                ) : (
                  todayDialogRows.map((visit) => (
                    <TableRow key={visit.id} className="border-gray-800">
                      <TableCell className="whitespace-normal break-words">{visit.srNo}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.zone}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.state}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.siteName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitorType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.vendorName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.status}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.signOffValue || (visit.signOffReceived ? "Yes" : "No")}</TableCell>
                      <TableCell className="whitespace-normal text-right break-words">₹{visit.visitorCharges.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignOffDialogOpen} onOpenChange={setIsSignOffDialogOpen}>
        <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-screen w-screen max-w-none rounded-none border-gray-700 bg-gray-950 text-gray-100 p-4 sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {signOffDialogCategory.charAt(0).toUpperCase() + signOffDialogCategory.slice(1)} Records
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Showing {signOffDialogRows.length} records for {signOffDialogCategory} based on current filters.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[calc(100vh-140px)] overflow-auto rounded-lg border border-gray-800">
            <Table className="table-fixed text-xs">
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="w-[70px] whitespace-normal text-gray-300">Sr. No.</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Zone</TableHead>
                  <TableHead className="w-[140px] whitespace-normal text-gray-300">State</TableHead>
                  <TableHead className="w-[210px] whitespace-normal text-gray-300">Site Name</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Visit Type</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Visitor Type</TableHead>
                  <TableHead className="w-[150px] whitespace-normal text-gray-300">Vendor</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Status</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Sign Off</TableHead>
                  <TableHead className="w-[90px] whitespace-normal text-right text-gray-300">Charges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signOffDialogRows.length === 0 ? (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={10} className="py-8 text-center text-gray-400">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  signOffDialogRows.map((visit) => (
                    <TableRow key={visit.id} className="border-gray-800">
                      <TableCell className="whitespace-normal break-words">{visit.srNo}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.zone}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.state}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.siteName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitorType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.vendorName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.status}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.signOffValue || (visit.signOffReceived ? "Yes" : "No")}</TableCell>
                      <TableCell className="whitespace-normal text-right break-words">₹{visit.visitorCharges.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isStatusSummaryDialogOpen}
        onOpenChange={setIsStatusSummaryDialogOpen}
      >
        <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-screen w-screen max-w-none rounded-none border-gray-700 bg-gray-950 text-gray-100 p-4 sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>{statusSummaryDialogStatus} Records</DialogTitle>
            <DialogDescription className="text-gray-400">
              Showing {statusSummaryDialogRows.length} records for {statusSummaryDialogStatus} based on current filters.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[calc(100vh-140px)] overflow-auto rounded-lg border border-gray-800">
            <Table className="table-fixed text-xs">
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="w-[70px] whitespace-normal text-gray-300">Sr. No.</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Zone</TableHead>
                  <TableHead className="w-[140px] whitespace-normal text-gray-300">State</TableHead>
                  <TableHead className="w-[210px] whitespace-normal text-gray-300">Site Name</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Visit Type</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Visitor Type</TableHead>
                  <TableHead className="w-[150px] whitespace-normal text-gray-300">Vendor</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Status</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Sign Off</TableHead>
                  <TableHead className="w-[90px] whitespace-normal text-right text-gray-300">Charges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusSummaryDialogRows.length === 0 ? (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={10} className="py-8 text-center text-gray-400">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  statusSummaryDialogRows.map((visit) => (
                    <TableRow key={visit.id} className="border-gray-800">
                      <TableCell className="whitespace-normal break-words">{visit.srNo}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.zone}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.state}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.siteName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitorType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.vendorName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.rawStatus || visit.status}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.signOffValue || (visit.signOffReceived ? "Yes" : "No")}</TableCell>
                      <TableCell className="whitespace-normal text-right break-words">₹{visit.visitorCharges.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isKpiDialogOpen} onOpenChange={setIsKpiDialogOpen}>
        <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-screen w-screen max-w-none rounded-none border-gray-700 bg-gray-950 text-gray-100 p-4 sm:max-w-none sm:p-6">
          <DialogHeader>
            <DialogTitle>{kpiDialogTitle}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Showing {kpiDialogRows.length} records based on current filters.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[calc(100vh-140px)] overflow-auto rounded-lg border border-gray-800">
            <Table className="table-fixed text-xs">
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="w-[70px] whitespace-normal text-gray-300">Sr. No.</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Zone</TableHead>
                  <TableHead className="w-[140px] whitespace-normal text-gray-300">State</TableHead>
                  <TableHead className="w-[210px] whitespace-normal text-gray-300">Site Name</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Visit Type</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Visitor Type</TableHead>
                  <TableHead className="w-[150px] whitespace-normal text-gray-300">Vendor</TableHead>
                  <TableHead className="w-[120px] whitespace-normal text-gray-300">Status</TableHead>
                  <TableHead className="w-[110px] whitespace-normal text-gray-300">Sign Off</TableHead>
                  <TableHead className="w-[90px] whitespace-normal text-right text-gray-300">Charges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiDialogRows.length === 0 ? (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={10} className="py-8 text-center text-gray-400">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  kpiDialogRows.map((visit) => (
                    <TableRow key={visit.id} className="border-gray-800">
                      <TableCell className="whitespace-normal break-words">{visit.srNo}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.zone}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.state}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.siteName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.visitorType}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.vendorName}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.rawStatus || visit.status}</TableCell>
                      <TableCell className="whitespace-normal break-words">{visit.signOffValue || (visit.signOffReceived ? "Yes" : "No")}</TableCell>
                      <TableCell className="whitespace-normal text-right break-words">₹{visit.visitorCharges.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @media print {
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          button {
            display: none !important;
          }
          
          header {
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}
