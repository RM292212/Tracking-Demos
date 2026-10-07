# ResponseLock Evidence Capture Guide

**Document Version**: 1.0.0  
**Target Audience**: Lead & Conversion Integrity Auditors, Solutions Engineers, Agency Analysts  
**Applies To**: ResponseLock Conversion-Integrity Audit ($350 fixed-scope service)  

---

## 1. Introduction & Audit Evidence Philosophy

The fundamental principle of the ResponseLock Conversion-Integrity Audit is:  
**A form that works does not mean conversion data is trustworthy.**

When presenting audit findings to agency owners, CMOs, or enterprise marketing directors, subjective claims carry little weight. Auditors must deliver concrete, forensic, and reproducible technical evidence proving exactly where tracking breaks down between the user's initial click and the agency's reporting dashboards.

This guide provides a standardized operational protocol for capturing, formatting, and documenting technical evidence across all seven demonstration scenarios.

---

## 2. The Four-Layer Verification Framework

Conversion tracking operates across multiple architectural boundaries. To eliminate confusion and prevent false claims, every evidence item in a ResponseLock audit must be classified into one of four distinct verification layers:

```text
[ Browser / DOM / Storage ] -> [ Google Tag Manager ] -> [ Google Analytics 4 ] -> [ Google Ads / Ad Networks ]
       Layer 1                          Layer 2                     Layer 3                      Layer 4
  (Confirmed locally)            (Requires GTM Preview)      (Requires GA4 DebugView)     (Not tested in Ads)
```

### Layer 1: Confirmed Locally
- **Scope**: Local browser DOM, client-side JavaScript execution, `window.dataLayer` pushes, HTTP network requests, and the local CRM database (`crm-records.jsonl`).
- **Tooling**: Chrome DevTools (Console, Network, Application tabs), ResponseLock Observability Timeline, and `/crm` inspection table.
- **Evidentiary Standard**: Fully deterministic and verified without requiring third-party cloud services.

### Layer 2: Requires GTM Preview
- **Scope**: Trigger evaluation, variable resolution, and tag firing within Google Tag Manager.
- **Tooling**: Google Tag Assistant connected to the active development session (`tagassistant.google.com`).
- **Evidentiary Standard**: Proves whether client-side dataLayer pushes actually activate configured conversion tags.

### Layer 3: Requires GA4 DebugView
- **Scope**: Real-time event ingestion, parameter registration, and key event attribution in Google Analytics 4.
- **Tooling**: GA4 Admin Console -> Data Display -> DebugView.
- **Evidentiary Standard**: Proves whether events survive processing pipelines and appear under custom dimensions.

### Layer 4: Not Tested in Google Ads (Boundary Principle)
- **Scope**: Google Ads conversion actions, Target CPA / Target ROAS algorithmic bidding adjustments, and Offline Conversion Imports.
- **Tooling**: Conceptual boundary documented in `docs/google-ads-boundary.md`.
- **Evidentiary Standard**: Acknowledged boundary. Google Ads is not connected to live spend in local training to prevent test submissions from distorting live bidding algorithms or incurring advertising billing.

---

## 3. Capturing DevTools Console Evidence

The browser console provides the immediate source of truth for all client-side tracking pushes.

### 3.1 Inspecting the dataLayer Array

To inspect the full dataLayer array in Chrome DevTools:

```javascript
// Open DevTools Console (F12 or Ctrl+Shift+I)
console.table(window.dataLayer);
```

### 3.2 Extracting the Latest Conversion Event

To isolate and inspect the most recently dispatched conversion payload:

```javascript
// Retrieve the last item in dataLayer
const latestEvent = window.dataLayer[window.dataLayer.length - 1];
console.log(JSON.stringify(latestEvent, null, 2));
```

### 3.3 Filtering for Conversion Events

To filter out standard GTM framework events (e.g., `gtm.js`, `gtm.dom`, `gtm.load`) and display only lead conversion events:

```javascript
// Filter for demo conversion events
const conversionEvents = window.dataLayer.filter(item => 
  item.event === 'demo_lead_success' || item.event === 'demo_lead_sucess'
);
console.log(JSON.stringify(conversionEvents, null, 2));
```

---

## 4. Capturing Network Tab Evidence

Network traces demonstrate whether form submission events correspond to genuine server communications.

### 4.1 Filter Configuration
1. Open DevTools -> **Network** tab.
2. In the filter bar, enter `/api/leads` and ensure **Fetch/XHR** is selected.
3. Check the **Preserve log** checkbox to retain requests across multi-step navigation or page reloads.

### 4.2 Verifying Key Request Headers
Inspect the request headers for the idempotency token:
- **`Content-Type`**: `application/json`
- **`Idempotency-Key`**: A valid UUID v4 matching the `submission_id` in the JSON request body.

### 4.3 Auditing Status Codes
- **`201 Created`**: Successful submission. Server validated payload, stored 1 CRM record, and issued confirmation.
- **`400 Bad Request`**: Validation failure or honeypot triggered. Server rejected the payload; 0 CRM records written.
- **No Request (0 calls)**: Expected during client validation failure (e.g., Defect 1). Proves the form was never transmitted.

---

## 5. dataLayer Dumps & PII Sanitization

Audit reports must prove contract adherence while strictly avoiding customer PII leaks.

### 5.1 The 7 Approved Keys Whitelist
Every valid conversion event payload in ResponseLock must contain only the seven approved keys:
1. `event`: `'demo_lead_success'`
2. `form_id`: `'lead_audit_demo'`
3. `lead_type`: `'agency_audit_inquiry'`
4. `scenario`: `'baseline'` | `'defect-1'` | ... | `'defect-6'`
5. `submission_id`: UUID v4 string
6. `attribution_status`: `'present'` | `'partial'` | `'missing'` | `'dropped'`
7. `debug_mode`: `true`

### 5.2 Zero-PII Enforcement Rule
Never include the following fields in dataLayer dumps:
- Customer names (`full_name`, `firstName`, `lastName`)
- Email addresses (`work_email`, `email`)
- Phone numbers (`phone`, `telephone`)
- Freeform text notes (`notes`, `message`)
- Raw referrers containing sensitive query parameters

*Tip*: Run the project scanner to confirm all workspace evidence is completely clean of PII:
```bash
npm run scan:pii
```

---

## 6. Simulated CRM Verification

The local CRM simulator stores lead records in `demo/data/crm-records.jsonl` and exposes them via the `/crm` interface.

### 6.1 Using the CRM Viewer Interface (`/crm`)
1. Navigate in your browser to `http://localhost:3000/crm`.
2. Locate the lead record by `submission_id` or timestamp.
3. Verify the **Mapping Status** badge:
   - **`valid` (Green)**: All canonical fields (`lead_source`, `lead_source_detail`, `campaign_name`, `gclid`) populated accurately.
   - **`corrupted` (Red)**: Server mapper corrupted or transposed fields (Defect 6).
   - **`incomplete` (Yellow)**: Missing critical campaign attribution (Defect 5).

### 6.2 Inspecting the Raw JSONL File
Auditors can inspect records directly via the command line:

```powershell
# PowerShell (Windows):
Get-Content demo\data\crm-records.jsonl -Tail 1

# Bash (macOS/Linux):
tail -n 1 demo/data/crm-records.jsonl
```

---

## 7. Observability Timeline & Manifest Extraction

The on-page Observability Panel displays diagnostic events from instrumented parts of the app. It is not a complete request or conversion trace, and absence of an entry does not show that a request or event did not occur. Verify network activity in browser DevTools and canonical events in `window.dataLayer` independently.

### 7.1 Timeline Event Categories
These are schema categories. A route may emit only some of them; do not assume the timeline records every operation.
- **`lifecycle`**: Component mounting, route transitions, step navigation.
- **`validation`**: Client-side form validation checks and errors.
- **`network`**: API requests, headers, and HTTP status codes.
- **`analytics`**: DataLayer pushes and parameter serialization.
- **`storage`**: First-touch cookie and last-touch sessionStorage operations.
- **`crm`**: Server-side lead persistence and database operations.
- **`attribution`**: UTM extraction, GCLID capture, and status calculation.
- **`consent`**: Google Consent Mode v2 status changes.
- **`defect`**: Diagnostic flags noting where intentional defect logic was triggered.

### 7.2 Exporting Evidence for Reports
The Observability Panel provides two export utilities:
1. **Copy Sanitized Summary**: Copies a human-readable Markdown summary to the system clipboard, ideal for quick pasting into Slack, email, or client reports.
2. **Download Sanitized Manifest**: Exports a structured `.json` file (`SanitizedEvidenceManifest`) containing timestamped entries and verification summaries.

---

## 8. Screenshot & Visual Evidence Standards

Visual artifacts provide undeniable proof for non-technical stakeholders.

### 8.1 Screenshot Specifications
- **Format**: PNG, 24-bit color.
- **Resolution**: Minimum 1280x720 (standard browser viewport).
- **Naming Convention**:
  - `evidence/<scenario>/screenshots/01-form-ui.png`
  - `evidence/<scenario>/screenshots/02-network-request.png`
  - `evidence/<scenario>/screenshots/03-datalayer-console.png`
  - `evidence/<scenario>/screenshots/04-crm-record.png`
  - `evidence/<scenario>/screenshots/05-gtm-preview.png` (optional)

### 8.2 Redaction and Annotation Guidelines
- **Redaction**: Always verify that synthetic emails (`*@example.com`) and phone numbers (`555-0100`) are used. If auditing a live client website, blur all real customer contact details before saving artifacts.
- **Callouts**: Use red bounding boxes (2px solid red, `#FF0000`) and callout arrows to highlight:
  - Missing parameters in the console
  - HTTP 0 request counts
  - Double events in Tag Assistant
  - Corrupted CRM field values

---

## 9. Automated Verification Commands

Before finalizing an audit package or presenting to a client, execute the verification suite:

```bash
# Run the complete test and verification pipeline
npm run verify
```

To run individual verification tasks:
```bash
# Validate that zero PII or disallowed tracking literals exist in the workspace
npm run scan:pii

# Validate all documentation commands against package.json scripts
npm run check:docs

# Execute all unit and integration contract tests
npm run test:unit
```
