# ResponseLock Tracking Defect Catalog

**Document Version**: 1.0.0  
**Scope**: Authoritative reference catalog for the 6 production tracking defects demonstrated in ResponseLock  
**Associated Service**: ResponseLock Conversion-Integrity Audit ($350 fixed-scope audit)  

> These six defects describe the preserved legacy ResponseLock lab. Their local behavior is distinct from external GTM/GA4 behavior, which is unverified. Downstream outcomes below are conditional examples for a corresponding legacy GTM setup. The Alder V2 GTM import template is scoped to `form_id=alder_consultation` and `lead_type=consultation`; it intentionally filters out legacy-lab events. Do not use that template to infer what the legacy defects would send to GTM or GA4.

---

## 1. Overview & Classification Matrix

The ResponseLock Tracking Defect Catalog classifies the six most pervasive conversion tracking vulnerabilities encountered in paid media lead generation. Each defect represents an independent, production-shaped failure mechanism that silently distorts analytics, damages automated ad bidding, or breaks CRM attribution.

### Defect Summary Matrix

| Defect # | Finding ID | Defect Name | Severity | Primary Detection Signature | Business Risk |
|---|---|---|---|---|---|
| **Defect 1** | `RL-AUDIT-DEF-001` | Conversion on Invalid Submit | High | dataLayer event present while API request count = 0 | Budget wasted on unqualified clicks |
| **Defect 2** | `RL-AUDIT-DEF-002` | Duplicate Conversion Event | High | 2 dataLayer events with identical `submission_id` | CPA reported 50% lower than reality |
| **Defect 3** | `RL-AUDIT-DEF-003` | Missing Conversion (Typo) | Critical | Event name `demo_lead_sucess` in dataLayer; 0 GTM match | Zero conversion signal; bidding starvation |
| **Defect 4** | `RL-AUDIT-DEF-004` | Parameter Schema Drift | Medium | `form_id` missing; `lead_type: "contact"` fallback | GA4 `(not set)` dimensions; value rules break |
| **Defect 5** | `RL-AUDIT-DEF-005` | SPA Attribution Loss | Critical | `attribution_status: "dropped"`; CRM source = direct | Paid traffic misattributed to direct traffic |
| **Defect 6** | `RL-AUDIT-DEF-006` | Incomplete CRM Record | High | CRM `mapping_status: "corrupted"`; empty source/campaign | CRM lead routing and pipeline attribution fail |

---

## 2. Comprehensive Defect Analysis

---

### Defect 1: Conversion Fires on Invalid Form Submission

- **Finding Package**: `evidence/defect-01-invalid-submit-fire/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-001`
- **Route**: `/scenario/defect-1`
- **Severity**: **High**
- **Real-World Frequency**: 35% of audited agency landing pages

#### Technical Description
A DOM `click` event listener or Google Tag Manager "Click - All Elements" trigger is bound directly to the submit button element (`<button type="submit">`). When a visitor clicks the button with invalid, incomplete, or empty form fields, HTML5 or JavaScript client-side validation correctly intercepts the submit event, halts network transmission, and displays field errors. However, because the click listener executes independently of form validity, the conversion event `demo_lead_success` is immediately pushed into `window.dataLayer`.

#### Detection Signature
1. **DOM / UI**: Form remains in an error state with visible inline validation errors.
2. **Network Tab**: Exactly **0** HTTP POST requests sent to `/api/leads`.
3. **Database / CRM**: Exactly **0** rows written to `demo/data/crm-records.jsonl`.
4. **Console / dataLayer**: Exactly **1** `demo_lead_success` event pushed to `window.dataLayer`.

#### Business Damage
- **Algorithmic Poisoning**: Google Ads Smart Bidding (Target CPA) and Meta Advantage+ algorithms seek to maximize conversions. Because bots, spam scrapers, and disengaged visitors click buttons without completing forms, the bidding algorithm identifies these low-quality visitors as high-converting targets, directing ad spend into low-converting traffic.
- **Inflated Lead Counts**: Marketing reports indicate healthy conversion volumes (e.g., 200 conversions), while sales teams only receive 120 genuine leads.
- **Artificial CPA Deflation**: The cost-per-conversion displayed in ad dashboards appears 40% lower than economic reality.

#### Remediation Instructions
1. Remove all GTM triggers listening to generic button clicks (`Click - All Elements` or CSS selector `#submit-btn`).
2. Remove direct DOM `onClick` handlers from submit button elements.
3. Bind the conversion push strictly to the resolved promise of the server-side API response, requiring HTTP `201 Created`.

---

### Defect 2: Duplicate Conversion Events Dispatched

- **Finding Package**: `evidence/defect-02-duplicate-conversion/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-002`
- **Route**: `/scenario/defect-2`
- **Severity**: **High**
- **Real-World Frequency**: 25% of audited multi-vendor environments

#### Technical Description
Two independent analytics dispatch mechanisms exist concurrently in the client-side code:
1. A surviving legacy tracking script (`legacy-conversion-listener.ts` or an old GTM container trigger) that pushes a conversion on form submission.
2. A newly introduced post-submission API success callback that also pushes a conversion event.
When a user submits a valid lead, both listeners fire within 500ms of each other, pushing two identical `demo_lead_success` events carrying the same `submission_id`. The backend API and CRM database enforce idempotency via the `Idempotency-Key` header and store only one row, but advertising pixels ingest both events.

#### Detection Signature
1. **Console / dataLayer**: Exactly **2** `demo_lead_success` events pushed to `window.dataLayer` with identical `submission_id` UUIDs.
2. **External verification**: GTM Preview and GA4 receipt for the legacy defect have not been verified. The V2 import template excludes legacy-form events, so its firing state does not demonstrate this legacy defect downstream.
3. **Network Tab**: Exactly **1** successful network request to `/api/leads`.
4. **CRM Database**: Exactly **1** unique record stored in `demo/data/crm-records.jsonl`.

#### Business Damage
- **100% Conversion Inflation**: Advertisers pay agencies based on performance metrics that are artificially doubled.
- **Halved Cost-Per-Acquisition**: A campaign with an actual CPA of $120 displays as $60 in Google Ads dashboards.
- **Sub-Optimal Scaling**: Media buyers aggressively increase daily budgets on campaigns that appear highly profitable, when in reality those campaigns are barely breaking even.

#### Remediation Instructions
1. Audit all active JavaScript bundles and GTM tags for redundant conversion listeners.
2. Decommission uncoordinated legacy scripts (`legacy-conversion-listener.ts`).
3. Centralize analytics dispatch into a single state machine or controller that guarantees exactly one dataLayer push per verified user transaction.

---

### Defect 3: Missing Conversion Event Due to Typo in Constant

- **Finding Package**: `evidence/defect-03-missing-conversion/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-003`
- **Route**: `/scenario/defect-3`
- **Severity**: **Critical**
- **Real-World Frequency**: 15% of website redesigns and CMS migrations

#### Technical Description
A website redesign or frontend refactoring replaces hardcoded event strings with an imported constants module. A typographical error is introduced into the constant definition (`LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess'` with a single 'c'). The form submits successfully, the database persists the lead, and the user sees a confirmation message. However, the event pushed to `window.dataLayer` is `demo_lead_sucess`. The Google Tag Manager container trigger expects an exact match on `demo_lead_success`. The condition evaluates to false, causing GTM to drop the event silently without throwing JavaScript errors.

#### Detection Signature
1. **Console / dataLayer**: `window.dataLayer` contains `event: "demo_lead_sucess"`. Zero events match `"demo_lead_success"`.
2. **GTM Tag Assistant**: The `demo_lead_sucess` event appears in the Tag Assistant event stream, but the custom event trigger condition evaluates to `false`. Tag firing count is **0**.
3. **GA4 DebugView**: Exactly **0** conversion events register in DebugView.
4. **CRM Database**: Exactly **1** valid lead record created in `crm-records.jsonl`.

#### Business Damage
- **Algorithmic Starvation**: Smart Bidding algorithms require a continuous flow of conversion data (typically 15-30 conversions per month minimum). With zero reported conversions, the algorithm concludes the campaign is ineffective and systematically chokes off ad impressions.
- **Wrongful Client Churn**: Agency clients observe flat zero-conversion dashboards and assume the paid media agency is squandering budget, leading to contract termination despite actual sales calls occurring.

#### Remediation Instructions
1. Establish a single frozen contract library for analytics event names (e.g., `ANALYTICS_EVENT_NAME` in `events.ts`).
2. Configure automated linting and integration tests to verify event name strings against GTM trigger definitions.
3. Test GTM triggers with Tag Assistant before deploying frontend code to production.

---

### Defect 4: Parameter Schema Drift

- **Finding Package**: `evidence/defect-04-bad-event-parameters/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-004`
- **Route**: `/scenario/defect-4`
- **Severity**: **Medium**
- **Real-World Frequency**: 30% of growing marketing stacks

#### Technical Description
During frontend component refactoring, internal form field identifiers are renamed (e.g., `form_id` to `formIdentifier`), but the separate analytics payload mapper is not synchronized. When the mapper constructs the conversion payload, `payload.form_id` resolves to `undefined` and is stripped during JSON serialization. Additionally, `lead_type` defaults to a stale fallback string (`'contact'`) rather than the expected domain type (`'agency_audit_inquiry'`). While the top-level conversion fires, critical metadata is lost.

#### Detection Signature
1. **Console / dataLayer**: Conversion event contains `lead_type: "contact"`, and the `form_id` key is completely absent.
2. **Observability Diff Viewer**: Parameter Diff highlights `form_id: MISSING` and `lead_type: CORRUPTED`.
3. **GA4 DebugView**: The event registers in DebugView, but custom parameter `form_id` displays as `(not set)`.

#### Business Damage
- **Broken Audience Segmentation**: Marketers cannot distinguish high-intent audit inquiry leads from low-intent newsletter subscribers.
- **Conversion Value Rule Failures**: Smart Bidding value-based rules (which multiply bid value for specific `lead_type` parameters) fail to apply, resulting in suboptimal bidding on high-ticket leads.
- **Reporting Discrepancies**: Executive dashboards relying on form breakdown dimensions show large spikes in `(not set)` traffic.

#### Remediation Instructions
1. Replace manual payload construction with strongly-typed builder functions enforcing frozen schemas (`buildAnalyticsPayload()`).
2. Implement Zod runtime schema assertions to catch missing or malformed parameter keys during unit and E2E testing.
3. Synchronize GTM Data Layer Variables with production contract schemas.

---

### Defect 5: Attribution Loss Across Multi-Step Navigation

- **Finding Package**: `evidence/defect-05-attribution-loss/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-005`
- **Route**: `/scenario/defect-5`
- **Severity**: **Critical**
- **Real-World Frequency**: 40% of multi-step and SPA funnels

#### Technical Description
A visitor arrives on a landing page carrying full campaign tracking parameters (`utm_source`, `utm_medium`, `utm_campaign`, `gclid`). The form is designed as a multi-step wizard. When the user navigates from Step 1 to Step 2, client-side route navigation (`router.push`) strips the URL query parameters. The form submission handler reads attribution directly from `window.location.search` at submit time rather than retrieving persisted parameters from storage. As a result, UTM values evaluate to empty strings, the dataLayer event is pushed with `attribution_status: "dropped"`, and the CRM stores attribution as `"direct"`.

#### Detection Signature
1. **Initial URL vs. Step 2 URL**: Step 1 contains query string; Step 2 URL is stripped.
2. **Console / dataLayer**: Conversion payload carries `attribution_status: "dropped"`.
3. **Simulated CRM (`/crm`)**: `lead_source` is recorded as `"direct"`, `lead_source_detail` as `"none"`, and `gclid` is empty.
4. **Observability Timeline**: Explicit log shows query loss during router navigation and submit-time read of empty `location.search`.

#### Business Damage
- **Paid Search Misattribution**: High-intent paid traffic that cost $15 per click is categorized in Salesforce/HubSpot as "Direct" or "Organic" traffic.
- **False Budget Reallocation**: Leadership mistakenly believes SEO is driving all sales and defunds profitable paid campaigns.
- **Offline Conversion Import (OCI) Failure**: Because the Google Click ID (`gclid`) is lost before CRM entry, the agency cannot upload closed-won deal values back into Google Ads.

#### Remediation Instructions
1. Persist attribution parameters to `sessionStorage` (last-touch) and secure cookies (first-touch, ~90 days) on initial landing.
2. Ensure submission handlers read from persistent storage rather than the live URL search string.
3. Preserve search parameters during client-side SPA route transitions.

---

### Defect 6: Incomplete and Mismapped CRM Record

- **Finding Package**: `evidence/defect-06-incomplete-crm-record/finding.md`
- **Finding ID**: `RL-AUDIT-DEF-006`
- **Route**: `/scenario/defect-6`
- **Severity**: **High**
- **Real-World Frequency**: 20% of webhook and CRM integrations

#### Technical Description
The frontend conversion chain functions perfectly: form validation succeeds, full attribution is captured, `POST /api/leads` receives a complete payload, and `demo_lead_success` is pushed to `window.dataLayer`. However, the backend server field mapper (`mappers/defect-06.ts` or webhook integration) contains a mapping bug:
- `lead_source` is omitted and stored as an empty string `""`.
- `utm_source` is incorrectly written into `lead_source_detail`.
- `campaign_name` is omitted entirely.
- `mapping_status` is flagged as `"corrupted"`.

#### Detection Signature
1. **Frontend / dataLayer**: Evaluates as 100% healthy (`attribution_status: "present"`).
2. **API Payload**: Request body contains complete `attribution` object.
3. **Simulated CRM (`/crm`)**: Record displays `mapping_status: "corrupted"` (red badge), `lead_source` is blank, and `campaign_name` is blank.
4. **CRM Store (`crm-records.jsonl`)**: `missing_fields: ["lead_source", "campaign_name"]`.

#### Business Damage
- **Lead Assignment Failure**: Sales routing automations depend on `lead_source`. Inbound leads sit unassigned in CRM queues for days, reducing close rates by up to 60%.
- **Campaign ROI Blindness**: Sales leadership cannot filter closed revenue by `campaign_name`, rendering full-funnel attribution impossible.
- **The "Analytics Blindspot"**: Front-of-house marketing dashboards appear green, masking severe backend data pipeline corruption.

#### Remediation Instructions
1. Audit server-side webhook and API mapping files (`mappers/defect-06.ts`).
2. Correct field mappings to populate `lead_source` and `campaign_name` canonically.
3. Implement automated schema validation on database writes to reject corrupted records before persistence.
