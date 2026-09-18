# ResponseLock Interface Contracts & Architectural Invariants

**Status**: FROZEN (Wave 0)  
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

### 3.2 Baseline Conversion Chain (Enforced Order)
1. User completes form controls.
2. Client validation executes.
3. Client generates `submission_id` (UUID v4).
4. Attribution state is retrieved from storage.
5. POST `/api/leads` sent with `Idempotency-Key: <submission_id>`.
6. Server independently validates payload and returns 201 Created.
7. Exactly 1 record written to `demo/data/crm-records.jsonl`.
8. Success UI renders from the 201 server response.
9. Exactly 1 `demo_lead_success` event pushed to `window.dataLayer`.
10. Observability timeline shows full sequence.

### 3.3 Invalid Form Rejection Invariant
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
