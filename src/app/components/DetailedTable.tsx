import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";
import { VisitRecord } from "../types/visit";
import { format } from "date-fns";

interface DetailedTableProps {
  visits: VisitRecord[];
}

type SortField = keyof VisitRecord | null;
type SortDirection = "asc" | "desc";

export function DetailedTable({ visits }: DetailedTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const buildSearchBlob = (visit: VisitRecord) => {
    const dateLabel = format(visit.dateOfVisit, "dd MMM yyyy");
    const signOffLabel = (
      visit.signOffValue || (visit.signOffReceived ? "Yes" : "No")
    ).toLowerCase();

    return [
      visit.id,
      visit.srNo,
      visit.zone,
      visit.state,
      visit.siteName,
      visit.siteType,
      visit.ticketIds,
      dateLabel,
      visit.visitType,
      visit.cycle || "",
      visit.visitorType,
      visit.vendorName,
      visit.visitorName,
      visit.visitorContact,
      visit.status,
      signOffLabel,
      visit.signOffNotes,
      visit.visitorCharges,
      visit.procurementAmount,
      visit.procurementType,
    ]
      .join(" ")
      .toLowerCase();
  };

  // Filter visits
  const filteredVisits = visits.filter((visit) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const terms = query.split(/\s+/).filter(Boolean);
    const blob = buildSearchBlob(visit);
    return terms.every((term) => blob.includes(term));
  });

  // Sort visits
  const sortedVisits = [...filteredVisits].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc" 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    return sortDirection === "asc" 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" /> 
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search anything: zone, state, site, date, purpose, visitor, vendor, status, contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800/50 border-gray-700 text-gray-200 placeholder:text-gray-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 shadow-xl overflow-hidden max-h-[70vh] overflow-auto">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="bg-gray-800/90 border-gray-700 hover:bg-gray-800/90">
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 font-semibold text-gray-300">Sr. No.</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("zone")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Zone
                    <SortIcon field="zone" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("state")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    State
                    <SortIcon field="state" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("siteName")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Site Name
                    <SortIcon field="siteName" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("dateOfVisit")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Date
                    <SortIcon field="dateOfVisit" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-gray-300">Visit Purpose</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-gray-300">Cycle</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("vendorName")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Vendor
                    <SortIcon field="vendorName" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-gray-300">Visitor</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-gray-300">Contact</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("status")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Status
                    <SortIcon field="status" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-gray-300">Sign Off</TableHead>
                <TableHead className="sticky top-0 z-10 bg-gray-800/95 text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("visitorCharges")}
                    className="h-8 px-2 hover:bg-gray-700/50 font-semibold text-gray-300"
                  >
                    Charges
                    <SortIcon field="visitorCharges" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-gray-500">
                    No visits found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedVisits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-gray-800/30 border-gray-800">
                    <TableCell className="font-medium text-gray-300">{visit.srNo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {visit.zone}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{visit.state}</TableCell>
                    <TableCell className="font-medium text-gray-200">{visit.siteName}</TableCell>
                    <TableCell className="text-gray-400">{format(visit.dateOfVisit, "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          visit.visitType === "Q"
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : visit.visitType === "HY"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }
                      >
                        {visit.visitType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {visit.cycle || "-"}
                    </TableCell>
                    <TableCell className="text-gray-300">{visit.vendorName}</TableCell>
                    <TableCell className="text-gray-300">{visit.visitorName}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{visit.visitorContact}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          visit.status === "Completed"
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : visit.status === "Partial"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : visit.status === "Rejected"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                        }
                      >
                        {visit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(visit.signOffValue || "").toLowerCase() === "yes" ||
                      (visit.signOffValue || "") === "✓ Received" ||
                      (visit.signOffValue || "").toLowerCase().includes("received") ||
                      (!visit.signOffValue && visit.signOffReceived) ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          {visit.signOffValue || "Yes"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-600">
                          {visit.signOffValue || "No"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-200">
                      {visit.visitorCharges > 0 ? `₹${visit.visitorCharges.toLocaleString()}` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-400">
          Showing <span className="font-semibold text-gray-200">{sortedVisits.length}</span> of{" "}
          <span className="font-semibold text-gray-200">{visits.length}</span> visits
        </p>
      </div>
    </div>
  );
}