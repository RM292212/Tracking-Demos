# ResponseLock Week-1 Milestone & Delivery Checklist

**Project**: ResponseLock Lead & Conversion Integrity Demo Workspace  
**Scope**: Week-1 Fixed-Scope Audit Training Workspace ($350 Service Fidelity)  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Branch**: `build/conversion-integrity-demo`  

---

## 1. Overview & Wave Progression

The ResponseLock Week-1 workspace is constructed across four distinct waves (Wave 0 through Wave 3). This checklist documents the implementation deliverables, acceptance criteria, verification commands, and completion status for every wave.

```
Wave 0 (Serial Foundation)
  └─► Wave 1 (Parallel Implementation)
        └─► Wave 2 (Adversarial Quality Review)
              └─► Wave 3 (Verification & Final Release)
```

---

## 2. Wave 0: Foundation, Scaffolding & Core Harness

**Focus**: Environment detection, repository initialization, Contract Pack freezing, core Next.js layout, local JSONL store with async mutex, API endpoints, guard scripts, and smoke test harness.

| Item | Deliverable | Acceptance Criteria | Status | Verification Command |
|---|---|---|---|---|
| 0.1 | Environment Inspection | Node v24.18.0, npm 11.16.0, Git 2.55.0, Port 3000 verified free | Complete | `node -v && npm -v` |
| 0.2 | Git Init & Branch Setup | Initialized git repository on `build/conversion-integrity-demo` | Complete | `git status` |
| 0.3 | Strict `.gitignore` | Ignores `.env*` (except `.env.example`), `data/`, `test-results/`, traces | Complete | `git status --ignored` |
| 0.4 | Next.js App Router Scaffold | Configured in `demo/` with strict TypeScript & `noUncheckedIndexedAccess` | Complete | `npm run typecheck` |
| 0.5 | Frozen Contract Pack | `events.ts`, `crm.ts`, `attribution.ts`, `timeline.ts`, `routes.ts`, `schema.ts` | Complete | `npm run test:unit` |
| 0.6 | Contract Documentation | `docs/CONTRACTS.md` with read scope boundary for sub-agents | Complete | Manual inspection |
| 0.7 | Design System Tokens | `demo/src/styles/tokens.css` with colors, spacing, focus ring, WCAG AA | Complete | `npm run build` |
| 0.8 | Environment Validation | `demo/src/lib/env.ts` validating GTM/GA4 IDs with Zod | Complete | `npm run test:unit` |
| 0.9 | Root Layout & GtmScript | Pre-GTM Consent Mode v2 default denial + `<GtmScript />` component | Complete | `npm run test:unit` |
| 0.10 | Local JSONL Store + Mutex | `demo/src/lib/crm-store.ts` with async mutex & in-mutex deduplication | Complete | `npm run test:unit` |
| 0.11 | Leads API Route Handlers | `POST /api/leads` with Zod check, honeypot, 420ms latency, Idempotency-Key | Complete | `npm run test:unit` |
| 0.12 | Dev Reset & CRM API | `POST /api/dev/reset` dev-guarded; `GET /api/crm` returns stored leads | Complete | `npm run test:unit` |
| 0.13 | Guard Scripts | `scan-pii.mjs`, `check-docs-commands.mjs`, `emit-matrix.mjs` in `scripts/` | Complete | `npm run scan:pii` |
| 0.14 | Package Scripts | `dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `verify` | Complete | `npm run verify` |
| 0.15 | Wave 0 Staged Commits | Commits `2f5ed9b` and `109be3e` landed cleanly on branch | Complete | `git log -n 2` |

---

## 3. Wave 1: Parallel Feature Implementation

**Focus**: Implementing the baseline lead capture form, six authentic defect modules, observability timeline panel, CRM viewer table, documentation pack, and evidence packages.

### 3.1 Workstream A1: Baseline Core Lead Form
- [x] Accessible `<form noValidate>` with hidden honeypot (`website` / `fax`).
- [x] Input associations via `<label htmlFor="...">`, visible focus indicators.
- [x] Inline field validation with `aria-describedby` error associations and `aria-live` status.
- [x] Submit button disables and indicates flight state during submission.
- [x] Attribution capture engine: first-touch (~90 day cookie) & last-touch (sessionStorage).
- [x] Success banner rendered from server 201 response (not optimistic).
- [x] Exactly one `demo_lead_success` event pushed to `window.dataLayer` with 7 approved keys only.
- [x] Zero network requests, zero CRM writes, and zero dataLayer events on invalid submission.

### 3.2 Workstream A2: Defects 1 & 2
- [x] **Defect 1**: Genuine click listener bound to submit button firing before/independent of validation.
  - Invalid form submission triggers 1 `demo_lead_success` event while API and CRM write 0 leads.
- [x] **Defect 2**: Legacy conversion listener (`legacy-conversion-listener.ts`) survives alongside post-success listener.
  - Successful form submission pushes 2 `demo_lead_success` events sharing the same `submission_id`.
  - Server idempotency maintains exactly 1 CRM row.

### 3.3 Workstream A3: Defects 3 & 4
- [x] **Defect 3**: Success handler imports event name constant from stale module (`LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess'`).
  - GTM triggers never fire; 0 valid conversions recorded in analytics despite 1 CRM lead.
- [x] **Defect 4**: Payload mapper reads renamed keys; `form_id` drops to `undefined`, `lead_type` gets `'contact'`.
  - Observability panel renders expected vs actual parameter diff.

### 3.4 Workstream A4: Defects 5 & 6
- [x] **Defect 5**: Multi-step SPA navigation drops URL query parameters; handler reads `window.location.search` at submit time instead of persisted storage.
  - Event pushes `attribution_status: 'dropped'`; CRM stores empty UTM/GCLID fields.
- [x] **Defect 6**: Server-side field mapper (`mappers/defect-06.ts`) drops `utm_campaign` and swaps `utm_source` into `lead_source_detail`.
  - Stored CRM row reflects misaligned marketing source properties.

### 3.5 Workstream A5: Observability & Simulated CRM UI
- [x] **Observability Panel**:
  - Chronological timeline recording 9 categories.
  - Automatic PII redaction on all payloads.
  - "Copy Evidence Summary" button formatting markdown table.
  - "Download Sanitized Manifest" generating JSON export.
- [x] **Simulated CRM Viewer (`/crm`)**:
  - 10-column table rendering stored records.
  - Permanent disclaimer banner indicating simulated educational usage.
  - Status badges for Normal, Mismapped, Duplicate, and Incomplete records.
  - Red "Reset CRM Store" button calling `/api/dev/reset`.
- [x] **Test Conditions Panel**:
  - Toggles for Ad Blocker, API 500 error, API timeout, slow network (2s), and Consent Mode.

### 3.6 Workstream A6: Operational Documentation Suite
- [x] `docs/demo-runbook.md`: Beginner-friendly step-by-step setup and execution guide.
- [x] `docs/troubleshooting.md`: 28 concrete error scenarios with symptoms, causes, diagnostics, and fixes.
- [x] `docs/demo-safety-rules.md`: 15 binding safety rules.
- [x] `docs/week-1-checklist.md`: Comprehensive milestone checklist.
- [x] `docs/manual-verification-checklist.md`: Step-by-step QA verification checklist.
- [x] `docs/environment.md`: Detailed environment specification.
- [x] `docs/architecture.md`: Architecture specification, data flow, mutex model, state machines.
- [x] `demo/README.md`: Application-level README.

### 3.7 Workstream A7: Google Integration Documentation & Artifacts
- [x] `docs/gtm-setup.md`: Step-by-step container setup.
- [x] `docs/gtm-manual-steps.md`: Authoritative manual tag/trigger creation steps.
- [x] `docs/ga4-debugview-setup.md`: GA4 DebugView verification steps.
- [x] `docs/google-ads-boundary.md`: Conceptual boundary explanation.
- [x] `gtm/responselock-demo-container.json`: GTM export file.
- [x] `gtm/IMPORT-NOTES.md`: Container import guide.

### 3.8 Workstream A8: Business & Commercial Artifacts ($350 Service)
- [x] `audit-template/sample-audit-report.md`: Complete audit report template.
- [x] `scope/audit-scope-source.md`: Fixed-scope $350 audit definition.
- [x] `access/access-and-authorization-checklist.md`: Read-only access permissions matrix.
- [x] `proposals/sample-proposal.md`: Agency proposal template.
- [x] `invoices/sample-invoice.md`: Exact $350 invoice template.
- [x] `business-tracker/lead-pipeline.md`: Commercial tracking spreadsheet/markdown.

### 3.9 Workstream A9: Finding Evidence Packages
- [x] `evidence/README.md`: Evidence framework guide.
- [x] `evidence/baseline/finding.md`: Baseline intact findings template.
- [x] `evidence/defect-01-invalid-submit-fire/finding.md`: Defect 1 finding package.
- [x] `evidence/defect-02-duplicate-conversion/finding.md`: Defect 2 finding package.
- [x] `evidence/defect-03-missing-conversion/finding.md`: Defect 3 finding package.
- [x] `evidence/defect-04-bad-event-parameters/finding.md`: Defect 4 finding package.
- [x] `evidence/defect-05-attribution-loss/finding.md`: Defect 5 finding package.
- [x] `evidence/defect-06-incomplete-crm-record/finding.md`: Defect 6 finding package.
- [x] `docs/evidence-capture-guide.md`: Step-by-step evidence capture instructions.
- [x] `docs/defect-catalog.md`: Complete defect catalog with detection and remediation.
- [x] `docs/client-explanation-scripts.md`: Plain-language scripts (≤60 words each).

---

## 4. Wave 2: Adversarial Quality Reviews

**Focus**: Independent adversarial audits across determinism, documentation accuracy, beginner simulator, and safety compliance.

| Review Round | Reviewer Agent | Core Mission | Acceptance Criteria |
|---|---|---|---|
| **Round 1** | Determinism Red-Team | Audit clock, ID generator, mutex concurrency | Zero `Math.random()`, zero unhandled race conditions |
| **Round 2** | Documentation Accuracy | Validate all shell commands, paths, and contracts | `npm run check:docs` passes 100%; zero broken references |
| **Round 3** | Beginner Simulator | Execute clean-clone installation step-by-step | Runbook is 100% executable by beginner without external help |
| **Round 4** | Safety & PII Audit | Scan for real PII, tracking ID leaks, network egress | `npm run scan:pii` reports zero violations |

---

## 5. Wave 3: Final Verification & Release

**Focus**: Automated verification execution, canonical matrix generation, staged commit landing, and final project report.

- [x] Run `npm run lint` — Zero ESLint errors or warnings.
- [x] Run `npm run typecheck` — Zero TypeScript compilation errors.
- [x] Run `npm run test:unit` — All unit and contract tests pass.
- [x] Run `npm run build` — Clean production bundle generated.
- [x] Run `npm run test:e2e` — All Playwright tests pass (Chromium headless).
- [x] Run `npm run scan:pii` — Zero real PII or unauthorized tracking literals.
- [x] Run `npm run check:docs` — All markdown commands match valid scripts.
- [x] Run `npm run emit:matrix` — Canonical `demo/test-results/verification-matrix.md` generated dynamically.
- [x] Run `npm run verify` — Full 7-stage automated verification pipeline passes end-to-end.
- [x] Final staged commit created on `build/conversion-integrity-demo`.
- [x] Completion report delivered with exact next five actions.
