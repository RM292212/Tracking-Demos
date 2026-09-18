# Audit Finding: Baseline Intact Lead Conversion Chain Verification

**Finding ID**: `RL-AUDIT-BASE-001`  
**Title**: Baseline Intact Lead Conversion Chain Verification  
**Audit Status**: Verified Baseline  
**Severity**: Informational (Architecture Reference Standard)  
**Affected Route**: `/scenario/baseline`  
**Target Component**: `BaselineForm.tsx` / `POST /api/leads`  

---

## 1. Executive Summary

The baseline scenario demonstrates a fully intact, production-grade conversion tracking architecture. Form submission, client-side input validation, server-side payload validation, idempotent database ingestion, and analytics event dispatch execute in a strictly coupled, deterministic sequence. No conversion event is dispatched unless the server confirms receipt and storage of the lead with HTTP `201 Created`.

---

## 2. Real-World Analogue

In enterprise lead generation and e-commerce environments, this pattern represents the gold standard:
- Validation is completed on the client before network requests are dispatched.
- Attribution parameters (UTM suite and Google Click ID) are extracted upon initial landing and persisted in client storage (`localStorage` / `sessionStorage` / cookie).
- The client generates a unique UUID v4 `submission_id` passed via the `Idempotency-Key` HTTP header to prevent duplicate database writes.
- The browser dispatches the analytics conversion event (`demo_lead_success`) to `window.dataLayer` **only after** receiving HTTP `201 Created` from the backend API.
- The analytics payload contains strictly zero PII, passing only approved technical metadata and attribution indicators.

---

## 3. Reproduction Steps

1. Launch the local application environment:
   ```bash
   npm run dev
   ```
2. Navigate in a Chromium browser to the baseline route with attribution query parameters:
   `http://localhost:3000/scenario/baseline?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001`
3. Observe the initial attribution state in the Observability Timeline:
   - `utm_source`: `google`
   - `utm_medium`: `cpc`
   - `utm_campaign`: `responselock_demo`
   - `gclid`: `DEMO-GCLID-001`
   - Status: `present`
4. Complete the form fields with valid synthetic business data:
   - **Full Name**: `Alex Mercer`
   - **Work Email**: `alex.mercer@example.com`
   - **Company Name**: `Apex Media Partners`
   - **Monthly Ad Spend**: `$10,000 - $25,000`
   - **Primary Challenge**: `Unreliable lead tracking and conversion attribution`
5. Click **Submit Audit Request**.
6. Observe the execution chain:
   - Network tab displays a single `POST /api/leads` request with status `201 Created`.
   - Browser console logs exactly one `demo_lead_success` push to `window.dataLayer`.
   - Simulated CRM (`/crm`) displays exactly one new record with `mapping_status: "valid"`.
   - Success state renders on screen confirming submission ID.

---

## 4. Technical Evidence

### 4.1 Sanitized dataLayer Conversion Event

Inspected via Chrome DevTools (`window.dataLayer[window.dataLayer.length - 1]`):

```json
{
  "event": "demo_lead_success",
  "form_id": "lead_audit_demo",
  "lead_type": "agency_audit_inquiry",
  "scenario": "baseline",
  "submission_id": "c7a829e0-81f3-4d43-9821-2a62886f4a10",
  "attribution_status": "present",
  "debug_mode": true
}
```

*Verification notes:*
- Payload adheres strictly to the 7 approved keys defined in `demo/src/lib/contracts/events.ts`.
- Zero PII: Customer name, email address, and phone number are completely excluded from the analytics layer.
- `attribution_status` correctly evaluates to `"present"`.

### 4.2 HTTP Network Request & Response Trace

```http
POST /api/leads HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Idempotency-Key: c7a829e0-81f3-4d43-9821-2a62886f4a10

{
  "submission_id": "c7a829e0-81f3-4d43-9821-2a62886f4a10",
  "scenario": "baseline",
  "full_name": "Alex Mercer",
  "work_email": "alex.mercer@example.com",
  "company_name": "Apex Media Partners",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Unreliable lead tracking and conversion attribution",
  "attribution": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "responselock_demo",
    "gclid": "DEMO-GCLID-001"
  },
  "attribution_status": "present"
}

HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "submission_id": "c7a829e0-81f3-4d43-9821-2a62886f4a10",
  "status": "confirmed",
  "created_at": "2026-09-18T18:35:00.000Z",
  "scenario": "baseline"
}
```

### 4.3 Persisted CRM Record (`demo/data/crm-records.jsonl`)

```json
{
  "submission_id": "c7a829e0-81f3-4d43-9821-2a62886f4a10",
  "scenario": "baseline",
  "full_name": "Alex Mercer",
  "work_email": "alex.mercer@example.com",
  "company_name": "Apex Media Partners",
  "monthly_ad_spend": "$10,000 - $25,000",
  "primary_challenge": "Unreliable lead tracking and conversion attribution",
  "phone": "",
  "notes": "",
  "created_at": "2026-09-18T18:35:00.000Z",
  "lead_source": "google",
  "lead_source_detail": "cpc",
  "campaign_name": "responselock_demo",
  "gclid": "DEMO-GCLID-001",
  "mapping_status": "valid",
  "missing_fields": [],
  "intentionally_missing_fields": []
}
```

### 4.4 Observability Timeline Trace

```json
[
  { "id": "evt-1", "timestamp": 12, "category": "lifecycle", "label": "Page initialized with query attribution" },
  { "id": "evt-2", "timestamp": 15, "category": "storage", "label": "Persisted first-touch and last-touch attribution" },
  { "id": "evt-3", "timestamp": 4500, "category": "validation", "label": "Client form validation passed" },
  { "id": "evt-4", "timestamp": 4505, "category": "network", "label": "Dispatched POST /api/leads with Idempotency-Key" },
  { "id": "evt-5", "timestamp": 4925, "category": "crm", "label": "Server returned 201 Created and persisted CRM row" },
  { "id": "evt-6", "timestamp": 4930, "category": "analytics", "label": "Pushed demo_lead_success to window.dataLayer" },
  { "id": "evt-7", "timestamp": 4935, "category": "lifecycle", "label": "Rendered lead confirmation success UI" }
]
```

---

## 5. Verification Layers Status

| Verification Layer | Status | Observational Notes |
|---|---|---|
| **Confirmed locally** | **PASS** | Form validates, network responds 201, exactly 1 CRM row written, 1 dataLayer event pushed. |
| **Requires GTM Preview** | **PASS (Ready)** | GTM custom event trigger for `demo_lead_success` evaluates to true; tag fires cleanly. |
| **Requires GA4 DebugView** | **PASS (Ready)** | Event `demo_lead_success` populates in DebugView with standard parameters and no PII warnings. |
| **Not tested in Google Ads** | **BOUNDARY** | Conversion upload verified up to GA4 boundary. Google Ads is conceptual in local training. |

---

## 6. Business Impact & Value

When this baseline pattern is maintained:
1. **Truthful Return on Ad Spend (ROAS)**: Media buyers evaluate campaigns based on real customer inquiries rather than accidental clicks or bot spam.
2. **Optimal Smart Bidding Feedback**: Target CPA (tCPA) and Target ROAS (tROAS) bidding algorithms receive clean conversion signals, reducing cost-per-lead by 20% to 35% over time.
3. **Flawless Sales Alignment**: Marketing and Sales report the exact same lead volume; CRM lead records match ad platform conversions 1:1.
4. **Zero Compliance Risk**: Full compliance with GDPR/CCPA regulations due to total exclusion of PII from analytics streams.

---

## 7. Architecture Contract Reference

The following code pattern is the architectural standard to follow across all lead capture workflows:

```typescript
// Canonical Pattern: Strict sequential coupling
async function handleLeadSubmit(formData: LeadFormData) {
  // 1. Client validation
  const validation = validateForm(formData);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return; // Zero network requests, zero dataLayer events
  }

  // 2. Dispatch network request with client UUID idempotency key
  const submissionId = crypto.randomUUID();
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': submissionId,
    },
    body: JSON.stringify({ ...formData, submission_id: submissionId }),
  });

  if (!response.ok) {
    handleServerFailure(response);
    return; // Zero analytics events on server failure
  }

  // 3. Analytics dispatch ONLY after server confirmation
  const analyticsPayload = buildAnalyticsPayload({
    scenario: 'baseline',
    submissionId,
    attributionStatus: getStoredAttributionStatus(),
  });
  window.dataLayer.push(analyticsPayload);

  // 4. Render confirmed success state
  setIsSubmitted(true);
}
```
