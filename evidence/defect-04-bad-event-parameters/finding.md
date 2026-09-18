# Audit Finding: Conversion Parameter Schema Drift Causing Missing Form ID and Corrupted Lead Type

**Finding ID**: `RL-AUDIT-DEF-004`  
**Title**: Conversion Parameter Schema Drift Causing Missing Form ID and Corrupted Lead Type  
**Audit Status**: Confirmed Defect  
**Severity**: Medium  
**Affected Route**: `/scenario/defect-4`  
**Target Component**: `Defect4Form.tsx` / payload mapper  

---

## 1. Executive Summary

Testing on route `/scenario/defect-4` revealed a parameter schema drift defect. While form submission completes successfully and the backend database persists a valid CRM lead, the analytics payload pushed to `window.dataLayer` violates the enterprise dataLayer contract. Specifically, the mandatory `form_id` parameter is dropped entirely (resolving to `undefined`), and the `lead_type` parameter contains a stale, generic value (`'contact'`) rather than the contract-specified `'agency_audit_inquiry'`. Downstream reporting in Google Analytics 4 exhibits `(not set)` dimension values, breaking segmentation and value-based bidding rules.

---

## 2. Real-World Analogue

This issue commonly arises during website redesigns or frontend refactoring when:
- Frontend engineers refactor component state variables (e.g., renaming `form_id` to `formIdentifier` or restructuring payload objects).
- The analytics dispatch module is maintained in a separate helper file that is not updated alongside the component refactor.
- When the helper constructs the analytics payload, it attempts to read `payload.form_id`, which evaluates to `undefined`. In JavaScript, `JSON.stringify()` or standard object serialization silently strips keys with `undefined` values.
- Similarly, a fallback default value (`'contact'`) is hardcoded in the legacy helper instead of utilizing the domain-specific lead type (`'agency_audit_inquiry'`).

---

## 3. Reproduction Steps

1. Launch the demonstration app:
   ```bash
   npm run dev
   ```
2. Navigate to the Defect 4 scenario:
   `http://localhost:3000/scenario/defect-4?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-004`
3. Fill in valid synthetic inquiry details:
   - **Full Name**: `Pat Casey`
   - **Work Email**: `pat.casey@domain.com`
   - **Company Name**: `Cascade Growth Partners`
   - **Monthly Ad Spend**: `$10,000 - $25,000`
   - **Primary Challenge**: `Analytics custom dimensions show (not set)`
4. Click **Request Lead Audit**.
5. Observe form completion:
   - Form displays confirmation message.
   - Network tab shows `POST /api/leads` returning status `201 Created`.
   - Simulated CRM (`/crm`) displays 1 new record.
6. Open Chrome DevTools Console and inspect the latest dataLayer event:
   - Execute: `window.dataLayer[window.dataLayer.length - 1]`
   - Verify that `form_id` is absent from the keys of the object.
   - Verify that `lead_type` is set to `"contact"`.
7. Inspect the on-page Observability Panel:
   - Expand the **Parameter Diff Viewer** to compare the expected frozen contract schema against the actual captured payload.

---

## 4. Technical Evidence

### 4.1 Actual Corrupted dataLayer Payload

```json
{
  "event": "demo_lead_success",
  "lead_type": "contact",
  "scenario": "defect-4",
  "submission_id": "9d81e3a4-84c1-4b72-b7e1-320c1f54d404",
  "attribution_status": "present",
  "debug_mode": true
}
```

*Defect verification notes:*
- `form_id` key is completely omitted (evaluated to `undefined` before push).
- `lead_type` is `"contact"` (expected `"agency_audit_inquiry"`).
- `submission_id` survived intact.

### 4.2 Parameter Schema Diff Comparison

| Parameter Key | Contract Specification | Actual Captured Payload | Status |
|---|---|---|---|
| `event` | `"demo_lead_success"` | `"demo_lead_success"` | Match |
| `form_id` | `"lead_audit_demo"` | *(omitted / undefined)* | **MISSING** |
| `lead_type` | `"agency_audit_inquiry"` | `"contact"` | **CORRUPTED** |
| `scenario` | `"defect-4"` | `"defect-4"` | Match |
| `submission_id` | `UUID v4` | `"9d81e3a4-84c1-4b72-b7e1-320c1f54d404"` | Match |
| `attribution_status` | `"present"` | `"present"` | Match |
| `debug_mode` | `true` | `true` | Match |

### 4.3 Intact CRM Record (`demo/data/crm-records.jsonl`)

The backend CRM received all form fields accurately:

```json
{
  "submission_id": "9d81e3a4-84c1-4b72-b7e1-320c1f54d404",
  "scenario": "defect-4",
  "full_name": "Pat Casey",
  "work_email": "pat.casey@domain.com",
  "company_name": "Cascade Growth Partners",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Analytics custom dimensions show (not set)",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T18:50:00.000Z",
  "lead_source": "google",
  "lead_source_detail": "cpc",
  "campaign_name": "responselock_demo",
  "gclid": "DEMO-GCLID-004",
  "mapping_status": "valid",
  "missing_fields": [],
  "intentionally_missing_fields": []
}
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **FAIL (Defect Proven)** | Form and CRM succeed, but dataLayer payload drops `form_id` and corrupts `lead_type`. |
| **Requires GTM Preview** | **VULNERABLE** | GTM Event fires, but dataLayer variables `dlv - form_id` return `undefined`. |
| **Requires GA4 DebugView** | **VULNERABLE** | GA4 event parameters show `form_id = (not set)` and `lead_type = contact`. |
| **Not tested in Google Ads** | **BOUNDARY** | Value rules based on `lead_type` fail to trigger in Google Ads conversion settings. |

---

## 6. Business Impact

1. **Broken Multi-Form Analytics**: When multiple lead generation forms exist on a site (e.g., Audit Inquiry vs. Newsletter vs. General Contact), missing `form_id` collapses all conversion events into a single undistinguished bucket. Marketers cannot determine which landing page form generated which lead.
2. **Failure of Value-Based Bidding**: High-intent audit inquiries carry significantly higher expected customer lifetime value than general inquiries. In Google Ads, conversion value rules assign values based on `lead_type`. Because the parameter is misreported as `'contact'`, Google Ads undervalues high-ticket agency leads and under-bids in competitive auctions.
3. **Executive Dashboard Reporting Errors**: Looker Studio or PowerBI executive reports show `(not set)` for primary lead categories, generating confusion and audit overhead.

---

## 7. Remediation Code Diff

Enforce strict contract typing in the frontend dispatch logic and map internal form state to the approved canonical contract parameters.

```diff
--- a/demo/src/components/forms/Defect4Form.tsx
+++ b/demo/src/components/forms/Defect4Form.tsx
@@ -42,14 +42,10 @@ export function Defect4Form() {
       const result = await response.json();
       if (response.ok) {
-        // DEFECTIVE: Unsafe manual object creation reading outdated property keys
-        window.dataLayer.push({
-          event: 'demo_lead_success',
-          form_id: (formData as Record<string, unknown>).formIdentifier, // resolves to undefined
-          lead_type: 'contact',                                        // stale fallback
-          scenario: 'defect-4',
-          submission_id: submissionId,
-          attribution_status: 'present',
-          debug_mode: true,
-        });
+        // REMEDIATION: Use frozen contract builder enforcing approved keys
+        window.dataLayer.push(
+          buildAnalyticsPayload({
+            scenario: 'defect-4',
+            submissionId,
+            attributionStatus: 'present',
+          })
+        );
         setSuccess(true);
       }
```
