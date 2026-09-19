# Audit Finding: Paid Media Attribution Loss Across Client-Side Multi-Step Form Navigation

**Finding ID**: `RL-AUDIT-DEF-005`  
**Title**: Paid Media Attribution Loss Across Client-Side Multi-Step Form Navigation  
**Audit Status**: Confirmed Defect (Confirmed locally; GTM/GA4 external verification pending)  
**Severity**: Critical  
**Affected Route**: `/scenario/defect-5`  
**Target Component**: `Defect5Form.tsx` / attribution capture handler  

---

## 1. Executive Summary

A severe attribution-stripping vulnerability was verified on route `/scenario/defect-5`. When a prospective client arrives via a paid media campaign with campaign parameters (`utm_source`, `utm_medium`, `utm_campaign`, and `gclid`), the landing page initially recognizes the incoming traffic. However, during the multi-step form workflow, client-side route navigation advances the user to the second step while dropping the query string. The form submission handler reads attribution parameters directly from `window.location.search` at submit time rather than retrieving persisted values from browser storage (`sessionStorage` or cookies). Consequently, the conversion event is marked with `attribution_status: "dropped"`, and the resulting CRM record is stored with attribution categorized as `"direct"`, stripping all paid media credit.

---

## 2. Real-World Analogue

This issue is ubiquitous in modern Single Page Applications (SPAs) and multi-step conversion funnels:
- Paid media ads direct traffic to a landing page with full query tracking strings:
  `https://agency.example.com/audit?utm_source=google&utm_medium=cpc&utm_campaign=brand_q3&gclid=DEMO-GCLID-005`
- The user fills out Step 1 (e.g., Name and Email) and clicks "Continue".
- The frontend framework (Next.js, React Router, Vue) executes an in-app route transition to `/audit/step-2` or changes the internal step state without propagating `location.search`.
- At final submission, the script executes `new URLSearchParams(window.location.search)`. Because the URL bar on Step 2 no longer contains query parameters, all UTM values and the Google Click ID evaluate to empty strings.
- The company's CRM attributes a $50,000 sales lead to "Direct Traffic", blinding the CMO to paid campaign profitability.

---

## 3. Reproduction Steps

1. Launch the application:
   ```bash
   npm run dev
   ```
2. Navigate to Defect 5 with paid campaign tracking parameters attached:
   `http://localhost:3000/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-005`
3. Observe the initial state in the Observability Panel:
   - Initial URL carries valid UTMs and GCLID.
   - Initial touch status is marked as `present`.
4. Fill out **Step 1** fields:
   - **Full Name**: `Morgan Reed`
   - **Work Email**: `morgan.reed@example.com`
5. Click **Continue to Step 2**.
6. Observe URL bar and router state:
   - Client-side navigation updates route to `/scenario/defect-5/step-2` (or advances step without query preservation).
   - The query string `?utm_source=...` is absent from `window.location.search`.
7. Fill out **Step 2** fields:
   - **Company Name**: `Summit Digital Ventures`
   - **Monthly Ad Spend**: `$50,000+`
   - **Primary Challenge**: `Paid leads showing as direct in HubSpot CRM`
8. Click **Complete Audit Request**.
9. Inspect `window.dataLayer`:
   - Note that `attribution_status` is explicitly flagged as `"dropped"`.
10. Inspect Simulated CRM (`/crm`):
    - Locate the new lead for `Morgan Reed`.
    - Observe `lead_source: "direct"`, `lead_source_detail: "none"`, `campaign_name: "none"`, and `gclid: ""`.

---

## 4. Technical Evidence

### 4.1 Attribution Lifecycle Comparison

| Lifecycle Stage | `utm_source` | `utm_medium` | `utm_campaign` | `gclid` | Attribution Status |
|---|---|---|---|---|---|
| **Initial Landing (Step 1)** | `google` | `cpc` | `responselock_demo` | `DEMO-GCLID-005` | `present` |
| **After Navigation (Step 2)** | `""` | `""` | `""` | `""` | *(lost in URL)* |
| **Submitted API Payload** | `""` | `""` | `""` | `""` | `dropped` |
| **Persisted CRM Row** | `direct` | `none` | `none` | `""` | `incomplete` |

### 4.2 dataLayer Event Payload

```json
{
  "event": "demo_lead_success",
  "form_id": "lead_audit_demo",
  "lead_type": "agency_audit_inquiry",
  "scenario": "defect-5",
  "submission_id": "b52d8e11-63f2-4e0a-a827-410a5e88e505",
  "attribution_status": "dropped",
  "debug_mode": true
}
```

### 4.3 Stripped CRM Record (`demo/data/crm-records.jsonl`)

```json
{
  "submission_id": "b52d8e11-63f2-4e0a-a827-410a5e88e505",
  "scenario": "defect-5",
  "full_name": "Morgan Reed",
  "work_email": "morgan.reed@example.com",
  "company_name": "Summit Digital Ventures",
  "monthly_ad_spend": "$50,000+",
  "primary_challenge": "Paid leads showing as direct in HubSpot CRM",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T18:55:00.000Z",
  "lead_source": "direct",
  "lead_source_detail": "none",
  "campaign_name": "none",
  "gclid": "",
  "mapping_status": "valid",
  "missing_fields": [],
  "intentionally_missing_fields": []
}
```

### 4.4 Observability Timeline Trace

```json
[
  { "id": "evt-1", "timestamp": 10, "category": "attribution", "label": "Initial landing query captured: google / cpc / responselock_demo" },
  { "id": "evt-2", "timestamp": 2500, "category": "validation", "label": "Step 1 validation passed" },
  { "id": "evt-3", "timestamp": 2510, "category": "lifecycle", "label": "Navigated to Step 2 (query string omitted by router)" },
  { "id": "evt-4", "timestamp": 5200, "category": "defect", "label": "Submission handler read window.location.search (found empty)" },
  { "id": "evt-5", "timestamp": 5205, "category": "attribution", "label": "Attribution status evaluated to 'dropped'" },
  { "id": "evt-6", "timestamp": 5625, "category": "crm", "label": "Persisted CRM row with empty attribution (source=direct)" },
  { "id": "evt-7", "timestamp": 5630, "category": "analytics", "label": "Pushed demo_lead_success with attribution_status: 'dropped'" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | CRM row contains `direct` source; dataLayer contains `attribution_status: 'dropped'`. |
| **Requires GTM Preview** | **PENDING (Vulnerable)** | Requires user verification in Tag Assistant: verify whether conversion tag fires without campaign or click ID metadata. |
| **Requires GA4 DebugView** | **PENDING (Vulnerable)** | Requires user verification in GA4 DebugView: verify whether traffic attribution defaults to Direct / None when consent is granted. |
| **Not tested in Google Ads** | **NOT TESTED** | Untested in Google Ads (conceptual boundary). Without GCLID stored in CRM, Offline Conversion Import (OCI) closed-loop feedback cannot match. |

---

## 6. Business Impact

1. **Catastrophic Paid Media Blindness**: In high-ticket B2B sales cycles, average customer acquisition costs range from $500 to $3,000+. When attribution parameters are lost across multi-step forms, paid campaigns appear to generate zero pipeline revenue.
2. **False Budget Cuts**: Executive leadership sees marketing reports claiming all top deals originated from "Direct" or "Organic" traffic. The Google Ads budget is cut under the belief that paid media is ineffective, collapsing future sales pipeline.
3. **Broken Offline Conversion Tracking (OCT)**: Modern Google Ads value-based bidding relies on feeding CRM closed-won deal data back into Google Ads via GCLID matching. With GCLID stripped from CRM records, closed-loop feedback fails completely.

---

## 7. Remediation Code Diff

Implement persistent browser storage (`sessionStorage` for last-touch and an HTTP-only/secure cookie for first-touch) upon landing, and read from storage during form submission rather than reading ephemeral URL query strings.

```diff
--- a/demo/src/components/forms/Defect5Form.tsx
+++ b/demo/src/components/forms/Defect5Form.tsx
@@ -4,6 +4,7 @@
 import {
-  getAttributionFromLocation,
+  getStoredAttribution,
+  persistAttributionOnLanding,
 } from '@/lib/attribution';
 import { buildAnalyticsPayload } from '@/lib/contracts/events';
 
 export function Defect5Form() {
   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState<LeadSubmissionPayload>({...});
 
   useEffect(() => {
+    // REMEDIATION: Persist query parameters into browser storage on initial landing
+    persistAttributionOnLanding();
   }, []);
 
   const handleFinalSubmit = async () => {
-    // DEFECTIVE: Reading query parameters from current URL at submit time
-    // Current URL on step 2 has had search parameters stripped
-    const currentAttribution = getAttributionFromLocation(window.location.search);
+    // REMEDIATION: Retrieve persisted attribution captured on first pageview
+    const currentAttribution = getStoredAttribution();
 
     const submissionId = crypto.randomUUID();
     const response = await fetch('/api/leads', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Idempotency-Key': submissionId,
       },
       body: JSON.stringify({
         ...formData,
         submission_id: submissionId,
         attribution: currentAttribution,
-        attribution_status: 'dropped',
+        attribution_status: currentAttribution ? 'present' : 'missing',
       }),
     });
```
