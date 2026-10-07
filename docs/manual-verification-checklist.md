# ResponseLock Manual QA & Verification Checklist

**Purpose**: Comprehensive step-by-step manual verification protocol for human QA engineers, demonstration operators, and auditors.  
**Target Application**: Next.js 15 App Router (`http://localhost:3000`)  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit  

---

## 1. Preparation & Setup

Ensure the application is running in development mode before commencing manual QA:

```bash
# Start development server
cd demo
npm run dev
```

Open Chrome or Edge at `http://localhost:3000`. Open DevTools (F12) to the **Console** and **Network** tabs.

---

## 2. Global UI, Accessibility & Consent Mode v2 Verification

| Step | Action | Expected Observation | Pass / Fail |
|---|---|---|---|
| 2.1 | Navigate to `http://localhost:3000` | Page loads cleanly with navigation bar, status indicators, and scenario links. Zero console errors. | [ ] |
| 2.2 | Inspect `window.dataLayer` in DevTools Console | Initialized array contains Consent Mode v2 default denial (`ad_storage: 'denied'`, `analytics_storage: 'denied'`, `wait_for_update: 500`). | [ ] |
| 2.3 | Inspect floating Consent Banner | Banner is visible at bottom with "Accept All Cookies" and "Decline" buttons. | [ ] |
| 2.4 | Click "Accept All Cookies" (if consent UI is rendered on this route) | Verify the actual consent command in `window.dataLayer` or Tag Assistant. The timeline and Test Conditions flags are not proof of consent state. | [ ] |
| 2.5 | Keyboard Navigation Test | Press `Tab` continuously from top of page. Focus ring is clearly visible on every link, button, and input. No keyboard traps. | [ ] |
| 2.6 | Responsive Viewport Check | Switch DevTools to Responsive Mode at 360px width. Ensure zero horizontal scroll and all text remains legible. | [ ] |
| 2.7 | Color Contrast & Text Zoom | Zoom browser to 200%. Layout reflows gracefully without overlapping text. All text meets WCAG AA contrast. | [ ] |

---

## 3. Scenario 01: Baseline Intact Conversion Chain (`/scenario/baseline`)

### 3.1 Test Case A: Invalid Submission Rejection
1. If the test requires an empty CRM, preserve any records needed for review and use the explicit **Reset CRM Store** action in `/crm`. The Test Conditions panel does not reset the CRM.
2. Navigate to `http://localhost:3000/scenario/baseline`.
3. Leave all form fields blank.
4. Click **Submit Request**.

- [ ] **Client Validation**: Inline red error messages appear below Work Email, Full Name, Company Name, Ad Spend, and Primary Challenge.
- [ ] **Accessibility Wire**: Inputs carry `aria-invalid="true"` and `aria-describedby` pointing to error message IDs.
- [ ] **Network Egress**: Network tab confirms **0 requests** made to `/api/leads`.
- [ ] **CRM Persistence**: Navigate to `/crm`; table confirms **0 rows**.
- [ ] **Analytics dataLayer**: DevTools console confirms **0 `demo_lead_success` events** pushed.
- [ ] **Timeline (optional diagnostic)**: If the route emits a validation event, confirm its displayed content; the timeline is not a required proof for form validation.

### 3.2 Test Case B: Valid Submission Chain
1. Fill out the form with approved fictional data:
   - Full Name: `Demo User`
   - Work Email: `demo.user@example.com`
   - Company Name: `Example Media Group`
   - Monthly Ad Spend: `$10,000 - $50,000`
   - Primary Challenge: `Discrepancy between ad platform and CRM leads`
2. Click **Submit Request**.

- [ ] **In-Flight UI**: Submit button disables immediately, displays loading spinner or "Submitting...", preventing multi-clicks.
- [ ] **Network Request**: Exactly 1 POST request sent to `/api/leads` with `Idempotency-Key` header matching `submission_id`.
- [ ] **Response Status**: Server responds with `201 Created` after ~420ms deterministic latency sleep.
- [ ] **Success UI**: Success state renders from the server response containing the generated `submission_id`.
- [ ] **CRM Row**: Navigate to `/crm`; exactly **1 record** exists with status `Valid / Normal`.
- [ ] **Analytics Event**: `window.dataLayer` contains exactly **1 `demo_lead_success` event** with strictly the 7 approved keys:
  - `event: 'demo_lead_success'`
  - `form_id: 'lead_audit_demo'`
  - `lead_type: 'agency_audit_inquiry'`
  - `scenario: 'baseline'`
  - `submission_id: '<UUID-v4>'`
  - `attribution_status: 'present'` (or `'missing'`)
  - `debug_mode: true`
- [ ] **Zero PII**: No name, email, or phone exists in the dataLayer event object.

---

## 4. Scenario 02: Defect 1 — False Conversion on Invalid Submission (`/scenario/defect-1`)

1. Navigate to `http://localhost:3000/scenario/defect-1`.
2. Leave all fields empty.
3. Click **Submit Request**.

- [ ] **Button Click Action**: Button click listener fires immediately on user click, pushing `demo_lead_success` with `scenario: 'defect-1'` to `window.dataLayer`.
- [ ] **Validation Rejection**: Client validation runs and rejects the empty form, showing field error messages.
- [ ] **Network Tab**: Network tab confirms **0 requests** sent to `/api/leads`.
- [ ] **CRM Table**: Navigate to `/crm`; confirms **0 new records** added.
- [ ] **Defect Impact Confirmed**: **1 conversion event in analytics vs 0 CRM leads**. Ad network Smart Bidding would optimize toward accidental button clicks!
- [ ] **Verification Badges**: Page displays labels: *Confirmed locally*, *Requires GTM Preview*, *Requires GA4 DebugView*, *Not tested in Google Ads*.

---

## 5. Scenario 03: Defect 2 — Duplicate Conversion Push (`/scenario/defect-2`)

1. Navigate to `http://localhost:3000/scenario/defect-2`.
2. Fill the form with valid fictional details (`demo.user@example.com`, etc.).
3. Click **Submit Request**.

- [ ] **Pre-Submission Push**: Legacy click listener (`legacy-conversion-listener.ts`) pushes `demo_lead_success` immediately on click.
- [ ] **Post-Submission Push**: Post-success handler pushes `demo_lead_success` a second time upon receiving the 201 response.
- [ ] **Event Comparison**: Both events in `window.dataLayer` share the exact same `submission_id`.
- [ ] **CRM Deduplication**: Navigate to `/crm`; server-side idempotency ensures only **1 CRM record** was written.
- [ ] **Defect Impact Confirmed**: **2 conversion events in analytics for 1 genuine CRM lead**, cutting reported CPA in half.

---

## 6. Scenario 04: Defect 3 — Missing Conversion Due to Stale Typo (`/scenario/defect-3`)

1. Navigate to `http://localhost:3000/scenario/defect-3`.
2. Fill the form with valid fictional details.
3. Click **Submit Request**.

- [ ] **Form Success**: Form validates, posts to `/api/leads`, returns 201 Created, renders success banner.
- [ ] **CRM Stored**: Navigate to `/crm`; exactly 1 record is created.
- [ ] **dataLayer Inspection**: Inspect `window.dataLayer`. Notice the event name pushed is `'demo_lead_sucess'` (missing the second 'c').
- [ ] **GTM Trigger Disconnect**: Because GTM trigger filters for `'demo_lead_success'`, this misspelled event is completely ignored.
- [ ] **Defect Impact Confirmed**: **0 tracked conversions in GA4 / Google Ads despite 1 paying lead in CRM**.

---

## 7. Scenario 05: Defect 4 — Bad / Missing Event Parameters (`/scenario/defect-4`)

1. Navigate to `http://localhost:3000/scenario/defect-4`.
2. Fill the form and submit successfully.

- [ ] **dataLayer Inspection**: Event `'demo_lead_success'` is pushed.
- [ ] **Schema Drift**:
  - `form_id` is missing (`undefined` dropped by JSON serialization).
  - `lead_type` is set to stale value `'contact'` instead of `'agency_audit_inquiry'`.
- [ ] **Observability Diff Viewer**: Observability panel renders an automated diff showing the missing and altered parameters in red/green comparison.
- [ ] **Defect Impact Confirmed**: Conversion tags relying on `form_id` or `lead_type` fail to fire or record inaccurate conversion values.

---

## 8. Scenario 06: Defect 5 — UTM & GCLID Attribution Loss on SPA Navigation (`/scenario/defect-5`)

1. Navigate to:  
   `http://localhost:3000/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001`
2. **Step 1 Inspection**: Verify that Step 1 displays detected marketing parameters (`utm_source: google`, `gclid: DEMO-GCLID-001`).
3. Click **Next Step** to trigger client-side router navigation.
4. **URL Check**: Notice browser address bar transitions to `/scenario/defect-5/step-2` (or updates path) without query parameters.
5. Complete Step 2 fields and click **Submit Request**.

- [ ] **Attribution Engine Defect**: Form reads `window.location.search` at submission time instead of persistent storage.
- [ ] **dataLayer Status**: Event carries `attribution_status: 'dropped'`.
- [ ] **CRM Fields**: Navigate to `/crm`; lead record shows `lead_source: 'direct'`, `campaign_name: null`, and `gclid: null`.
- [ ] **Defect Impact Confirmed**: Paid search traffic ($350 lead) is erroneously categorized as direct organic traffic.

---

## 9. Scenario 07: Defect 6 — Incomplete / Mismapped CRM Record (`/scenario/defect-6`)

1. Navigate to `http://localhost:3000/scenario/defect-6` with sample UTM parameters.
2. Complete and submit the form.
3. Navigate to `http://localhost:3000/crm`.

- [ ] **Table Row Inspection**: Locate the newly created record.
- [ ] **Mapping Column**: Row is highlighted with a warning badge: `Mismapped`.
- [ ] **Missing Fields Column**: Notes `utm_campaign dropped`.
- [ ] **Source Column**: `lead_source` is empty (`-`), while `lead_source_detail` contains `google`.
- [ ] **Defect Impact Confirmed**: Client's CRM automation fails to route the lead to the paid media sales pod.

---

## 10. Simulated CRM Viewer & Reset Verification (`/crm`)

| Step | Action | Expected Observation | Pass / Fail |
|---|---|---|---|
| 10.1 | Open `http://localhost:3000/crm` | Page renders 10-column table with Submission ID, Scenario, Contact, Created, Lead Source, Source Detail, Campaign, GCLID, Mapping Status, Missing Fields. | [ ] |
| 10.2 | Permanent Banner Check | Top of page displays disclaimer: *This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records.* | [ ] |
| 10.3 | Click "Reset CRM Store" | A confirmation dialog or prompt appears. After confirming, all rows disappear, table displays "No records found". | [ ] |
| 10.4 | Verify File Reset | Inspect `demo/data/crm-records.jsonl`. File is empty (0 bytes). | [ ] |
| 10.5 | Production Guard Verification | In production build (`npm run start`), sending POST to `/api/dev/reset` returns `403 Forbidden`. | [ ] |

---

## 11. Observability Panel & Test Conditions Panel

| Step | Action | Expected Observation | Pass / Fail |
|---|---|---|---|
| 11.1 | Open Observability drawer where available | Panel displays recorded diagnostic events. The timeline may not contain a complete form/request trace. | [ ] |
| 11.2 | Expand entry payload where available | Confirm that supported PII fields are redacted in displayed payloads. Verify network requests in DevTools and do not treat the timeline as a substitute. | [ ] |
| 11.3 | Click "Copy Evidence Summary" | Clipboard contains formatted markdown table of events with timestamps and sanitized categories. | [ ] |
| 11.4 | Click "Download Sanitized Manifest" | Browser downloads `sanitized-evidence-manifest.json` containing structured event history. | [ ] |
| 11.5 | Open Test Conditions drawer | Toggle a diagnostic flag and inspect `window.__RL_TEST_CONDITIONS__`. The panel records the flag; it does not force an API response or request failure. | [ ] |
| 11.6 | Review ad-blocker flag | Toggle the panel flag and verify it is only a local diagnostic value. To test blocking, use a real browser extension and inspect blocked requests in DevTools. | [ ] |
| 11.7 | Review slow-network flag | Toggle the panel flag and verify it is only a local diagnostic value. It does not delay form requests. | [ ] |

---

## 12. Automated Pipeline Sign-Off

Execute the complete verification pipeline to ensure zero regressions:

```bash
# Full verification pipeline
npm run verify
```

- [ ] Stage 1: `npm run lint` PASSED (0 errors).
- [ ] Stage 2: `npm run typecheck` PASSED (0 errors).
- [ ] Stage 3: `npm run test:unit` PASSED (All unit tests pass).
- [ ] Stage 4: `npm run build` PASSED (Clean Next.js build).
- [ ] Stage 5: `npm run test:e2e` PASSED (All 8 scenarios pass Playwright + axe-core).
- [ ] Stage 6: `npm run scan:pii` PASSED (Zero PII leaks detected).
- [ ] Stage 7: `npm run check:docs` PASSED (All documentation commands valid).

**QA Lead Sign-off**: _______________________  
**Date**: ______________  
**Workspace Commit**: `build/conversion-integrity-demo`  
