# Audit Finding: Premature Conversion Event Dispatched on Invalid Form Submission Click

**Finding ID**: `RL-AUDIT-DEF-001`  
**Title**: Premature Conversion Event Dispatched on Invalid Form Submission Click  
**Audit Status**: Confirmed Defect  
**Severity**: High  
**Affected Route**: `/scenario/defect-1`  
**Target Component**: `Defect1Form.tsx`  

---

## 1. Executive Summary

A critical tracking discrepancy was identified on the lead generation form at `/scenario/defect-1`. When a site visitor clicks the form submission button without filling in mandatory fields, the client-side validation logic properly halts form transmission and displays error messages. However, an uncoupled `click` event listener on the submit button immediately pushes a `demo_lead_success` conversion event into `window.dataLayer`. As a result, Google Tag Manager, Google Analytics 4, and downstream ad platforms record a successful conversion even though no lead was created, no API request was dispatched, and no record was entered into the CRM.

---

## 2. Real-World Analogue

This issue is one of the most widespread tracking blunders in digital marketing agencies. It typically occurs when:
- A digital marketer or analytics freelancer configures a Google Tag Manager trigger using "Click - All Elements" or "Click - Just Links" targeting the button CSS selector (e.g., `#submit-btn` or `button[type="submit"]`), rather than listening to a verified custom event or successful form submission callback.
- A frontend engineer attaches an `onClick` listener directly to the submit button element to track conversion intent, unaware that HTML5 or JavaScript form validation executes after or concurrently with DOM click events.

In both instances, conversion reporting tracks **user intent to click** rather than **verified lead acquisition**.

---

## 3. Reproduction Steps

1. Launch the demonstration workspace:
   ```bash
   npm run dev
   ```
2. Navigate in a browser to the Defect 1 scenario:
   `http://localhost:3000/scenario/defect-1`
3. Leave all form fields blank (or enter invalid inputs such as an invalid email string `bad-input`).
4. Click the **Request Lead Audit** button.
5. Observe the user interface:
   - Form submission is blocked.
   - Validation errors appear adjacent to required input fields ("Full name is required", "Work email is required").
   - The form does NOT transition to the success confirmation state.
6. Open Chrome DevTools Network tab:
   - Verify that **zero** network calls were made to `/api/leads` (request count = 0).
7. Inspect the Simulated CRM (`/crm`):
   - Verify that **zero** new rows have been written to `demo/data/crm-records.jsonl`.
8. Open Chrome DevTools Console and inspect `window.dataLayer`:
   - Execute: `window.dataLayer.filter(item => item.event === 'demo_lead_success')`
   - Observe that a `demo_lead_success` event has been pushed to the array with `scenario: "defect-1"`.

---

## 4. Technical Evidence

### 4.1 False Conversion Event in dataLayer

Extracted from `window.dataLayer` following an invalid form submission attempt:

```json
{
  "event": "demo_lead_success",
  "form_id": "lead_audit_demo",
  "lead_type": "agency_audit_inquiry",
  "scenario": "defect-1",
  "submission_id": "8f31b8a1-d922-44df-bca8-f421fbc34101",
  "attribution_status": "missing",
  "debug_mode": true
}
```

*Defect verification notes:*
- `event: "demo_lead_success"` was pushed despite mandatory fields being empty.
- A synthetic `submission_id` was assigned prematurely.
- GTM evaluates the custom event trigger as matching, firing GA4 key event tags and Google Ads conversion tags.

### 4.2 Network Request Audit

```text
Target: POST http://localhost:3000/api/leads
Status: (No requests dispatched)
Total Requests: 0
```

### 4.3 Database / CRM Verification

Inspected `demo/data/crm-records.jsonl` and `/crm`:
```text
Total Records Matching submission_id "8f31b8a1-d922-44df-bca8-f421fbc34101": 0
Delta rows written to store: 0
```

### 4.4 Observability Timeline Discrepancy

```json
[
  { "id": "evt-1", "timestamp": 10, "category": "lifecycle", "label": "Scenario defect-1 loaded" },
  { "id": "evt-2", "timestamp": 3120, "category": "defect", "label": "Submit button onClick handler executed before validation" },
  { "id": "evt-3", "timestamp": 3122, "category": "analytics", "label": "Pushed demo_lead_success to window.dataLayer" },
  { "id": "evt-4", "timestamp": 3125, "category": "validation", "label": "Form validation failed: work_email is required" },
  { "id": "evt-5", "timestamp": 3126, "category": "lifecycle", "label": "Aborted submission pipeline; 0 network calls dispatched" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | 0 API calls, 0 CRM rows, but 1 conversion event present in `window.dataLayer`. |
| **Requires GTM Preview** | **VULNERABLE** | Tag Assistant confirms conversion tag fires immediately on invalid button click. |
| **Requires GA4 DebugView** | **VULNERABLE** | DebugView records incoming `demo_lead_success` key event for invalid form attempt. |
| **Not tested in Google Ads** | **BOUNDARY** | Ads conversion action would falsely record conversion and attribute bidding credit. |

---

## 6. Business Impact

1. **Severe Ad Spend Misallocation**: Automated bidding algorithms (Target CPA / Maximize Conversions) optimize to minimize cost-per-conversion. Because unqualified visitors and bot traffic frequently click submit buttons without completing forms, the bidding algorithm learns that these users are high-value converters. Ad spend is systematically redirected away from genuine prospects toward junk clickers.
2. **False Cost-Per-Acquisition (CPA)**: If 30% of button clicks are invalid attempts, reported CPA appears 30% cheaper in the ad dashboard than actual business reality ($70 apparent CPA vs. $100 actual cost per legitimate lead).
3. **Sales & Marketing Friction**: Marketing reports 150 conversions for the month, while Sales reports only 100 leads in the CRM, destroying organizational trust in marketing attribution.

---

## 7. Remediation Code Diff

Remove the standalone DOM `onClick` trigger from the submit button. Relocate the `dataLayer.push` call into the resolved asynchronous response handler, strictly contingent on HTTP `201 Created` from `/api/leads`.

```diff
--- a/demo/src/components/forms/Defect1Form.tsx
+++ b/demo/src/components/forms/Defect1Form.tsx
@@ -28,14 +28,6 @@ export function Defect1Form() {
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [isSubmitting, setIsSubmitting] = useState(false);
 
-  // DEFECTIVE: Firing conversion analytics on raw button click
-  const handleButtonClick = () => {
-    const interimId = crypto.randomUUID();
-    window.dataLayer.push(
-      buildAnalyticsPayload({ scenario: 'defect-1', submissionId: interimId, attributionStatus: 'missing' })
-    );
-  };
-
   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formValid = validateForm(formData);
@@ -58,6 +50,11 @@ export function Defect1Form() {
       const result = await response.json();
       if (response.ok) {
+        // REMEDIATION: Fire analytics ONLY upon verified server confirmation
+        window.dataLayer.push(
+          buildAnalyticsPayload({ scenario: 'defect-1', submissionId, attributionStatus: 'present' })
+        );
         setSuccess(true);
       }
     } finally {
@@ -82,7 +79,6 @@ export function Defect1Form() {
         <button
           type="submit"
           disabled={isSubmitting}
-          onClick={handleButtonClick}
           className="btn-primary"
         >
           Request Lead Audit
```
