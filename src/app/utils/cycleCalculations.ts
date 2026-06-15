import { VisitRecord } from "../types/visit";

export function splitVisitPurposes(value: string) {
  if (!value) return [];
  return value
    .split(/[,&/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenizeVisitPurpose(value: string) {
  if (!value) return [];
  return value
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function visitPurposeHasCycle(visitPurpose: string, cycle: string) {
  const normalizedCycle = cycle.toUpperCase().trim();
  if (!normalizedCycle) return false;
  return tokenizeVisitPurpose(visitPurpose).includes(normalizedCycle);
}

export function isGateCycle(cycle: string) {
  return cycle.toUpperCase().startsWith("Q");
}

export function isLockCycle(cycle: string) {
  return cycle.toUpperCase().startsWith("HY");
}

export function isValidSiteType(siteType: string, cycle: string) {
  if (!siteType) return false;
  const typeUpper = siteType.toUpperCase();
  if (isGateCycle(cycle)) {
    return typeUpper.includes("GATE");
  }
  if (isLockCycle(cycle)) {
    return typeUpper.includes("LOCK");
  }
  return true;
}

export interface CycleCalculationResult {
  cycle: string;
  matchedRecords: VisitRecord[];
  uniqueSites: string[];
  totalSites: number;
  completedSitesCount: number;
}

export function calculateQuarterCompletion(
  visits: VisitRecord[],
  cycle: string,
  isDebug: boolean = false
): CycleCalculationResult {
  try {
    const matchedRecords: VisitRecord[] = [];
    const siteCompletionMap = new Map<string, boolean>();

    let rawRowsMatched = 0;

    const safeVisits = Array.isArray(visits) ? visits : [];

    safeVisits.forEach((visit) => {
      if (!visit) return;
      // Site Type validation
      if (!isValidSiteType(visit.siteType, cycle)) {
        return;
      }

      const tokenList = tokenizeVisitPurpose(visit.visitType);
      const matchedCycle = tokenList.includes(cycle.toUpperCase());

      if (isDebug) {
        console.log("Visit Purpose:", visit.visitType);
        console.log("Matched Cycle:", matchedCycle ? cycle : null);
        console.log("Token List:", tokenList);
      }

      if (matchedCycle) {
        rawRowsMatched++;
        matchedRecords.push(visit);

        const site = visit.siteName || "Unknown Site";
        const isCompleted = visit.status === "Completed" || visit.rawStatus === "Completed";
        
        // We want to track if a site has AT LEAST ONE completed visit for this cycle
        if (!siteCompletionMap.has(site)) {
          siteCompletionMap.set(site, isCompleted);
        } else if (isCompleted) {
          siteCompletionMap.set(site, true);
        }
      }
    });

    const uniqueSites = Array.from(siteCompletionMap.keys());
    const totalSites = uniqueSites.length;
    
    let completedSitesCount = 0;
    siteCompletionMap.forEach((isComp) => {
      if (isComp) completedSitesCount++;
    });

    const duplicatesRemoved = matchedRecords.length - totalSites;

    if (isDebug) {
      console.log(`--- [DEBUG] ${cycle} ---`);
      console.log(`Cycle: ${cycle}`);
      console.log(`Raw rows matched: ${rawRowsMatched}`);
      console.log(`Unique sites counted: ${totalSites} (Duplicates removed: ${duplicatesRemoved})`);
      console.log(`Final count (Completed): ${completedSitesCount}`);
      console.log(`Sites in ${cycle}:`, uniqueSites);
      console.log(`-----------------------`);
    }

    return {
      cycle,
      matchedRecords,
      uniqueSites,
      totalSites,
      completedSitesCount
    };
  } catch (error) {
    console.error(`[Error] calculateQuarterCompletion failed for cycle ${cycle}:`, error);
    return {
      cycle,
      matchedRecords: [],
      uniqueSites: [],
      totalSites: 0,
      completedSitesCount: 0
    };
  }
}
