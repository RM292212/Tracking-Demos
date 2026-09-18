# Changelog

All notable changes to the ResponseLock Week-1 Demo Workspace.

## [1.0.0] — 2026-09-19

### Wave 0 — Foundation
- Scaffolded Next.js App Router project with TypeScript strict mode
- Created Contract Pack: `events.ts`, `crm.ts`, `attribution.ts`, `timeline.ts`, `routes.ts`, `schema.ts`
- Implemented JSONL CRM store with async mutex and in-mutex deduplication
- Built `/api/leads` route with zod validation, idempotency, deterministic latency
- Built `/api/dev/reset` dev-only reset endpoint
- Created `GtmScript` component with Consent Mode v2 defaults
- Created `env.ts` with zod-validated GTM/GA4 configuration
- Set up vitest + Playwright + @axe-core/playwright test harnesses
- Created guard scripts: `scan-pii.mjs`, `check-docs-commands.mjs`, `emit-matrix.mjs`
- Established complete workspace folder structure

### Wave 0 Fix — Remediation
- Fixed Windows build trace ENOENT with `not-found.tsx`
- Added explicit IPv4 localhost binding in Playwright config
- Hardened PII regex to prevent UUID false positives
- Made `emit-matrix.mjs` fully dynamic (parses real test results)
- Moved deduplication check inside mutex to eliminate TOCTOU race

### Wave 1 — Parallel Implementation
- **Baseline**: Full lead capture form with validation, attribution, honeypot, success panel
- **Defect 1**: Premature click listener fires conversion before validation
- **Defect 2**: Legacy conversion listener + modern post-201 listener = duplicate events
- **Defect 3**: Stale constant `LEGACY_MISSPELLED_EVENT` ('demo_lead_sucess') causes missing conversion
- **Defect 4**: Separate payload mapper with renamed keys drops `form_id`, corrupts `lead_type`
- **Defect 5**: SPA navigation drops query string; reads `window.location.search` at submit time
- **Defect 6**: Server-side `CrmFieldMap` drops `utm_campaign`, mismaps `utm_source`
- **Observability**: Timeline panel, Test Conditions panel, Consent Banner
- **CRM UI**: `/crm` page with full field display and reset capability
- **Evidence**: `/evidence` page with all scenario findings
- **Documentation**: 15 docs including runbook (28 troubleshooting scenarios), GTM/GA4 guides
- **Business Artifacts**: SOW, proposal, invoice, audit report template ($350 scope)
- **Evidence Templates**: 8 finding.md files with structured templates

### Wave 2–3 — Review and Fixes
- Fixed E2E test selector strict mode violations (defect-3, defect-4)
- Fixed dataLayer assertions to filter for `demo_lead_` events (consent + GTM init are expected)
- Fixed WCAG AA color contrast: `--color-text-muted` bumped from `#6b7280` to `#9ca3af`
- Updated inline color fallbacks in defect-3 and defect-4 pages
- Added `adversarial-concurrency-redteam.test.ts` (200-concurrent-write stress test)
- Created STATUS.md, CHANGELOG.md
- Final verification: all tests pass, PII scan clean, docs validated
