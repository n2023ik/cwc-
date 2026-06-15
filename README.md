# Attractive Site Design

A modern dashboard application for managing and analyzing site visit data, integrated with Google Sheets.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

---

## 📊 Google Sheets Integration

This project fetches data directly from a Google Sheet.

### Step 1: Prepare Your Sheet

Use the first row as headers:

```
id, srNo, zone, state, siteName, siteType, ticketIds, dateOfVisit, visitType, cycle, visitorType, vendorName, visitorName, visitorContact, status, signOffReceived, signOffNotes, visitorCharges, procurementAmount, procurementType
```

---

### Step 2: Make Sheet Public

* Go to **File → Share → Publish to Web**
* OR set access to **Anyone with the link can view**

---

### Step 3: Get Sheet ID

From your URL:

```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
```

---

### Step 4: Configure Environment Variables

Create a `.env` file in the root:

```env
VITE_GOOGLE_SHEET_ID=YOUR_SHEET_ID
VITE_GOOGLE_SHEET_NAME=Sheet1
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
VITE_GOOGLE_AUTH_SCRIPT_URL=YOUR_APPS_SCRIPT_WEB_APP_URL
```

---

## 🔐 Authentication Notes

* `VITE_GOOGLE_CLIENT_ID` must match your Apps Script `CLIENT_ID`
* `VITE_GOOGLE_AUTH_SCRIPT_URL` must be the deployed Web App URL (`doPost`)
* Deploy Apps Script with access:

  * `Anyone` OR `Anyone with Google account`

---

## 📌 Supported Headers

You can use both technical and business-friendly headers:

```
Sr. No., Zone, State, Site Name, Site Type, Ticket Ids, Date of Visit,
Visit Purpose, Visitor Type, Vendor Name, Visitor Name,
Visitor Contact Number, Visit Status, Sign Off Received Status,
Visitor Charges, Procurement Amount, Procurement Type
```

---

## ⚠️ Important

If `VITE_GOOGLE_SHEET_ID` is missing or invalid:

* The dashboard will show **no data**
# CWC
# CWC
