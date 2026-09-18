# Original User Request

## 2026-09-18T17:00:11Z

# ResponseLock Week-1: Conversion-Integrity Demo Workspace

Build a local training and demonstration workspace that teaches and proves the ResponseLock Lead & Conversion Integrity Audit ($350 fixed-scope service for small paid-media agencies). The workspace contains a realistic Next.js lead-capture application with six intentional, reproducible, production-shaped tracking defects, a simulated local CRM, observability tooling, GTM/GA4 integration points, and a complete evidence/audit documentation suite.

**This is NOT a customer-facing SaaS product.** It is local training software that makes the conversion chain visible, inspectable, and breakable: `ad click → landing page with UTM/GCLID → attribution capture → form validation → successful submission → dataLayer → GTM → GA4 key event → Google Ads conversion configuration (conceptual) → CRM record with source fields`.

**Single most important teaching outcome: a form that works does not mean conversion data is trustworthy.**

Working directory: `C:\Users\Ranji\code-base\RL-Demo`
Integrity mode: demo

---

## Environment (Pre-Detected)

- **OS:** Windows 11, PowerShell 5.1
- **Node:** v24.18.0 (current LTS)
- **Package Manager:** npm 11.16.0 (only one installed — use npm for all installs)
- **Git:** 2.55.0
- **Target directory:** `C:\Users\Ranji\code-base\RL-Demo` — empty, no existing git repo
- **Port 3000:** Free
- **GTM Container ID:** `GTM-KRH5W5MX` (dedicated non-production, goes in `.env.local`)
- **GA4 Measurement ID:** `G-GQBPF316M0` (dedicated non-production, goes in `.env.local`)
- **Git:** Initialize new local repo; local-only commits (NO push)
- **Realism depth:** Full (Consent Mode v2, latency, ad-blocker, API-failure, SPA route-change)

---

## Integrity and Implementation Rules

These rules are BINDING on every agent in the build:

1. **LIBRARIES — allowed and expected.** Use the stack named in this spec (Next.js App Router, TypeScript strict, zod, vitest, Playwright, @axe-core/playwright, CSS Modules). Do not add any dependency not named in the spec without asking the orchestrator first. No component library, no CSS framework, no task runner, no lockfile helper.

2. **VENDOR SNIPPETS — the one exception to no-copying.** The GTM container snippet, the dataLayer initialisation, and the Consent Mode v2 `consent default` / `consent update` call shapes MUST match Google's current official documented form verbatim. Cite the doc URL in a code comment.

3. **DEFECT MECHANISMS — hand-authored only, no exceptions.** Each of the six defects must be a real, independently plausible code path that a real developer could have shipped. REJECTED implementations:
   - Branching on scenario id inside shared/common code paths
   - A defect config object or lookup table that the shared handler consults to decide what to break
   - Any code whose only purpose is to make a test assertion pass
   If a reviewer cannot explain the mechanism in one sentence without referring to the scenario id, the implementation is wrong.

4. **ORDERING — implementation before tests, always.** Write the mechanism from the spec and the Contract Pack, verify it by hand in the running app, then write tests that describe the observed-and-intended behaviour. Never write the test first and then make code satisfy it. Never read another agent's tests.

5. **TESTS MUST ASSERT BEHAVIOUR, NOT INTERNALS.** Assert dataLayer contents, network request counts via route interception, CRM row counts, rendered DOM state, and stored field values. Do not assert internal function calls, do not mock the module under test, do not assert on scenario ids as a proxy for behaviour.

6. **SUB-AGENT READ SCOPE.** Sub-agents may read `src/lib/contracts/**`, `docs/CONTRACTS.md`, `.orchestration/ownership-map.md`, and their own owned paths. They may not read other agents' implementation or test files, and may not read `node_modules`.

7. **NO SILENT SCOPE REDUCTION.** If a required behaviour cannot be implemented as specified, stop and report BLOCKED with the exact error. Do not substitute simpler behaviour, skip tests, mark tests `.skip`, loosen assertions, or delete failing tests.

8. **VERIFICATION IS NOT SELF-REPORTED.** The orchestrator re-runs every check itself and quotes verbatim output. The final verification matrix must be generated from actual test results by `scripts/emit-matrix.mjs`, never hand-written.

---

## Safety Rules (BINDING ON EVERY AGENT)

1. Do not connect to any production GTM, GA4, Google Ads, or CRM.
2. Do not fire real Google Ads conversion actions.
3. Do not send test leads to production forms.
4. Do not collect or store real customer data — use fictional values (`demo.user@example.com`, `+1-555-0100`, `Example Media Group`).
5. Never put PII (names, emails, phones, free text, raw URLs) into dataLayer or GA4 parameters.
6. The simulated CRM stays local — no network egress from the API route.
7. Never expose the local server through a tunnel without asking.
8. GTM/GA4 identifiers live only in a local env file, read through one validated config module.
9. Gitignore `.env*` (except `.env.example`), `demo/data/**`, `demo/test-results/**`, traces, logs, screenshots.
10. Never claim Google Ads was tested or GA4 evidence exists until the user personally verifies.
11. Label evidence precisely: `simulated (local)`, `test-property evidence`, or `not tested`.
12. No auth, billing, multi-tenancy, dashboards, monitoring, or speculative automation.
13. Never change the business scope or $350 price.
14. No fabricated results, testimonials, logos, savings figures, or performance claims.
15. Maintain the epistemic distinction: expected / observed / confirmed / probable explanation / unverified assumption.

---

## Requirements

### R1. Realistic Lead-Capture Application with Correct Baseline

**Tech stack:** Next.js (current stable), App Router, React, TypeScript `strict: true` with `noUncheckedIndexedAccess`. CSS Modules + one `tokens.css` (colours, spacing, type scale, focus ring). Zod for shared request/response schemas. App Router Route Handlers. Node runtime. JSONL storage with async mutex.

**Routes:** `/`, `/scenario/baseline`, `/scenario/defect-1` through `/scenario/defect-6`, `/crm`, `/evidence`.

**Baseline valid submission chain (enforced order):**
1. User completes form → 2. client validation passes → 3. `submission_id` (UUID v4) generated → 4. attribution read from persisted state → 5. sanitized payload POSTed with idempotency key → 6. server validates and returns 201 → 7. exactly one CRM record → 8. success UI renders from response → 9. exactly one `demo_lead_success` pushed to `window.dataLayer` after confirmed success → 10. payload contains only approved keys → 11. GTM can respond → 12. timeline shows correct sequence.

**Approved analytics payload keys (nothing else):** `event: 'demo_lead_success'`, `form_id: 'lead_audit_demo'`, `lead_type: 'agency_audit_inquiry'`, `scenario`, `submission_id`, `attribution_status`, `debug_mode: true`.

**Invalid submission must:** show field errors; make zero network requests (assert by request count); create no CRM record; push no success event; render no success state; log failure to timeline.

**Form requirements:** Real `<form noValidate>` with hidden honeypot, `aria-describedby` error wiring, inline errors, `aria-live` status region, submit button disables during flight (except Defect 2), success panel rendered from server response (not optimistically).

**GTM injection:** One `<GtmScript />` client component in root layout. Validate ID against `/^GTM-[A-Z0-9]{7,}$/`. Use `next/script` strategy `afterInteractive`. Module-level guard against double injection from React strict mode. Initialize `window.dataLayer` and push consent defaults BEFORE GTM snippet. No separate gtag.js/GA4.

**Env:** One `src/lib/env.ts` reading/validating `NEXT_PUBLIC_GTM_CONTAINER_ID` and `NEXT_PUBLIC_GA4_MEASUREMENT_ID` through zod, exporting `gtmStatus: 'configured' | 'absent' | 'invalid'`.

**UI quality:** Real `<label>` associations, keyboard operable, visible focus rings, WCAG AA contrast, status conveyed by text + colour, no horizontal scroll at 360px, readable at 200% zoom, `prefers-reduced-motion` respected.

### R2. Six Production-Shaped Tracking Defects

Each defect implemented as a genuinely different code path a real developer could have shipped, isolated in its own module, with comment block: `INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: <sentence>. Do not copy into production.`

**Defect 1 — Conversion fires on invalid submission:** A genuine `click` listener bound to the submit button (GTM Click–All Elements trigger equivalent), firing before/independent of validation. Validation fails, no request, no CRM row, but one `demo_lead_success` with `scenario: 'defect-1'`. Root cause: conversion bound to intent, not confirmed outcome.

**Defect 2 — Duplicate conversion:** A "legacy" module (`legacy-conversion-listener.ts`, commented as surviving a previous vendor) pushes on click, while the new post-success handler also pushes. Same `submission_id` in both. Idempotency keeps CRM at one row. Root cause: two independent listeners after partial migration.

**Defect 3 — Successful lead, missing conversion:** Success handler imports event name from stale constants module exporting `demo_lead_sucess` (typo preserved as `LEGACY_MISSPELLED_EVENT`). Expected name never pushed. Root cause: event-name drift between site rebuild and untouched GTM trigger.

**Defect 4 — Missing/incorrect event parameters:** Separate payload mapper reads from renamed source keys, so `form_id` resolves `undefined` (dropped by JSON.stringify), `lead_type` gets stale wrong value (`'contact'`). `submission_id` survives. Panel renders expected-vs-actual parameter diff. Root cause: dataLayer schema drift.

**Defect 5 — UTM/GCLID attribution loss:** Entry link `?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001`. Client-side navigation to second form step drops query string; scenario reads from `window.location.search` at submit time instead of persisted storage. CRM row with empty attribution. Panel shows: at entry / after navigation / submitted payload / CRM fields. Never transmit GCLID externally. Root cause: attribution not persisted across redirects.

**Defect 6 — Incomplete/mismapped CRM record:** Server-side `CrmFieldMap` config (`mappers/defect-06.ts`) drops `utm_campaign`, writes `utm_source` into `lead_source_detail` while leaving `lead_source` blank. Client payload correct, API receipt correct, stored record wrong. Root cause: incorrect CRM field mapping.

Each defect page carries four verification-layer labels: **Confirmed locally** / **Requires GTM Preview** / **Requires GA4 DebugView** / **Not tested in Google Ads**.

### R3. Production Realism Layer (Full)

1. **Deterministic latency:** CRM endpoint sleeps a fixed per-scenario duration (e.g. 420ms) via a constant, never Math.random().
2. **Consent Mode v2:** Push `consent default` for `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` (all `denied`, `wait_for_update`) before GTM loads. `consent update` on banner accept. Visible banner + persistent toggle.
3. **Environment simulators** (Test Conditions panel, off by default): ad-blocker simulation (skip GTM injection + diagnostic), API 500 injection, API timeout, slow network (2s), consent denied, SPA navigation mode.
4. **Real attribution:** On first entry, capture `utm_source/medium/campaign/term/content` and `gclid/gbraid/wbraid` into first-touch storage (cookie, ~90-day) and last-touch (sessionStorage). Derive `attribution_status` at submit time.
5. **Idempotency:** Client sends `Idempotency-Key` header = `submission_id`; server honours it.
6. **Server-side validation** independent of client, returning field-level errors.
7. **SPA route-change:** At least one scenario navigates client-side between form steps using the router.
8. **Determinism:** No Math.random(), no ambient Date.now() in scenario logic. Inject clock and ID generator; test mode uses seeded counter.

### R4. Observability, CRM Viewer, and Evidence Framework

**Observability panel:** Compact chronological timeline with timestamp (ms), category (from contract union), label, optional JSON payload. Categories: lifecycle, validation, network, analytics, storage, crm, attribution, consent, defect. PII redacted. Buttons: copy sanitized evidence summary; download sanitized JSON manifest. States plainly it's NOT equivalent to GTM Preview or GA4 DebugView.

**Simulated CRM API:** Accept valid fictional submissions, honour submission_id, validate server-side with zod, return field-level 400s, honour Idempotency-Key, apply scenario's mapper, store JSONL locally, list for /crm, reset via dev-guarded action. No network egress.

**/crm page:** Table with Submission ID, Scenario, contact values, Created, lead_source, lead_source_detail, campaign_name, gclid, Mapping status, Intentionally missing fields. Permanent banner: "This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records."

**Evidence folders:** `evidence/baseline/`, `evidence/defect-01-*` through `evidence/defect-06-*`, each with `finding.md` (prefilled template with Finding ID, title, status, severity, reproduction steps, etc.) and `screenshots/.gitkeep`.

### R5. Documentation Suite

All documents listed in the workspace structure spec, including:
- `docs/demo-runbook.md` — beginner-friendly, exact tested npm commands
- `docs/troubleshooting.md` — 25+ error scenarios with symptoms, causes, diagnostics, fixes
- `docs/gtm-setup.md` — exact beginner steps for non-production container
- `docs/gtm-manual-steps.md` — authoritative manual path if container import fails
- `docs/ga4-debugview-setup.md` — DebugView usage with blank verification table
- `docs/google-ads-boundary.md` — why Ads is conceptual-only
- `docs/defect-catalog.md` — all six defects with analogue, detection, remediation
- `docs/client-explanation-scripts.md` — ≤60-word plain-language explanation per defect
- `audit-template/sample-audit-report.md` — full audit report template with all sections
- `scope/audit-scope-source.md` — matches $350 offer exactly
- `access/access-and-authorization-checklist.md` — GTM Read default, permissions matrix
- GTM container export at `gtm/responselock-demo-container.json` with `gtm/IMPORT-NOTES.md`

### R6. Automated Test Suite and Verification Pipeline

**Unit/integration:** vitest + @testing-library/react + jsdom. Test dataLayer contract, payload builders, attribution derivation, CRM mappers, zod schemas.

**E2E:** Playwright (Chromium only). Assert dataLayer via `page.evaluate(() => window.dataLayer)`. Assert "no API request" via `page.route` request counting. Reset storage between tests via dev-only reset endpoint.

**Accessibility:** @axe-core/playwright, zero serious/critical on every route.

**Guard scripts:**
- `scripts/scan-pii.mjs` — scan for email/phone patterns, fixture names, GTM-/G- literals outside allowed files
- `scripts/check-docs-commands.mjs` — extract shell commands from docs, assert each npm script exists
- `scripts/emit-matrix.mjs` — write `demo/test-results/verification-matrix.md` from actual test results

**npm scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `scan:pii`, `check:docs`, `verify` (= lint → typecheck → unit → build → e2e → scan:pii → check:docs)

**No test may depend on GTM or GA4.**

---

## Workspace Structure

```
(root: C:\Users\Ranji\code-base\RL-Demo)
├── README.md
├── STATUS.md
├── CHANGELOG.md
├── .gitignore
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
│   ├── src/ (app, components, lib, styles)
│   ├── scripts/ (scan-pii.mjs, check-docs-commands.mjs, emit-matrix.mjs)
│   ├── tests/ (unit/, e2e/, fixtures/, helpers/)
│   ├── test-results/.gitkeep
│   ├── data/.gitkeep
│   ├── .env.example
│   └── README.md
├── evidence/
│   ├── README.md
│   ├── baseline/
│   ├── defect-01-invalid-submit-fire/
│   ├── defect-02-duplicate-conversion/
│   ├── defect-03-missing-conversion/
│   ├── defect-04-bad-event-parameters/
│   ├── defect-05-attribution-loss/
│   └── defect-06-incomplete-crm-record/
├── audit-template/
├── scope/
├── access/
├── proposals/
├── invoices/
└── business-tracker/
```

---

## Orchestration Model

### Contract Pack (frozen in Wave 0)
Create `demo/src/lib/contracts/` containing:
- `events.ts` — event name constants (including `LEGACY_MISSPELLED_EVENT`), allowed analytics parameter keys, `ScenarioId` union, `buildAnalyticsPayload()` signature
- `crm.ts` — `LeadSubmissionPayload`, `CrmRecord`, `CrmFieldMap` types; canonical CRM field names
- `attribution.ts` — `AttributionState`, `AttributionStatus`, storage key names, status-derivation function signature
- `timeline.ts` — `TimelineCategory` union and `TimelineEntry` type
- `routes.ts` — route table with title, scenario id, verification-layer labels
- `schema.ts` — zod schemas for API request/response, derived types

Also write `docs/CONTRACTS.md`: human-readable rendering + the rule "sub-agents may read contracts freely; everything else is out of scope."

### File Ownership
Exactly one agent owns any given file path. No exceptions. Orchestrator owns: package.json, lockfile, configs, root layout, tokens.css, contracts, .gitignore, README, STATUS, CHANGELOG, .env.example, scripts. Sub-agents never run `npm install`, never edit configs, never `git commit`.

### Wave Plan
- **Wave 0 (serial):** Environment inspection, git init, scaffold Next.js, install all deps, Contract Pack, tokens.css, root layout with GtmScript + consent + observability provider, env.ts, JSONL store + mutex, leads API route, reset endpoint, test harness, guard scripts, package.json scripts. Prove with smoke test. Commit.
- **Wave 1 (parallel):** 9 sub-agents for baseline, defects, observability/CRM UI, docs, evidence. Dispatch baseline agent first; others start after form component lands.
- **Wave 2 (parallel review):** 4 adversarial agents — determinism red-team, doc accuracy, beginner simulator, safety audit.
- **Wave 3 (serial):** Fix findings, run full verify, regenerate matrix, final commits.

### Staged Commits
Branch: `build/conversion-integrity-demo`. Commit after every wave. Never commit `.env.local`, CRM records, traces, or secrets. No push (local only).

---

## Acceptance Criteria

### Application Functionality
- [ ] `npm run dev` starts the app; all 10 routes load without errors
- [ ] `npm run build` succeeds with zero type/lint errors
- [ ] Baseline valid: 1 success UI, 1 CRM row, 1 dataLayer event with approved keys only
- [ ] Baseline invalid: 0 success UI, 0 CRM rows, 0 events, 0 API requests
- [ ] App works fully with no GTM/GA4 configured (clear status messages, no errors)
- [ ] Invalid GTM ID is not injected (clear error state shown)
- [ ] Single GTM injection guaranteed (test proves no double-inject in strict mode)

### Defect Verification Matrix (from generated test results)
| Scenario | Success UI | CRM Rows | Expected Events | Result |
|---|---:|---:|---:|---|
| Baseline valid | 1 | 1 | 1 | Correct |
| Baseline invalid | 0 | 0 | 0 | Correct rejection |
| Defect 1 invalid | 0 | 0 | 1 | False conversion |
| Defect 2 valid | 1 | 1 | 2 | Duplicate conversion |
| Defect 3 valid | 1 | 1 | 0 | Missing conversion |
| Defect 4 valid | 1 | 1 | 1 | Parameter defect |
| Defect 5 valid | 1 | 1 | 1 | Attribution lost |
| Defect 6 valid | 1 | 1 | 1 | CRM mapping incomplete |

### Test Suite & Quality
- [ ] `npm run verify` passes: lint → typecheck → unit → build → e2e → scan:pii → check:docs
- [ ] Zero axe-core serious/critical violations on all routes
- [ ] No PII in any dataLayer push or analytics payload (scan:pii passes)
- [ ] Every shell command in docs references a real npm script (check:docs passes)
- [ ] `verification-matrix.md` generated from actual test results, not hand-written
- [ ] All tests are deterministic — same results on repeated runs

### Documentation
- [ ] A beginner following `demo-runbook.md` literally can install, start, and run all scenarios (proven by beginner-simulator agent)
- [ ] Business scope ($350, service details) matches spec exactly throughout all documents
- [ ] No fabricated evidence, no claimed Google verification
- [ ] GTM/GA4 docs match the actual implementation

### Safety & Git
- [ ] No production credentials, real PII, or network egress from API routes
- [ ] `.gitignore` covers `.env*` (except `.env.example`), data files, test results, traces
- [ ] `git log` shows staged commits per wave, no secrets in any commit
- [ ] No force-push, repo is local-only
- [ ] No dependencies beyond the spec's named stack

### Verification Resources
The generated `scripts/emit-matrix.mjs` produces `demo/test-results/verification-matrix.md` from Playwright test results. This is the canonical verification artifact. The orchestrator must quote it in the final report.

---

## Final Report

Must include exactly: Completion Status; Workspace Location; Technology Used; Orchestration Summary; Folders and Files Created; Baseline Behavior; Six Defects Implemented; Production Realism Features; Automated Verification Results (quoting generated matrix); Manual GTM Steps; Manual GA4 Steps; Evidence to Capture; Commands to Run; Known Limitations; Git Branch and Commits; Push Status; and "My Exact Next Five Actions" (which are: 1. Add test GTM ID, 2. Configure GA4 event through GTM, 3. Run baseline in Tag Assistant and DebugView, 4. Reproduce and capture Defects 1-6, 5. Explain Defect 1 aloud without notes).
