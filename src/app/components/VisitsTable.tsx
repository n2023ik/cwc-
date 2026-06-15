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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

export interface VisitRecord {
  srNo: number;
  zone: string;
  state: string;
  siteName: string;
  siteType: string;
  ticketIds: string;
  dateOfVisit: string;
  visitPurpose: string;
  visitorType: string;
  vendorName: string;
  visitorName: string;
  visitorContact: string;
  visitStatus: string;
  signOffStatus: string;
  visitorCharges: number;
  procurementAmount: number;
  procurementType: string;
}

interface VisitsTableProps {
  visits: VisitRecord[];
}

type SortField = keyof VisitRecord | null;

export function VisitsTable({ visits }: VisitsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [visitorTypeFilter, setVisitorTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Get unique zones and visitor types for filters
  const zones = Array.from(new Set(visits.map((v) => v.zone)));
  const visitorTypes = Array.from(new Set(visits.map((v) => v.visitorType)));

  // Filter visits
  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.state.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesZone = zoneFilter === "all" || visit.zone === zoneFilter;
    const matchesVisitorType = visitorTypeFilter === "all" || visit.visitorType === visitorTypeFilter;

    return matchesSearch && matchesZone && matchesVisitorType;
  });

  // Sort visits
  const sortedVisits = [...filteredVisits].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === "asc") {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by site, visitor, vendor, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visitorTypeFilter} onValueChange={setVisitorTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {visitorTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Sr. No.</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("zone")}
                  className="h-8 px-2"
                >
                  Zone
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>State</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("dateOfVisit")}
                  className="h-8 px-2"
                >
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Visit Purpose</TableHead>
              <TableHead>Visitor Type</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Visitor Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sign Off</TableHead>
              <TableHead className="text-right">Charges</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-24 text-center">
                  No visits found.
                </TableCell>
              </TableRow>
            ) : (
              sortedVisits.map((visit) => (
                <TableRow key={visit.srNo}>
                  <TableCell className="font-medium">{visit.srNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{visit.zone}</Badge>
                  </TableCell>
                  <TableCell>{visit.state}</TableCell>
                  <TableCell className="font-medium">{visit.siteName}</TableCell>
                  <TableCell>{visit.dateOfVisit}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate">{visit.visitPurpose}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={visit.visitorType === "Vendor" ? "default" : "secondary"}
                    >
                      {visit.visitorType}
                    </Badge>
                  </TableCell>
                  <TableCell>{visit.vendorName}</TableCell>
                  <TableCell>{visit.visitorName}</TableCell>
                  <TableCell className="font-mono text-sm">{visit.visitorContact}</TableCell>
                  <TableCell>
                    <Badge
                      variant={visit.visitStatus === "Completed" ? "default" : "secondary"}
                      className={
                        visit.visitStatus === "Completed"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {visit.visitStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="truncate">{visit.signOffStatus}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {visit.visitorCharges > 0 ? `₹${visit.visitorCharges.toLocaleString()}` : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedVisits.length} of {visits.length} visits
      </div>
    </div>
  );
}
