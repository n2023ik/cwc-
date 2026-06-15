import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { VisitRecord } from "../types/visit";
import { format } from "date-fns";

interface ReportExportProps {
  visits: VisitRecord[];
  filteredCount: number;
  totalCount: number;
}

export function ReportExport({ visits, filteredCount, totalCount }: ReportExportProps) {
  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const splitVisitPurposes = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const normalizeLabel = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) return "Unknown";
    if (cleaned.toLowerCase() === "escelation visit") {
      return "Escalation Visit";
    }
    return cleaned;
  };

  const getSignOffText = (visit: VisitRecord) => {
    const raw = (visit.signOffValue || "").trim();
    if (raw) return raw;
    return visit.signOffReceived ? "Yes" : "No";
  };

  const exportToExcel = () => {
    const headers = [
      "Sr. No.",
      "Zone",
      "State",
      "Site Name",
      "Site Type",
      "Ticket IDs",
      "Date of Visit",
      "Visit Type",
      "Cycle",
      "Visitor Type",
      "Vendor Name",
      "Visitor Name",
      "Visitor Contact",
      "Status",
      "Sign Off Received",
      "Sign Off Notes",
      "Visitor Charges",
      "Procurement Amount",
      "Procurement Type",
    ];

    const rows = visits.map((v) => [
      v.srNo,
      v.zone,
      v.state,
      v.siteName,
      v.siteType,
      v.ticketIds,
      format(v.dateOfVisit, "dd-MMM-yyyy"),
      v.visitType,
      v.cycle || "",
      v.visitorType,
      v.vendorName,
      v.visitorName,
      v.visitorContact,
      v.status,
      getSignOffText(v),
      v.signOffNotes,
      v.visitorCharges,
      v.procurementAmount,
      v.procurementType,
    ]);

    const headerRow = `<tr>${headers
      .map(
        (header) =>
          `<th style="border:1px solid #d1d5db;padding:6px;background:#f3f4f6">${header}</th>`,
      )
      .join("")}</tr>`;

    const dataRows = rows
      .map(
        (row) =>
          `<tr>${row
            .map(
              (cell) =>
                `<td style="border:1px solid #e5e7eb;padding:6px">${String(cell ?? "")}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");

    const tableHtml = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">
            <thead>${headerRow}</thead>
            <tbody>${dataRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `site-visits-report-${format(new Date(), "yyyy-MM-dd")}.xls`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const totalRevenue = visits.reduce((sum, v) => sum + v.visitorCharges, 0);
    const completedCount = visits.filter((v) => v.status === "Completed").length;
    const totalCountForPercent = Math.max(visits.length, 1);
    const today = new Date();
    const todayVisits = visits.filter((v) => isSameDate(v.dateOfVisit, today));
    const todayRevenue = todayVisits.reduce((sum, v) => sum + v.visitorCharges, 0);
    const todayCompletedCount = todayVisits.filter((v) => v.status === "Completed").length;

    const statusCounts = Object.entries(
      visits.reduce((acc, visit) => {
        const key = normalizeLabel(visit.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    ).sort((a, b) => b[1] - a[1]);

    const maxStatusCount = Math.max(...statusCounts.map(([, count]) => count), 1);

    const visitPurposeCounts = Object.entries(
      visits.reduce((acc, visit) => {
        splitVisitPurposes(visit.visitType).forEach((purpose) => {
          const key = normalizeLabel(purpose);
          acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxPurposeCount = Math.max(...visitPurposeCounts.map(([, count]) => count), 1);

    const visitorTypeCounts = Object.entries(
      visits.reduce((acc, visit) => {
        const key = normalizeLabel(visit.visitorType);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxVisitorTypeCount = Math.max(
      ...visitorTypeCounts.map(([, count]) => count),
      1,
    );

    const zoneCounts = Object.entries(
      visits.reduce((acc, visit) => {
        const key = normalizeLabel(visit.zone);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxZoneCount = Math.max(...zoneCounts.map(([, count]) => count), 1);

    const renderGraphRows = (
      rows: Array<[string, number]>,
      maxCount: number,
      barClass: string,
    ) =>
      rows
        .map(([label, count]) => {
          const width = Math.max((count / maxCount) * 100, 4);
          const percentage = ((count / totalCountForPercent) * 100).toFixed(1);
          return `
            <div class="graph-row">
              <div class="graph-label">${label}</div>
              <div class="graph-track">
                <div class="graph-bar ${barClass}" style="width:${width}%"></div>
              </div>
              <div class="graph-value">${count} (${percentage}%)</div>
            </div>
          `;
        })
        .join("");

    const statusGraphHtml = renderGraphRows(
      statusCounts,
      maxStatusCount,
      "status",
    );
    const purposeGraphHtml = renderGraphRows(
      visitPurposeCounts,
      maxPurposeCount,
      "purpose",
    );
    const visitorTypeGraphHtml = renderGraphRows(
      visitorTypeCounts,
      maxVisitorTypeCount,
      "visitor",
    );
    const zoneGraphHtml = renderGraphRows(zoneCounts, maxZoneCount, "zone");

    const reportHtml = `
      <html>
        <head>
          <title>Site Visit Report</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            h2 { margin: 20px 0 10px; font-size: 16px; }
            p { margin: 0 0 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
            th { background: #f3f4f6; }
            tbody tr:nth-child(even) { background: #fafafa; }
            .graphs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0 18px; }
            .graph-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
            .graph-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
            .graph-row { display: grid; grid-template-columns: 150px 1fr 70px; gap: 8px; align-items: center; margin: 6px 0; }
            .graph-label { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .graph-track { height: 10px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
            .graph-bar { height: 100%; border-radius: 999px; }
            .graph-bar.status { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
            .graph-bar.purpose { background: linear-gradient(90deg, #10b981, #14b8a6); }
            .graph-bar.visitor { background: linear-gradient(90deg, #8b5cf6, #6366f1); }
            .graph-bar.zone { background: linear-gradient(90deg, #f59e0b, #ef4444); }
            .graph-value { text-align: right; font-size: 10px; font-weight: 700; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <h1>Site Visit Report</h1>
          <p>Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}</p>
          <p>Total Records: ${visits.length} | Completed: ${completedCount} | Revenue: ₹${totalRevenue.toLocaleString()}</p>
          <p>Today Visits: ${todayVisits.length} | Today Completed: ${todayCompletedCount} | Today Revenue: ₹${todayRevenue.toLocaleString()}</p>

          <div class="graphs">
            <div class="graph-card">
              <div class="graph-title">Status Graph</div>
              ${statusGraphHtml}
            </div>
            <div class="graph-card">
              <div class="graph-title">Visit Purpose Graph (Top 10)</div>
              ${purposeGraphHtml}
            </div>
            <div class="graph-card">
              <div class="graph-title">Visitor Type Graph (Top 10)</div>
              ${visitorTypeGraphHtml}
            </div>
            <div class="graph-card">
              <div class="graph-title">Zone Graph (Top 10)</div>
              ${zoneGraphHtml}
            </div>
          </div>

          <h2>Detailed Records (Current View)</h2>
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Zone</th>
                <th>State</th>
                <th>Site Name</th>
                <th>Date of Visit</th>
                <th>Visit Purpose</th>
                <th>Visitor Type</th>
                <th>Vendor Name</th>
                <th>Status</th>
                <th>Sign Off</th>
                <th>Charges</th>
              </tr>
            </thead>
            <tbody>
              ${visits.length === 0
                ? `<tr><td colspan="11">No records found for current filters.</td></tr>`
                : visits
                    .map(
                      (v) => `
                        <tr>
                          <td>${v.srNo}</td>
                          <td>${v.zone}</td>
                          <td>${v.state}</td>
                          <td>${v.siteName}</td>
                          <td>${format(v.dateOfVisit, "dd-MMM-yyyy")}</td>
                          <td>${v.visitType}</td>
                          <td>${v.visitorType}</td>
                          <td>${v.vendorName}</td>
                          <td>${v.status}</td>
                          <td>${getSignOffText(v)}</td>
                          <td>₹${v.visitorCharges.toLocaleString()}</td>
                        </tr>
                      `,
                    )
                    .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border-green-500/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <Download className="h-5 w-5 text-green-400" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400 mb-1">Report Ready</p>
          <p className="text-2xl font-bold text-white">{filteredCount} Records</p>
          {filteredCount !== totalCount && (
            <p className="text-xs text-gray-500 mt-1">Filtered from {totalCount} total</p>
          )}
        </div>

        <div className="grid gap-2">
          <Button
            onClick={exportToExcel}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white justify-start shadow-lg"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Excel Report
          </Button>

          <Button
            onClick={exportToPdf}
            variant="outline"
            className="w-full justify-start border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-gray-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF Report
          </Button>
        </div>

        <div className="bg-green-500/10 rounded-lg p-3 mt-2 border border-green-500/20">
          <p className="text-xs text-green-300 leading-relaxed">
            <strong>Tip:</strong> PDF opens print dialog. Select "Save as PDF" to download the file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}