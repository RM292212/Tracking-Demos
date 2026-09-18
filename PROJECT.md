# Project: ResponseLock Week-1 Conversion-Integrity Demo Workspace

## Architecture
- **Tech Stack**: Next.js App Router (in `demo/`), React 19, TypeScript `strict: true` with `noUncheckedIndexedAccess`, CSS Modules + `tokens.css`, Zod 3.x, Vitest, Playwright (Chromium only), @axe-core/playwright.
- **Package Manager**: npm 11.16.0 (Node v24.18.0).
- **Application Structure**:
  - `demo/src/app/`: Root layout with `<GtmScript />`, Consent Mode v2 default denial, routes (`/`, `/scenario/baseline`, `/scenario/defect-1` through `defect-6`, `/crm`, `/evidence`).
  - `demo/src/components/`: Baseline form, defect-specific form variations, Observability panel, Simulated CRM viewer table, Consent banner.
  - `demo/src/lib/contracts/`: Frozen Contract Pack (`events.ts`, `crm.ts`, `attribution.ts`, `timeline.ts`, `routes.ts`, `schema.ts`).
  - `demo/src/lib/`: `env.ts` (validated GTM/GA4 config), `crm-store.ts` (JSONL store with async mutex), `attribution.ts` (first-touch / last-touch storage).
  - `demo/src/app/api/`: `POST /api/leads`, `GET /api/crm`, `POST /api/dev/reset`.
  - `demo/scripts/`: `scan-pii.mjs`, `check-docs-commands.mjs`, `emit-matrix.mjs`.
  - `docs/`: 15 comprehensive documentation files and guides.
  - `evidence/`: 7 finding packages (`baseline/` and `defect-01-*` through `defect-06-*`).
  - `gtm/`: `responselock-demo-container.json` and `IMPORT-NOTES.md`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Environment Inspection & Git Init | Init local git repo on `build/conversion-integrity-demo`, setup strict `.gitignore` | M0 | ORIGINAL_REQUEST §Environment |
| 2 | Next.js App Router Scaffold | Scaffold Next.js in `demo/`, configure tsconfig with `strict` and `noUncheckedIndexedAccess` | M0 | ORIGINAL_REQUEST §R1 |
| 3 | Named Stack Dependencies | Install only approved deps (Next, React, TS, Zod, Vitest, Playwright, @axe-core/playwright) | M0 | ORIGINAL_REQUEST §Integrity |
| 4 | Frozen Contract Pack | Implement `events.ts`, `crm.ts`, `attribution.ts`, `timeline.ts`, `routes.ts`, `schema.ts` in `src/lib/contracts/` | M0 | ORIGINAL_REQUEST §Contract Pack |
| 5 | Contract Documentation | Write `docs/CONTRACTS.md` detailing contracts and subagent read rules | M0 | ORIGINAL_REQUEST §Contract Pack |
| 6 | Style Tokens | Create `demo/src/styles/tokens.css` with colors, spacing, typography, focus rings | M0 | ORIGINAL_REQUEST §R1 |
| 7 | Environment Module | Create `demo/src/lib/env.ts` validating GTM ID (`/^GTM-[A-Z0-9]{7,}$/`) & GA4 ID via Zod | M0 | ORIGINAL_REQUEST §R1 |
| 8 | Core Layout & GtmScript | Root layout with `<GtmScript />` (afterInteractive, regex check, strict mode guard, pre-GTM Consent Mode v2 default denial) | M0 | ORIGINAL_REQUEST §R1 |
| 9 | Local JSONL Store with Mutex | `demo/src/lib/crm-store.ts` managing `demo/data/crm-records.jsonl` with async mutex | M0 | ORIGINAL_REQUEST §R1, R4 |
| 10 | Leads API Endpoint | `POST /api/leads` with Idempotency-Key validation, Zod check, honeypot check, deterministic latency sleep (420ms), 201/400 responses | M0 | ORIGINAL_REQUEST §R1, R3, R4 |
| 11 | Dev Reset & CRM API | `POST /api/dev/reset` guarded by dev mode; `GET /api/crm` returning stored JSONL records | M0 | ORIGINAL_REQUEST §R4, R6 |
| 12 | Guard Scripts | `scan-pii.mjs`, `check-docs-commands.mjs`, `emit-matrix.mjs` in `demo/scripts/` | M0 | ORIGINAL_REQUEST §R6 |
| 13 | Package Scripts & Test Harness | Root/demo package.json scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `scan:pii`, `check:docs`, `verify`) | M0 | ORIGINAL_REQUEST §R6 |
| 14 | Wave 0 Smoke Test & Commit | Prove contracts, layout, store, and scripts; stage Wave 0 commit on `build/conversion-integrity-demo` | M0 | ORIGINAL_REQUEST §Wave Plan |
| 15 | Baseline Lead Capture Form | Accessible `<form noValidate>`, 12-step submission chain, 7 approved keys, zero network on invalid | M1 | ORIGINAL_REQUEST §R1 |
| 16 | Attribution Persistence Engine | First-touch (~90 day cookie) & last-touch (sessionStorage) capturing UTM/GCLID, status derivation | M1 | ORIGINAL_REQUEST §R3 |
| 17 | Defect 1: Invalid Submit Conversion | Click listener on submit button pushes `demo_lead_success` on invalid submit before validation | M1 | ORIGINAL_REQUEST §R2 |
| 18 | Defect 2: Duplicate Conversion | Surviving legacy click listener + post-success listener push same `submission_id` | M1 | ORIGINAL_REQUEST §R2 |
| 19 | Defect 3: Missing Conversion | Typo in event constant (`LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess'`) causes missing conversion | M1 | ORIGINAL_REQUEST §R2 |
| 20 | Defect 4: Bad Event Parameters | Payload mapper reads renamed keys -> `form_id` dropped, stale `lead_type`; diff viewer | M1 | ORIGINAL_REQUEST §R2 |
| 21 | Defect 5: Attribution Loss | Step navigation drops query params; reads `window.location.search` instead of storage | M1 | ORIGINAL_REQUEST §R2 |
| 22 | Defect 6: Incomplete CRM Record | `mappers/defect-06.ts` drops campaign, puts source in detail, leaves source empty | M1 | ORIGINAL_REQUEST §R2 |
| 23 | Verification Layer Labels | 4 labels on each defect page: Confirmed locally / Requires GTM / Requires GA4 / Not tested Ads | M1 | ORIGINAL_REQUEST §R2 |
| 24 | Observability Timeline Panel | Chronological timeline, 9 categories, PII redaction, copy/download sanitized evidence | M1 | ORIGINAL_REQUEST §R4 |
| 25 | Simulated CRM Viewer (/crm) | 10-column table, permanent disclaimer banner, mapping status badges | M1 | ORIGINAL_REQUEST §R4 |
| 26 | Production Realism Controls | Consent Mode v2 banner/toggle, Test Conditions panel (ad-blocker, API 500, timeout, slow net) | M1 | ORIGINAL_REQUEST §R3 |
| 27 | Evidence Packages | `evidence/baseline/` and `evidence/defect-01-*` to `defect-06-*` with `finding.md` and `.gitkeep` | M1 | ORIGINAL_REQUEST §R4 |
| 28 | Comprehensive Documentation Suite | 15 markdown docs in `docs/`, GTM container export + notes, audit template, $350 scope, access | M1 | ORIGINAL_REQUEST §R5 |
| 29 | Wave 1 Staged Commit | Commit Wave 1 implementation on `build/conversion-integrity-demo` | M1 | ORIGINAL_REQUEST §Wave Plan |
| 30 | Wave 2 Determinism Red-Team | Audit clock/ID generation, async mutex safety, deterministic latency, no Math.random() | M2 | ORIGINAL_REQUEST §Wave Plan |
| 31 | Wave 2 Documentation Accuracy | Verify all doc paths, commands, schemas, and troubleshooting scenarios against code | M2 | ORIGINAL_REQUEST §Wave Plan |
| 32 | Wave 2 Beginner Simulator | Test runbook instructions step-by-step from clean environment perspective | M2 | ORIGINAL_REQUEST §Wave Plan |
| 33 | Wave 2 Safety Audit | Audit against 15 binding safety rules (no egress, fictional data, gitignore integrity) | M2 | ORIGINAL_REQUEST §Wave Plan |
| 34 | Automated Unit & E2E Test Suite | Vitest unit tests for contracts/schemas/mappers; Playwright tests for 8 scenarios + axe-core a11y | M3 | ORIGINAL_REQUEST §R6 |
| 35 | Wave 3 Full Verification Pipeline | Run `npm run verify` (= lint -> typecheck -> unit -> build -> e2e -> scan:pii -> check:docs) | M3 | ORIGINAL_REQUEST §R6 |
| 36 | Canonical Verification Matrix | Generate `demo/test-results/verification-matrix.md` via `scripts/emit-matrix.mjs` | M3 | ORIGINAL_REQUEST §Verification |
| 37 | Final Staged Commits & Report | Stage final commits on `build/conversion-integrity-demo`, format 17-section report | M3 | ORIGINAL_REQUEST §Final Report |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Wave 0: Scaffold, Contracts, Core Layout, Store, API & Harness | Features 1–14: git init, Next.js in demo/, contracts, tokens, layout, env, jsonl store, leads/crm/reset API, scripts, smoke test, Wave 0 commit | none | IN_PROGRESS |
| M1 | Wave 1: Baseline Form, 6 Defects, Observability, CRM, Docs & Evidence | Features 15–29: Baseline form, 6 isolated defects, realism controls, observability panel, /crm, evidence packages, 15 docs, Wave 1 commit | M0 | PLANNED |
| M2 | Wave 2: Adversarial Review Rounds | Features 30–33: Determinism Red-Team, Doc Accuracy, Beginner Simulator, Safety Audit | M1 | PLANNED |
| M3 | Wave 3: Verification Pipeline, Verification Matrix, Final Commits | Features 34–37: Automated test suite, `npm run verify`, canonical matrix via `emit-matrix.mjs`, final staged commits, final report | M2 | PLANNED |

## Interface Contracts

### Client ↔ Server (Leads API: `POST /api/leads`)
- **Headers**: `Content-Type: application/json`, `Idempotency-Key: <submission_id>` (UUID v4).
- **Request Body**: Validated against `LeadSubmissionPayloadSchema` (`schema.ts`).
- **Processing**:
  1. Validate `Idempotency-Key` equals body `submission_id`.
  2. Check honeypot field (`website` / `fax`); reject with 400 if populated.
  3. Validate fields server-side with Zod (`work_email`, `full_name`, `company_name`, `monthly_ad_spend`, `primary_challenge`).
  4. Check for existing record by `submission_id`; return 200/201 with existing record if duplicate.
  5. Apply scenario mapper (`CrmFieldMap`).
  6. Sleep deterministic latency (constant 420ms).
  7. Write single JSONL row via Async Mutex.
  8. Return `201 Created` with `{ success: true, submission_id, status: 'confirmed', created_at }`.
- **Failure**: Return `400 Bad Request` with `{ success: false, errors: { field: message } }`. Zero CRM writes.

### Dev-Guarded Reset API: `POST /api/dev/reset`
- **Guard**: `NODE_ENV !== 'production'`. Return 403 if production.
- **Action**: Truncate `demo/data/crm-records.jsonl` under Async Mutex lock.
- **Response**: `{ success: true, message: 'CRM store reset' }`.

### Client ↔ window.dataLayer (`demo_lead_success`)
- **Approved Keys Whitelist (STRICT)**:
  1. `event`: `'demo_lead_success'`
  2. `form_id`: `'lead_audit_demo'`
  3. `lead_type`: `'agency_audit_inquiry'`
  4. `scenario`: `'baseline'` | `'defect-1'` | ... | `'defect-6'`
  5. `submission_id`: UUID v4
  6. `attribution_status`: `'present'` | `'partial'` | `'missing'` | `'dropped'`
  7. `debug_mode`: `true`
- **Zero PII**: No names, emails, phones, free text, or raw URLs.

### Consent Mode v2 Default Denial
- Executed BEFORE GTM snippet:
  `window.dataLayer = window.dataLayer || [];`
  `function gtag(){dataLayer.push(arguments);}`
  `gtag('consent', 'default', { 'ad_storage': 'denied', 'analytics_storage': 'denied', 'ad_user_data': 'denied', 'ad_personalization': 'denied', 'wait_for_update': 500 });`

## Code Layout
```
(root: C:\Users\Ranji\code-base\RL-Demo)
├── README.md
├── STATUS.md
├── CHANGELOG.md
├── .gitignore
├── PROJECT.md
├── ORIGINAL_REQUEST.md
├── .orchestration/
│   ├── task-graph.md
│   ├── ownership-map.md
│   └── reports/
├── docs/
│   ├── CONTRACTS.md
│   ├── environment.md
│   ├── architecture.md
│   ├── week-1-checklist.md
│   ├── demo-runbook.md
│   ├── demo-safety-rules.md
│   ├── gtm-setup.md
│   ├── gtm-manual-steps.md
│   ├── ga4-debugview-setup.md
│   ├── google-ads-boundary.md
│   ├── evidence-capture-guide.md
│   ├── troubleshooting.md
│   ├── defect-catalog.md
│   ├── client-explanation-scripts.md
│   └── manual-verification-checklist.md
├── gtm/
│   ├── responselock-demo-container.json
│   └── IMPORT-NOTES.md
├── demo/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   ├── .env.example
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── crm/page.tsx
│   │   │   ├── evidence/page.tsx
│   │   │   ├── scenario/
│   │   │   │   ├── baseline/page.tsx
│   │   │   │   ├── defect-1/page.tsx
│   │   │   │   ├── defect-2/page.tsx
│   │   │   │   ├── defect-3/page.tsx
│   │   │   │   ├── defect-4/page.tsx
│   │   │   │   ├── defect-5/page.tsx
│   │   │   │   └── defect-6/page.tsx
│   │   │   └── api/
│   │   │       ├── leads/route.ts
│   │   │       ├── crm/route.ts
│   │   │       └── dev/reset/route.ts
│   │   ├── components/
│   │   │   ├── GtmScript.tsx
│   │   │   ├── ConsentBanner.tsx
│   │   │   ├── ObservabilityPanel.tsx
│   │   │   ├── CrmTable.tsx
│   │   │   ├── TestConditionsPanel.tsx
│   │   │   ├── forms/
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   ├── env.ts
│   │   │   ├── crm-store.ts
│   │   │   ├── attribution.ts
│   │   │   ├── mappers/
│   │   │   └── contracts/
│   │   │       ├── events.ts
│   │   │       ├── crm.ts
│   │   │       ├── attribution.ts
│   │   │       ├── timeline.ts
│   │   │       ├── routes.ts
│   │   │       └── schema.ts
│   │   └── styles/
│   │       ├── tokens.css
│   │       └── globals.css
│   ├── scripts/
│   │   ├── scan-pii.mjs
│   │   ├── check-docs-commands.mjs
│   │   └── emit-matrix.mjs
│   ├── tests/
│   │   ├── unit/
│   │   └── e2e/
│   ├── test-results/.gitkeep
│   ├── data/.gitkeep
│   └── README.md
├── evidence/
│   ├── README.md
│   ├── baseline/finding.md, screenshots/.gitkeep
│   ├── defect-01-invalid-submit-fire/finding.md, screenshots/.gitkeep
│   ├── defect-02-duplicate-conversion/finding.md, screenshots/.gitkeep
│   ├── defect-03-missing-conversion/finding.md, screenshots/.gitkeep
│   ├── defect-04-bad-event-parameters/finding.md, screenshots/.gitkeep
│   ├── defect-05-attribution-loss/finding.md, screenshots/.gitkeep
│   └── defect-06-incomplete-crm-record/finding.md, screenshots/.gitkeep
├── audit-template/sample-audit-report.md
├── scope/audit-scope-source.md
├── access/access-and-authorization-checklist.md
├── proposals/sample-proposal.md
├── invoices/sample-invoice.md
└── business-tracker/lead-pipeline.md
```
