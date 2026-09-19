# Audit Finding: Server Webhook Field Mapping Corruption and Source Detail Inversion

**Finding ID**: `RL-AUDIT-DEF-006`  
**Title**: Server Webhook Field Mapping Corruption and Source Detail Inversion  
**Audit Status**: Confirmed Defect (Confirmed locally; GTM/GA4 external verification pending)  
**Severity**: High  
**Affected Route**: `/scenario/defect-6`  
**Target Component**: `demo/src/lib/mappers/defect-06.ts` / server mapper  

---

## 1. Executive Summary

An insidious backend data corruption defect was identified in the lead ingestion pipeline on route `/scenario/defect-6`. When a prospective lead submits the audit inquiry form, client-side attribution capture, form validation, and analytics dispatch perform flawlessly. The browser dispatches a complete payload to `POST /api/leads` and pushes a valid `demo_lead_success` event into `window.dataLayer`. However, the server-side field mapper (`mappers/defect-06.ts`) corrupts the data before writing to the database: it leaves primary `lead_source` completely empty, inverts `utm_source` into `lead_source_detail`, and drops `campaign_name`. While front-of-house analytics look perfect, backend CRM records are broken, crippling sales lead routing and revenue reporting.

---

## 2. Real-World Analogue

This finding demonstrates why front-end analytics auditing alone is insufficient:
- In production architectures, lead submissions pass from the website to a backend API, webhook endpoint (e.g., Zapier, Make, Segment), or directly into a CRM API (HubSpot, Salesforce).
- A backend engineer or operations specialist configures the field mapping JSON.
- An error is introduced in the field mapping logic:
  - The developer maps `payload.attribution.utm_source` to `lead_source_detail` instead of `lead_source`.
  - The developer forgets to map `campaign_name`.
  - The primary `lead_source` field is left unassigned.
- Because frontend developers only check that the form returns 201 Created and that GTM tags fire in Tag Assistant, the defect goes undetected for months until sales leadership complains that incoming leads have missing source fields in Salesforce.

---

## 3. Reproduction Steps

1. Start the application:
   ```bash
   npm run dev
   ```
2. Navigate to Defect 6 with full attribution query parameters:
   `http://localhost:3000/scenario/defect-6?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-006`
3. Enter valid synthetic lead information:
   - **Full Name**: `Jamie Vance`
   - **Work Email**: `jamie.vance@example.com`
   - **Company Name**: `Vance Media Solutions`
   - **Monthly Ad Spend**: `$10,000 - $25,000`
   - **Primary Challenge**: `Salesforce leads showing blank lead source and campaign`
4. Click **Request Lead Audit**.
5. Observe that the frontend operates without errors:
   - Form renders the success confirmation screen.
   - Network tab shows `POST /api/leads` succeeded with status `201 Created`.
   - Browser console shows a completely valid `demo_lead_success` push to `window.dataLayer` with `attribution_status: "present"`.
6. Open the Simulated CRM Viewer (`/crm`):
   - Locate the row for `Jamie Vance` (`submission_id`).
   - Inspect the mapping indicators:
     - **Mapping Status**: `corrupted` (red badge).
     - **Lead Source**: Blank `""`.
     - **Lead Source Detail**: `"google"` (mismapped).
     - **Campaign Name**: Blank `""`.
     - **Intentionally Missing Fields**: `["lead_source", "campaign_name"]`.

---

## 4. Technical Evidence

### 4.1 Client Request Body Sent to POST /api/leads

The client transmitted complete, correct attribution metadata:

```json
{
  "submission_id": "c28f7a91-49b0-4f12-9844-01fa5c99e606",
  "scenario": "defect-6",
  "full_name": "Jamie Vance",
  "work_email": "jamie.vance@example.com",
  "company_name": "Vance Media Solutions",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Salesforce leads showing blank lead source and campaign",
  "attribution": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "responselock_demo",
    "gclid": "DEMO-GCLID-006"
  },
  "attribution_status": "present"
}
```

### 4.2 Valid Client dataLayer Event

```json
{
  "event": "demo_lead_success",
  "form_id": "lead_audit_demo",
  "lead_type": "agency_audit_inquiry",
  "scenario": "defect-6",
  "submission_id": "c28f7a91-49b0-4f12-9844-01fa5c99e606",
  "attribution_status": "present",
  "debug_mode": true
}
```

### 4.3 Corrupted Stored CRM Record (`demo/data/crm-records.jsonl`)

The persisted database record reveals the server mapping corruption:

```json
{
  "submission_id": "c28f7a91-49b0-4f12-9844-01fa5c99e606",
  "scenario": "defect-6",
  "full_name": "Jamie Vance",
  "work_email": "jamie.vance@example.com",
  "company_name": "Vance Media Solutions",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Salesforce leads showing blank lead source and campaign",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T19:00:00.000Z",
  "lead_source": "",
  "lead_source_detail": "google",
  "campaign_name": "",
  "gclid": "DEMO-GCLID-006",
  "mapping_status": "corrupted",
  "missing_fields": [
    "lead_source",
    "campaign_name"
  ],
  "intentionally_missing_fields": []
}
```

### 4.4 Observability Timeline Discrepancy

```json
[
  { "id": "evt-1", "timestamp": 12, "category": "lifecycle", "label": "Scenario defect-6 loaded" },
  { "id": "evt-2", "timestamp": 3100, "category": "validation", "label": "Client validation passed" },
  { "id": "evt-3", "timestamp": 3105, "category": "network", "label": "Dispatched POST /api/leads with complete attribution" },
  { "id": "evt-4", "timestamp": 3525, "category": "defect", "label": "Server mapper defect-06 executed: dropped lead_source and campaign_name" },
  { "id": "evt-5", "timestamp": 3528, "category": "crm", "label": "Persisted corrupted CRM record (mapping_status: corrupted)" },
  { "id": "evt-6", "timestamp": 3530, "category": "analytics", "label": "Pushed demo_lead_success to window.dataLayer" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | Client and dataLayer pass; CRM record is corrupted with missing source/campaign. |
| **Requires GTM Preview** | **PENDING (Deceptive Pass)** | Requires user verification in Tag Assistant: GTM tag expected to fire normally, masking backend corruption. |
| **Requires GA4 DebugView** | **PENDING (Deceptive Pass)** | Requires user verification in GA4 DebugView: event expected to record normally, masking CRM corruption. |
| **Not tested in Google Ads** | **NOT TESTED** | Untested in Google Ads (conceptual boundary). In a live deployment, frontend conversions could register, but CRM records would lack matching source fields for offline closed-loop validation. |

---

## 6. Business Impact

1. **CRM Automation & Routing Failure**: Modern enterprise CRMs rely on `lead_source` to assign incoming leads to specialized sales teams (e.g., Paid Inbound SDRs vs. Outbound reps). Leads with blank source fields sit unassigned in triage queues, causing response times to balloon from 5 minutes to 48 hours and killing conversion rates.
2. **Loss of Campaign Attribution in Sales Pipeline**: Executive pipeline reports aggregate closed revenue by `campaign_name`. Because `campaign_name` is blank, sales reports fail to credit the Google Ads campaigns that funded the leads.
3. **The "Analytics Illusion"**: This defect creates the illusion that marketing tracking is working because GA4 and GTM show green checkmarks. Only an end-to-end audit verifying the database/CRM records can detect the breakdown.

---

## 7. Remediation Code Diff

Correct the backend field mapping logic in `demo/src/lib/mappers/defect-06.ts` to populate canonical fields in accordance with the CRM contract.

```diff
--- a/demo/src/lib/mappers/defect-06.ts
+++ b/demo/src/lib/mappers/defect-06.ts
@@ -7,11 +7,14 @@ import type { CrmFieldMapper, LeadSubmissionPayload, CrmFieldMapResult } from '.
 export const mapDefect06LeadToCrm: CrmFieldMapper = (payload: LeadSubmissionPayload): CrmFieldMapResult => {
   const attr = payload.attribution;
+  const leadSource = attr?.utm_source || (attr?.gclid ? 'google' : 'direct');
+  const leadSourceDetail = attr?.utm_medium || (attr?.gclid ? 'cpc' : 'none');
+  const campaignName = attr?.utm_campaign || 'none';
   return {
-    lead_source: '', // Intentionally dropped
-    lead_source_detail: attr?.utm_source || 'none', // Mismapped from source
-    campaign_name: '', // Intentionally dropped
+    lead_source: leadSource,
+    lead_source_detail: leadSourceDetail,
+    campaign_name: campaignName,
     gclid: attr?.gclid || '',
-    mapping_status: 'corrupted',
-    missing_fields: ['lead_source', 'campaign_name'],
+    mapping_status: 'valid',
+    missing_fields: [],
   };
 };
```
