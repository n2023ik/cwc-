/**
 * Google Apps Script endpoint for the dashboard.
 *
 * Sheet requirements:
 * 1) First row must contain headers that match these keys:
 * id, srNo, zone, state, siteName, siteType, ticketIds, dateOfVisit,
 * visitType, cycle, visitorType, vendorName, visitorName, visitorContact,
 * status, signOffReceived, signOffNotes, visitorCharges, procurementAmount,
 * procurementType
 * 2) dateOfVisit supports formats like 21-Jan-2026 and YYYY-MM-DD.
 */
function doGet() {
  var SHEET_NAME = "Sheet1";
  var TIME_ZONE = Session.getScriptTimeZone();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Sheet not found", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = values[0];
  var rows = values.slice(1);

  var data = rows
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== "";
      });
    })
    .map(function(row, rowIndex) {
      var record = {};

      headers.forEach(function(header, i) {
        var key = String(header).trim();
        var value = row[i];

        if (key === "dateOfVisit" && value instanceof Date) {
          // Keep payload format consistent for the frontend parser.
          value = Utilities.formatDate(value, TIME_ZONE, "dd-MMM-yyyy");
        }

        record[key] = value;
      });

      if (!record.id) {
        record.id = "row-" + (rowIndex + 1);
      }

      return record;
    });

  return ContentService
    .createTextOutput(JSON.stringify({ data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}