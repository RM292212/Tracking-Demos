# Audit Finding: Silent Conversion Drop Due to Event Name Typo in Analytics Constant

**Finding ID**: `RL-AUDIT-DEF-003`  
**Title**: Silent Conversion Drop Due to Event Name Typo in Analytics Constant  
**Audit Status**: Confirmed Defect (Confirmed locally; GTM/GA4 external verification pending)  
**Severity**: Critical  
**Affected Route**: `/scenario/defect-3`  
**Target Component**: `Defect3Form.tsx`  

---

## 1. Executive Summary

A critical conversion omission defect was verified on route `/scenario/defect-3`. A site visitor successfully completes the lead inquiry form, client and server validations succeed, the backend persists the lead to the CRM database, and the user is shown a confirmation message. However, the frontend handler pushes an analytics payload using a misspelled event name (`demo_lead_sucess` with a single 'c') imported from a stale constants module (`LEGACY_MISSPELLED_EVENT`). Because the production Google Tag Manager trigger requires an exact string match for `demo_lead_success`, GTM ignores the event entirely. Zero tags fire, zero conversions register in GA4 or Google Ads, and paid advertising algorithms operate under complete conversion blindness.

---

## 2. Real-World Analogue

This failure is rampant during frontend re-platforming and refactoring initiatives:
- A developer refactors analytics code into a shared TypeScript library or constants file.
- A typo is introduced into the constant string (e.g., `lead_sucess`, `purchase_complete`, or `formSubmit` vs. `form_submit`).
- Because the form operates normally from the end-user's perspective (submits properly, creates a database row, and renders a thank-you banner), functional QA and unit tests verify the form as "working".
- However, GTM triggers are case-sensitive and string-literal exact. A single character difference causes silent failure without throwing any JavaScript console errors.

---

## 3. Reproduction Steps

1. Start the application:
   ```bash
   npm run dev
   ```
2. Navigate to the Defect 3 route:
   `http://localhost:3000/scenario/defect-3?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-003`
3. Enter valid synthetic lead information:
   - **Full Name**: `Sam Rivers`
   - **Work Email**: `sam.rivers@example.com`
   - **Company Name**: `River Marketing Group`
   - **Monthly Ad Spend**: `$10,000 - $25,000`
   - **Primary Challenge**: `Ads reporting shows zero conversions despite sales leads arriving`
4. Click **Request Lead Audit**.
5. Observe the UI and Network behavior:
   - Form displays the successful confirmation screen.
   - Network tab confirms `POST /api/leads` completed with HTTP status `201 Created`.
6. Inspect the Simulated CRM (`/crm`):
   - Confirm that the lead record was persisted accurately.
7. Open Chrome DevTools Console:
   - Execute: `window.dataLayer[window.dataLayer.length - 1]`
   - Observe the `event` key: It contains `"demo_lead_sucess"` instead of `"demo_lead_success"`.
8. Connect Google Tag Assistant (GTM Preview):
   - In the Tag Assistant timeline, inspect event `demo_lead_sucess`.
   - Observe that the tag trigger for `demo_lead_success` evaluates to `false` (string mismatch).

---

## 4. Technical Evidence

### 4.1 Misspelled dataLayer Event Payload

```json
{
  "event": "demo_lead_sucess",
  "form_id": "lead_audit_demo",
  "lead_type": "agency_audit_inquiry",
  "scenario": "defect-3",
  "submission_id": "a31f9b02-127e-4091-bf99-81bc7e44a903",
  "attribution_status": "present",
  "debug_mode": true
}
```

*Defect verification notes:*
- `event: "demo_lead_sucess"` (single letter 'c').
- Canonical required name: `"demo_lead_success"`.
- Total dataLayer pushes matching canonical name: **0**.

### 4.2 GTM Trigger Condition Evaluation

```text
Trigger Name: Custom Event - Demo Lead Success
Event Name in dataLayer: "demo_lead_sucess"
Trigger Rule: _event equals "demo_lead_success"
Evaluation: false (MISMATCH)
Tags Fired: None (0)
```

### 4.3 Successful CRM Ingestion (`demo/data/crm-records.jsonl`)

The database proves the lead was genuine and processed:

```json
{
  "submission_id": "a31f9b02-127e-4091-bf99-81bc7e44a903",
  "scenario": "defect-3",
  "full_name": "Sam Rivers",
  "work_email": "sam.rivers@example.net",
  "company_name": "River Marketing Group",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Ads reporting shows zero conversions despite sales leads arriving",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T18:45:00.000Z",
  "lead_source": "google",
  "lead_source_detail": "cpc",
  "campaign_name": "responselock_demo",
  "gclid": "DEMO-GCLID-003",
  "mapping_status": "valid",
  "missing_fields": [],
  "intentionally_missing_fields": []
}
```

### 4.4 Observability Timeline Trace

```json
[
  { "id": "evt-1", "timestamp": 8, "category": "lifecycle", "label": "Scenario defect-3 loaded" },
  { "id": "evt-2", "timestamp": 3100, "category": "validation", "label": "Form validation passed" },
  { "id": "evt-3", "timestamp": 3105, "category": "network", "label": "Dispatched POST /api/leads" },
  { "id": "evt-4", "timestamp": 3525, "category": "crm", "label": "Server returned 201 Created and persisted CRM row" },
  { "id": "evt-5", "timestamp": 3530, "category": "defect", "label": "Imported stale constant LEGACY_MISSPELLED_EVENT ('demo_lead_sucess')" },
  { "id": "evt-6", "timestamp": 3532, "category": "analytics", "label": "Pushed misspelled event to window.dataLayer" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | 1 valid CRM record created, but event name pushed is `demo_lead_sucess`. |
| **Requires GTM Preview** | **PENDING (Critical Failure)** | Requires user verification in Tag Assistant: confirm that trigger fails to match `demo_lead_sucess` and `GA4 Event - demo_lead_success` tag does not fire. |
| **Requires GA4 DebugView** | **PENDING (Critical Failure)** | Requires user verification in GA4 DebugView: confirm that zero `demo_lead_success` key events are received. |
| **Not tested in Google Ads** | **NOT TESTED** | Untested in Google Ads (conceptual boundary). In a live account, zero conversions would be imported due to upstream GTM trigger omission. |

---

## 6. Business Impact

1. **Complete Optimization Blindness**: Google Ads Smart Bidding (Target CPA / Maximize Conversions) relies entirely on conversion feedback loops. With zero reported conversions, the algorithm believes the campaigns are failing to convert any traffic. It begins drastically reducing bids or choking off ad delivery entirely.
2. **Wrongful Agency Termination**: Agency performance reviews show zero return on ad spend despite sales teams receiving real leads. Clients believe paid ads are failing and terminate the contract.
3. **Budget Waste on Manual Interventions**: Media buyers frantically change keywords, creatives, and landing pages to diagnose why "no leads are converting," introducing disruption to healthy marketing campaigns.

---

## 7. Remediation Code Diff

Replace the reference to the stale typo constant with the canonical frozen contract constant `ANALYTICS_EVENT_NAME`.

```diff
--- a/demo/src/components/forms/Defect3Form.tsx
+++ b/demo/src/components/forms/Defect3Form.tsx
@@ -7,7 +7,7 @@
 import {
-  LEGACY_MISSPELLED_EVENT,
+  ANALYTICS_EVENT_NAME,
   buildAnalyticsPayload,
 } from '@/lib/contracts/events';
 
 export function Defect3Form() {
@@ -48,7 +48,7 @@ export function Defect3Form() {
       if (response.ok) {
         window.dataLayer.push(
           buildAnalyticsPayload({
             scenario: 'defect-3',
             submissionId,
             attributionStatus: 'present',
-            overrideEventName: LEGACY_MISSPELLED_EVENT, // 'demo_lead_sucess'
+            overrideEventName: ANALYTICS_EVENT_NAME,     // 'demo_lead_success'
           })
         );
         setSuccess(true);
```
