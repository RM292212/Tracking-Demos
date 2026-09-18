# Audit Finding: Duplicate Conversion Events Dispatched from Legacy and Modern Listeners

**Finding ID**: `RL-AUDIT-DEF-002`  
**Title**: Duplicate Conversion Events Dispatched from Legacy and Modern Listeners  
**Audit Status**: Confirmed Defect  
**Severity**: High  
**Affected Route**: `/scenario/defect-2`  
**Target Component**: `Defect2Form.tsx` / `legacy-conversion-listener.ts`  

---

## 1. Executive Summary

During testing of the lead generation workflow on route `/scenario/defect-2`, a double-counting conversion defect was confirmed. Upon a single valid form submission, two separate `demo_lead_success` events are pushed into `window.dataLayer` within a few hundred milliseconds of each other. Both events share the identical `submission_id`. While the backend API correctly enforces idempotency via the `Idempotency-Key` HTTP header (recording only one row in the CRM), Google Tag Manager and GA4 capture both dataLayer events, artificially doubling reported conversions in advertising analytics.

---

## 2. Real-World Analogue

This defect is characteristic of multi-vendor transitions, website migrations, and partial codebase modernizations:
- A legacy marketing agency installed an event listener in an auxiliary bundle (`legacy-conversion-listener.ts` or an inline script tag) that bound directly to form submissions.
- A newly hired frontend engineering team built a modern React form component with an asynchronous post-success callback that also pushes conversion events to `window.dataLayer`.
- Neither team audited the surviving scripts during the redesign handoff.
- As a consequence, both the legacy click/submit listener and the modern API-response handler fire concurrently on every conversion.

---

## 3. Reproduction Steps

1. Start the local development server:
   ```bash
   npm run dev
   ```
2. Navigate in a browser to the Defect 2 route:
   `http://localhost:3000/scenario/defect-2?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-002`
3. Enter valid synthetic lead information:
   - **Full Name**: `Jordan Taylor`
   - **Work Email**: `jordan.taylor@example.org`
   - **Company Name**: `Horizon Media Labs`
   - **Monthly Ad Spend**: `$25,000 - $50,000`
   - **Primary Challenge**: `Double-counting in Google Ads reporting`
4. Click **Request Lead Audit**.
5. Observe the UI:
   - Success state renders smoothly with confirmation ID.
6. Check Chrome DevTools Network tab:
   - Verify that `POST /api/leads` was called once (or multiple times if retried), returning status `201 Created` with header `Idempotency-Key: e4b23f81-5d91-4c6e-8d2b-91c834a71234`.
7. Check Simulated CRM (`/crm`):
   - Verify that exactly **one** CRM record exists for submission ID `e4b23f81-5d91-4c6e-8d2b-91c834a71234`.
8. Check DevTools Console `window.dataLayer`:
   - Inspect all events: `window.dataLayer.filter(i => i.event === 'demo_lead_success')`
   - Notice that **two** identical conversion events were pushed to the array with the same `submission_id`.

---

## 4. Technical Evidence

### 4.1 Duplicate dataLayer Pushes

```json
[
  {
    "event": "demo_lead_success",
    "form_id": "lead_audit_demo",
    "lead_type": "agency_audit_inquiry",
    "scenario": "defect-2",
    "submission_id": "e4b23f81-5d91-4c6e-8d2b-91c834a71234",
    "attribution_status": "present",
    "debug_mode": true
  },
  {
    "event": "demo_lead_success",
    "form_id": "lead_audit_demo",
    "lead_type": "agency_audit_inquiry",
    "scenario": "defect-2",
    "submission_id": "e4b23f81-5d91-4c6e-8d2b-91c834a71234",
    "attribution_status": "present",
    "debug_mode": true
  }
]
```

*Defect verification notes:*
- Two discrete array elements inside `window.dataLayer`.
- Timestamp delta between pushes: ~420ms (first pushed immediately on button click, second pushed when API returned 201).
- Exact match on `submission_id: "e4b23f81-5d91-4c6e-8d2b-91c834a71234"`.

### 4.2 Idempotent Server Confirmation (`demo/data/crm-records.jsonl`)

The backend correctly deduplicated the request, storing only a single row:

```json
{
  "submission_id": "e4b23f81-5d91-4c6e-8d2b-91c834a71234",
  "scenario": "defect-2",
  "full_name": "Jordan Taylor",
  "work_email": "jordan.taylor@example.org",
  "company_name": "Horizon Media Labs",
  "monthly_ad_spend": "$25,000 - $50,000",
  "primary_challenge": "Double-counting in Google Ads reporting",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T18:40:00.000Z",
  "lead_source": "google",
  "lead_source_detail": "cpc",
  "campaign_name": "responselock_demo",
  "gclid": "DEMO-GCLID-002",
  "mapping_status": "valid",
  "missing_fields": [],
  "intentionally_missing_fields": []
}
```

### 4.3 Observability Timeline Double-Dispatch

```json
[
  { "id": "evt-1", "timestamp": 12, "category": "lifecycle", "label": "Scenario defect-2 loaded" },
  { "id": "evt-2", "timestamp": 2400, "category": "defect", "label": "Legacy conversion listener triggered on submit click" },
  { "id": "evt-3", "timestamp": 2402, "category": "analytics", "label": "Pushed #1 demo_lead_success (legacy listener)" },
  { "id": "evt-4", "timestamp": 2405, "category": "network", "label": "Dispatched POST /api/leads with Idempotency-Key" },
  { "id": "evt-5", "timestamp": 2825, "category": "crm", "label": "Server responded 201 Created (persisted 1 CRM row)" },
  { "id": "evt-6", "timestamp": 2830, "category": "analytics", "label": "Pushed #2 demo_lead_success (modern post-success handler)" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | 1 CRM row persisted, but 2 identical `demo_lead_success` events in `window.dataLayer`. |
| **Requires GTM Preview** | **VULNERABLE** | Tag Assistant displays 2 separate triggers firing GA4 conversion tags for 1 user action. |
| **Requires GA4 DebugView** | **VULNERABLE** | DebugView shows 2 `demo_lead_success` key events registered within a 1-second window. |
| **Not tested in Google Ads** | **BOUNDARY** | Without transaction deduplication IDs in Ads, 2 conversions would be counted. |

---

## 6. Business Impact

1. **100% Conversion Count Inflation**: Ad platforms report double the actual business lead count (e.g., 200 conversions recorded for 100 genuine leads).
2. **50% Apparent CPA Deflation**: The dashboard reports an artificial $40 cost-per-lead when the true economic acquisition cost is $80.
3. **Misguided Budget Scaling**: Media buyers scale underperforming ad sets under the illusion that performance is twice as strong as reality, exhausting client budgets on unproductive campaigns.
4. **CRM vs. Ad Network Reconciliation Failure**: Month-end reconciliation reveals a massive discrepancy between paid media invoices and sales pipeline records.

---

## 7. Remediation Code Diff

Decommission the legacy event listener script and maintain a single authoritative analytics push inside the verified API resolution block.

```diff
--- a/demo/src/components/forms/Defect2Form.tsx
+++ b/demo/src/components/forms/Defect2Form.tsx
@@ -10,8 +10,6 @@
 import { buildAnalyticsPayload } from '@/lib/contracts/events';
-import { registerLegacyConversionListener } from '@/lib/legacy-conversion-listener';
 
 export function Defect2Form() {
   const [formData, setFormData] = useState<LeadSubmissionPayload>({...});
@@ -21,11 +19,6 @@ export function Defect2Form() {
   useEffect(() => {
-    // DEFECTIVE: Legacy listener surviving from previous agency implementation
-    const unbindLegacy = registerLegacyConversionListener('lead-form-submit-btn');
-    return () => unbindLegacy();
   }, []);
 
   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
@@ -49,7 +42,7 @@ export function Defect2Form() {
       if (response.ok) {
         // Single authoritative modern conversion dispatch
         window.dataLayer.push(
           buildAnalyticsPayload({ scenario: 'defect-2', submissionId, attributionStatus: 'present' })
         );
         setSuccess(true);
       }
```
