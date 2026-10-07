# ResponseLock Interface Contracts & Architectural Invariants

**Status**: Legacy contract frozen; V2 analytics contract is additive
**Location**: `demo/src/lib/contracts/`
**Last Updated**: 2026-09-18

---

> ### ⚠️ SUB-AGENT READ SCOPE RULE (BINDING ON ALL SUB-AGENTS)
> Sub-agents may read `src/lib/contracts/**`, `docs/CONTRACTS.md`, `.orchestration/ownership-map.md`, and their own owned paths.
> Sub-agents may **NOT** read other agents' implementation or test files, and may **NOT** read `node_modules`.
> All coordination between modules must happen through the frozen contracts documented in this file.

---

## 1. Overview & Purpose

The ResponseLock Lead & Conversion Integrity Demo Workspace makes the marketing conversion chain observable, inspectable, and breakable:
`ad click -> landing page with UTM/GCLID -> attribution capture -> form validation -> submission -> dataLayer -> GTM -> GA4 -> Google Ads (conceptual) -> CRM record`.

To ensure all parallel sub-agents (Wave 1 baseline, defects 1-6, CRM viewer, observability panel) work together without collisions, all interfaces are frozen in this Contract Pack.

---

## 2. Contract Modules Summary

| Module | File Path | Primary Responsibilities |
|---|---|---|
| **Events** | `demo/src/lib/contracts/events.ts` | `ANALYTICS_EVENT_NAME`, `LEGACY_MISSPELLED_EVENT`, `ScenarioId`, 7 approved keys, `buildAnalyticsPayload()` |
| **CRM** | `demo/src/lib/contracts/crm.ts` | `LeadSubmissionPayload`, `CrmRecord`, `CrmFieldMap`, canonical CRM field names |
| **Attribution** | `demo/src/lib/contracts/attribution.ts` | `AttributionState`, `AttributionStatus`, storage keys, `deriveAttributionStatus()` |
| **Timeline** | `demo/src/lib/contracts/timeline.ts` | 9 `TimelineCategory` values, `TimelineEntry`, `SanitizedEvidenceManifest` |
| **Routes** | `demo/src/lib/contracts/routes.ts` | 10 routes registry, metadata, 4 verification layers |
| **Schemas** | `demo/src/lib/contracts/schema.ts` | Zod schemas for `/api/leads` request/response, validation errors |

---

## 3. Behavioral Invariants

### 3.1 Strict Zero-PII Policy in Analytics
- **Forbidden in dataLayer**: Full names, email addresses, phone numbers, notes, raw URLs.
- **Enforcement**: `buildAnalyticsPayload()` asserts no PII exists in keys or values, and filters the object down to exactly the 7 approved keys:
  1. `event` (`'demo_lead_success'` or `'demo_lead_sucess'`)
  2. `form_id` (`'lead_audit_demo'`)
  3. `lead_type` (`'agency_audit_inquiry'`)
  4. `scenario` (`ScenarioId`)
  5. `submission_id` (UUID v4)
  6. `attribution_status` (`'present' | 'partial' | 'missing' | 'dropped'`)
  7. `debug_mode` (`true`)

### 3.2 Alder V2 Analytics Contract (Additive)

The V2 Alder flow uses helpers in `demo/src/lib/v2-events.ts`; it does not change the frozen seven-key legacy builder above. Its successful event has exactly fourteen fields: `event`, `form_id`, `lead_type`, `scenario`, `submission_id`, `attribution_status`, `debug_mode`, `timestamp`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, and `gclid`.

- `event`: exactly `demo_lead_success`
- `form_id`: exactly `alder_consultation`
- `lead_type`: exactly `consultation`
- `scenario`: exactly `baseline`
- `submission_id`: UUID returned by the local API and matching the request
- `attribution_status`: `present`, `partial`, `missing`, or `dropped`
- `debug_mode`: `true`; `timestamp`: ISO date-time from the confirmed receipt
- The six allowlisted attribution values are sanitized and empty strings when absent. Names, email addresses, phone numbers, free text, raw URLs, and other attribution keys are excluded.
- The event is pushed only after a Zod-valid success receipt matches both the request ID and the baseline scenario. A session-scoped ID guard prevents duplicate pushes after replay. Until the request is confirmed or canceled, the full pending request (including form values) is kept in that tab's `sessionStorage` so refresh and retry reuse the original payload and idempotency key. The pending record is cleared on success or start-over; it is separate from the PII-free dataLayer event.

The GTM import template filters on the exact event, Alder form ID, lead type, and a UUID-shaped submission ID. It excludes legacy lab events and the intentionally broken Alder mini-form event. GTM import and downstream event delivery remain unverified.

### 3.3 Legacy Baseline Conversion Chain
1. User completes form controls.
2. Client validation executes.
3. Client generates `submission_id` (UUID v4).
4. Attribution state is retrieved from storage.
5. POST `/api/leads` sent with `Idempotency-Key: <submission_id>`.
6. Server independently validates payload and returns 201 Created.
7. Exactly 1 record written to `demo/data/crm-records.jsonl`.
8. Success UI renders from the 201 server response.
9. Exactly 1 `demo_lead_success` event pushed to `window.dataLayer`.
10. The success UI reflects the validated server receipt and the canonical event is pushed to `window.dataLayer`. The legacy observability timeline is not a complete trace of this form flow; do not use it as proof that each request or event occurred.

### 3.4 Legacy Invalid Form Rejection Invariant
When validation fails on an invalid form:
- Inline field errors render.
- Zero network requests are dispatched (0 calls to `/api/leads`).
- Zero CRM rows are written.
- Zero success events pushed to `window.dataLayer`.
- Success state does NOT render.

---

## 4. Defect Contract Specifications

| Scenario | Route | Defect Mechanism | Expected dataLayer | Expected CRM |
|---|---|---|---|---|
| **Baseline** | `/scenario/baseline` | None (intact) | 1 x `demo_lead_success` | 1 valid row |
| **Defect 1** | `/scenario/defect-1` | Click listener on submit button fires before validation | 1 x `demo_lead_success` on invalid submit | 0 rows |
| **Defect 2** | `/scenario/defect-2` | Legacy click listener + post-success listener | 2 x `demo_lead_success` with same `submission_id` | 1 valid row (idempotent) |
| **Defect 3** | `/scenario/defect-3` | Stale constant `LEGACY_MISSPELLED_EVENT` (`'demo_lead_sucess'`) | 1 x `demo_lead_sucess` (0 match in GTM) | 1 valid row |
| **Defect 4** | `/scenario/defect-4` | Schema drift: `form_id` dropped, `lead_type: 'contact'` | 1 x `demo_lead_success` with bad parameters | 1 valid row |
| **Defect 5** | `/scenario/defect-5` | Reads `window.location.search` instead of storage after step navigation | 1 x `demo_lead_success` (`attribution_status: 'dropped'`) | 1 row with empty attribution |
| **Defect 6** | `/scenario/defect-6` | Server mapper `mappers/defect-06.ts` drops campaign, swaps source | 1 x `demo_lead_success` | 1 mismapped row |
