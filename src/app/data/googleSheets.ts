import { VisitRecord, Cycle } from "../types/visit";

type SheetRow = {
  id?: string;
  srNo?: string | number;
  zone?: string;
  state?: string;
  siteName?: string;
  siteType?: string;
  ticketIds?: string;
  dateOfVisit?: string | number | Date;
  visitType?: string;
  cycle?: string;
  visitorType?: string;
  vendorName?: string;
  visitorName?: string;
  visitorContact?: string;
  status?: string;
  signOffReceived?: string | boolean;
  signOffNotes?: string;
  visitorCharges?: string | number;
  procurementAmount?: string | number;
  procurementType?: string;
};

type GvizCell = {
  v?: string | number | boolean | null;
  f?: string;
};

type GvizResponse = {
  status?: string;
  table?: {
    cols?: Array<{ label?: string }>;
    rows?: Array<{ c?: Array<GvizCell | null> }>;
  };
};

type SheetApiResponse = {
  data?: Array<Record<string, unknown>>;
};

const VALID_CYCLES: Cycle[] = [
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "Q5",
  "Q6",
  "Q7",
  "Q8",
  "HY1",
  "HY2",
  "HY3",
  "HY4",
  "HY5",
  "HY6",
  "HY7",
  "HY8",
  "HY9",
  "HY10",
];

const HEADER_ALIAS_MAP: Record<string, keyof SheetRow> = {
  id: "id",
  srno: "srNo",
  sno: "srNo",
  zone: "zone",
  state: "state",
  sitename: "siteName",
  sitetype: "siteType",
  ticketids: "ticketIds",
  ticketid: "ticketIds",
  dateofvisit: "dateOfVisit",
  visitpurpose: "visitType",
  visittype: "visitType",
  cycle: "cycle",
  visitortype: "visitorType",
  vendorname: "vendorName",
  visitorname: "visitorName",
  visitorcontactnumber: "visitorContact",
  visitorcontact: "visitorContact",
  visitstatus: "status",
  status: "status",
  signoffreceivedstatus: "signOffReceived",
  signoffreceived: "signOffReceived",
  signoffnotes: "signOffNotes",
  visitorcharges: "visitorCharges",
  procurementamount: "procurementAmount",
  procurementtype: "procurementType",
};

const REQUIRED_SHEET_COLUMNS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
];

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveHeaderKey(rawLabel: string): keyof SheetRow | null {
  const normalized = normalizeHeader(rawLabel);
  return HEADER_ALIAS_MAP[normalized] ?? null;
}

function normalizeObjectRow(rawRow: Record<string, unknown>): SheetRow {
  const mapped: SheetRow = {};

  Object.entries(rawRow).forEach(([key, value]) => {
    const resolved = resolveHeaderKey(key);
    if (!resolved) return;
    mapped[resolved] = value as never;
  });

  return mapped;
}

function buildSheetEndpoint(sheetIdOrUrl: string, sheetName: string): string {
  const input = sheetIdOrUrl.trim();

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const sheetUrlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  const sheetId = sheetUrlMatch ? sheetUrlMatch[1] : input;

  const query = `select ${REQUIRED_SHEET_COLUMNS.join(",")}`;

  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(sheetName)}&tq=${encodeURIComponent(query)}`;
}

function parseNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("not received")) return false;
  if (normalized.includes("received")) return true;
  return ["true", "yes", "1", "y"].includes(normalized);
}

function normalizeSignOffValue(value: string | boolean | undefined): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const raw = (value || "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase();
  if (normalized.includes("not received") || normalized === "no") {
    return "No";
  }
  if (normalized.includes("received") || normalized === "yes") {
    return "Yes";
  }

  return raw;
}

function normalizeVisitStatus(value: string | undefined): string {
  const raw = (value || "").trim();
  if (!raw) return "Unknown";

  const compact = raw
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (compact === "completed") {
    return "Completed";
  }

  if (
    compact === "partial" ||
    compact === "partiallycompleted" ||
    compact === "partiallycomplete"
  ) {
    return "Partial";
  }

  if (compact === "rejected") {
    return "Rejected";
  }

  const hasVisitorLikeWord =
    compact.includes("visitor") || compact.includes("viistor");
  const hasNotWord = compact.includes("not");
  const hasVisitedLikeWord =
    compact.includes("visited") || compact.includes("visted") || compact.includes("vited");

  // Treat "Visitor Not Visited" variants (including common typos) as Rejected.
  if (hasVisitorLikeWord && hasNotWord && hasVisitedLikeWord) {
    return "Rejected";
  }

  return raw;
}

function parseCycle(value: string | undefined): Cycle | null {
  if (!value) return null;
  if (VALID_CYCLES.includes(value as Cycle)) return value as Cycle;
  return null;
}

function parseDate(value: string | number | Date | undefined): Date {
  if (!value) return new Date();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  if (typeof value === "number") {
    const numericDate = new Date(value);
    return Number.isNaN(numericDate.getTime()) ? new Date() : numericDate;
  }

  const trimmed = value.trim();

  const gvizDate = /^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/;
  const gvizDateMatch = trimmed.match(gvizDate);
  if (gvizDateMatch) {
    const year = Number(gvizDateMatch[1]);
    const month = Number(gvizDateMatch[2]);
    const day = Number(gvizDateMatch[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  // Supports sheet text values like "21-Jan-2026".
  const dmyMonthYear = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
  const dmyMatch = trimmed.match(dmyMonthYear);

  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const monthKey = dmyMatch[2].toLowerCase();
    const year = Number(dmyMatch[3]);

    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };

    if (monthKey in monthMap) {
      const parsed = new Date(year, monthMap[monthKey], day);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function unwrapGvizResponse(raw: string): GvizResponse {
  const prefix = "google.visualization.Query.setResponse(";
  const start = raw.indexOf(prefix);

  if (start === -1) {
    throw new Error("Unexpected Google Sheets response format");
  }

  const jsonStart = start + prefix.length;
  const jsonEnd = raw.lastIndexOf(");");

  if (jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("Invalid Google Sheets payload");
  }

  return JSON.parse(raw.slice(jsonStart, jsonEnd)) as GvizResponse;
}

function mapGvizToRows(payload: GvizResponse): SheetRow[] {
  if (payload.status !== "ok") {
    throw new Error("Google Sheets returned non-ok status");
  }

  const cols = payload.table?.cols ?? [];
  const rows = payload.table?.rows ?? [];

  return rows.map((row) => {
    const record: SheetRow = {};

    cols.forEach((col, i) => {
      const key = resolveHeaderKey((col.label || "").trim());
      if (!key) return;

      const cell = row.c?.[i] ?? null;
      if (!cell) {
        record[key] = "";
        return;
      }

      const rawValue = cell.f ?? cell.v;
      record[key] =
        rawValue === null || rawValue === undefined
          ? ""
          : (rawValue as never);
    });

    return record;
  });
}

function toVisitRecord(row: SheetRow, index: number): VisitRecord {
  const visitPurpose = (row.visitType || "Unknown").trim();
  const rawStatus = (row.status || "Unknown").trim();
  const visitStatus = normalizeVisitStatus(row.status);
  const signOffValue = normalizeSignOffValue(row.signOffReceived);

  return {
    id: row.id || `row-${index + 1}`,
    srNo: parseNumber(row.srNo),
    zone: row.zone || "Unknown",
    state: row.state || "Unknown",
    siteName: row.siteName || "Unknown",
    siteType: row.siteType || "",
    ticketIds: row.ticketIds || "",
    dateOfVisit: parseDate(row.dateOfVisit),
    visitType: visitPurpose,
    cycle: parseCycle(row.cycle),
    visitorType: (row.visitorType || "Unknown").trim(),
    vendorName: row.vendorName || "Others",
    visitorName: row.visitorName || "",
    visitorContact: row.visitorContact || "",
    rawStatus,
    status: visitStatus,
    signOffReceived: parseBoolean(row.signOffReceived),
    signOffValue,
    signOffNotes: row.signOffNotes || "",
    visitorCharges: parseNumber(row.visitorCharges),
    procurementAmount: parseNumber(row.procurementAmount),
    procurementType: row.procurementType || "",
  };
}

export async function fetchVisitsFromGoogleSheet(
  sheetIdOrUrl: string,
  sheetName = "Sheet1",
): Promise<VisitRecord[]> {
  const endpoint = buildSheetEndpoint(sheetIdOrUrl, sheetName);
  const retryDelays = [5000, 15000, 30000];
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      console.warn("sheet-fetch aborting after timeout:", endpoint);
      controller.abort();
    }, 120000); // Increased timeout to 120 seconds

    try {
      console.log("Fetching sheet data...");
      console.log("Fetching URL:", endpoint);
      console.time("sheet-fetch");
      const response = await fetch(endpoint, { signal: controller.signal });
      console.log(`Response status: ${response.status}`);
      console.log("Response URL:", response.url);
      console.log("Response redirected:", response.redirected);

      const raw = await response.text();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} while fetching sheet data from ${endpoint}; final URL: ${response.url}`,
        );
      }

      let records: VisitRecord[] = [];
      if (raw.includes("google.visualization.Query.setResponse(")) {
        const payload = unwrapGvizResponse(raw);
        const rows = mapGvizToRows(payload);
        records = rows.map(toVisitRecord);
      } else {
        const jsonPayload = JSON.parse(raw) as SheetApiResponse;
        const rows = (jsonPayload.data ?? []).map(normalizeObjectRow);
        records = rows.map(toVisitRecord);
      }
      
      console.log("Fetch successful");
      return records;
    } catch (error) {
      console.log("Fetch failed");
      console.log("First sheet-fetch failure reason:", error);
      console.error(error);
      
      if (attempt < retryDelays.length) {
        const waitTime = retryDelays[attempt];
        console.log("Retry URL unchanged:", endpoint);
        console.log(`Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
      } else {
        throw error;
      }
    } finally {
      console.timeEnd("sheet-fetch");
      window.clearTimeout(timeout);
    }
  }
}
