# ResponseLock Demo Safety Rules & Operational Boundaries

**Status**: BINDING ON ALL WORKERS, AGENTS, AND HUMAN OPERATORS  
**Applies To**: ResponseLock Lead & Conversion Integrity Demo Workspace  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit  

---

## 1. Executive Summary & Purpose

The ResponseLock Conversion-Integrity Demo Workspace is designed exclusively for **local training, educational demonstration, and testing**. It makes the entire conversion chain inspectable and intentionally defect-prone so engineers and media buyers can observe how broken attribution silently corrupts analytics and ad spend.

Because this workspace simulates production-grade marketing technology (Google Tag Manager, Google Analytics 4, Google Ads conversion modeling, CRM integrations, and web forms), **strict safety boundaries are mandatory**. Violating any of these rules threatens client data integrity, incurs real advertising spend, breaches data privacy regulations, or invalidates educational findings.

---

## 2. The 15 Binding Safety Rules

### Rule 1: No Connection to Production Marketing Systems
- **Mandate**: Under no circumstances shall this workspace connect to, authenticate with, or send events to production GTM containers, production GA4 measurement IDs, production Google Ads conversion actions, or live client CRM endpoints.
- **Enforcement**: All configuration files (`.env.local`) strictly use dedicated non-production test containers (`GTM-KRH5W5MX`, `G-GQBPF316M0`).
- **Audit Check**: Verified by `npm run scan:pii` and network egress monitoring.

### Rule 2: No Firing Real Google Ads Conversion Actions
- **Mandate**: Google Ads conversion actions are strictly modeled conceptually. No live Google Ads Conversion IDs (`AW-XXXXXXXXX`) or conversion labels may be injected or triggered.
- **Enforcement**: Google Ads conversion triggers in documentation and container references are explicitly quarantined to local Tag Assistant preview or mock container triggers. Zero HTTP requests reach `googleadservices.com`.
- **Epistemic Label**: Marked as `Not tested in Google Ads` across all scenario routes.

### Rule 3: No Sending Test Leads to Production Forms or Webhooks
- **Mandate**: Never configure form endpoints to target external URLs, client webhooks (Zapier, Make, HubSpot, Salesforce), or production API routes.
- **Enforcement**: Forms submit exclusively to relative local Next.js Route Handlers (`/api/leads`). Route handlers do not forward, proxy, or replicate data to external hosts.

### Rule 4: Fictional Data Only — Strict Prohibition of Real PII
- **Mandate**: All testing, demonstration records, automated fixtures, and documentation examples must use fictional contact information.
- **Approved Entities**:
  - Name: `Demo User`, `Jane Doe`, `Alex Smith`
  - Email: `demo.user@example.com`, `test.agency@example.org`, `lead@example.net` (strictly `@example.com`, `@example.org`, `@example.net`)
  - Phone: `+1-555-0100`, `(555) 555-0199` (strictly `555-01xx` exchange reserved for fictional use by NANPA)
  - Company: `Example Media Group`, `Acme Media Partners`, `Demo Paid Ads LLC`
- **Enforcement**: Automated repository-wide regex scanner (`npm run scan:pii`).

### Rule 5: Zero PII in dataLayer and GA4 Event Payloads
- **Mandate**: Never place names, email addresses, phone numbers, free-form text comments, or un-sanitized raw URLs into `window.dataLayer` pushes or analytics event parameters.
- **Approved dataLayer Whitelist (7 Keys Only)**:
  1. `event` (`'demo_lead_success'` or legacy defect analogue)
  2. `form_id` (`'lead_audit_demo'`)
  3. `lead_type` (`'agency_audit_inquiry'`)
  4. `scenario` (`'baseline'` | `'defect-1'` | ... | `'defect-6'`)
  5. `submission_id` (UUID v4)
  6. `attribution_status` (`'present'` | `'partial'` | `'missing'` | `'dropped'`)
  7. `debug_mode` (`true`)
- **Enforcement**: `buildAnalyticsPayload()` contract module drops unapproved keys and throws runtime exceptions if any key matches PII signatures.

### Rule 6: Simulated CRM Remains 100% Local (Zero Network Egress)
- **Mandate**: The CRM backend is a simulated local JSONL store (`demo/data/crm-records.jsonl`). The API route `/api/leads` must never issue external HTTP/S requests, database sockets, or cloud storage syncs.
- **Enforcement**: Pure in-memory and local filesystem persistence guarded by an async mutex. Offline tests confirm zero outbound socket calls.

### Rule 7: Never Expose Local Server Through Public Tunnels
- **Mandate**: The local Next.js server (`http://localhost:3000`) must never be exposed via tunneling services (ngrok, localtunnel, Cloudflare Tunnel, Tailscale Funnel) without explicit written authorization.
- **Rationale**: Exposing simulated defects and honeypots on public URLs invites unsolicited traffic, bot spam, and potential cross-site attacks.

### Rule 8: Identifiers Confined to Local Environment Variables
- **Mandate**: All container IDs and measurement keys must reside solely in `.env.local` and be accessed exclusively via the validated `src/lib/env.ts` module.
- **Enforcement**: Hardcoded container IDs or API keys in source files, components, or unit tests are forbidden and blocked by `npm run scan:pii`.

### Rule 9: Strict Git Cleanliness and Local-Only Repository Policy
- **Mandate**: The repository is local-only. Pushes to remote origins (`git push`) are prohibited during training runs.
- **Ignore Rules**: `.gitignore` strictly excludes `.env`, `.env.local`, `.env*.local`, `demo/data/*.jsonl`, `demo/test-results/`, traces, screenshots, and logs.
- **Pre-Commit Verification**: Run `git status` to ensure untracked test run outputs or secrets are never staged.

### Rule 10: Never Fabricate Verification Results or Claims
- **Mandate**: Never claim Google Ads was verified, GTM Preview was verified, or GA4 DebugView was observed unless a human auditor personally connected Tag Assistant or DebugView and witnessed the events.
- **Enforcement**: Automated test suites assert local behaviors (DOM, dataLayer array, API response, CRM record). Tag Assistant and GA4 assertions must be marked as `simulated (local)` until live human sign-off.

### Rule 11: Precise Epistemic Evidence Labeling
- **Mandate**: Every finding, table, screenshot, and report entry must carry one of three authoritative verification-layer labels:
  1. `simulated (local)`: Verified via local browser evaluation, Playwright tests, or dataLayer inspection.
  2. `test-property evidence`: Verified in non-production GTM Tag Assistant or GA4 DebugView with test property.
  3. `not tested`: Not verified against third-party ad networks (e.g. Google Ads conversion action).

### Rule 12: No Speculative Engineering or Scope Creep
- **Mandate**: Do not build authentication systems, multi-tenancy, billing gateways, external database integrations, automated cloud monitoring, or speculative background daemons.
- **Boundary**: Keep the application focused on the conversion-integrity demonstration and educational audit workflow.

### Rule 13: Exact $350 Pricing and Service Scope Fidelity
- **Mandate**: The ResponseLock Lead & Conversion Integrity Audit is a fixed-scope service priced at exactly **$350**.
- **Prohibition**: Never alter, discount, inflate, or vary the $350 price in proposals, invoices, documentation, or sales scripts. The 5-business-day turnaround and up to three-funnel audit scope must remain constant across all collateral.

### Rule 14: Zero Fabricated Testimonials, Client Logos, or Savings Figures
- **Mandate**: Marketing materials, sample audit reports, and demo UI must never display fake Fortune 500 logos, fabricated client testimonials, or invented ROI percentages (e.g., "Saved $45,000 in wasted ad spend").
- **Acceptable Content**: Concrete, factual explanations of technical defect mechanisms and conservative estimation frameworks based on actual lead cost.

### Rule 15: Maintain the Five Epistemic Distinctions
- **Mandate**: When recording findings, generating audit reports, or communicating with stakeholders, strictly maintain the epistemic distinction between:
  1. **Expected**: What the tracking architecture and contract state should happen.
  2. **Observed**: Exactly what was recorded in the timeline, dataLayer, or CRM store.
  3. **Confirmed**: Proven through reproducible test assertions or recorded evidence.
  4. **Probable Explanation**: The logical hypothesis explaining the discrepancy.
  5. **Unverified Assumption**: Any dependency or behavior not directly inspected.

---

## 3. Threat Model & Failure Modes

| Risk Scenario | Threat Level | Immediate Impact | Safety Guardrail |
|---|---|---|---|
| Live Google Ads ID in config | **CRITICAL** | False conversion signals train Google's Smart Bidding algorithm on fake data | Pre-commit regex checks; env validation rejecting `AW-` IDs |
| Real customer PII submitted | **HIGH** | GDPR / CCPA violation, unencrypted data in local JSONL | Sanitizer regex, `scan-pii.mjs`, client Zod schema |
| CRM data egress | **HIGH** | Data leak to third-party endpoints | No external network calls in Next.js Route Handlers; offline test suite |
| Inadvertent git push | **MEDIUM** | Leaking local debug artifacts, environment variables | Remote origin removed or local-only workflow |
| Port conflict / tunnel exposure | **MEDIUM** | Public access to development endpoints | Bind to `127.0.0.1` only; prohibit ngrok / cloudflare tunnels |

---

## 4. Verification & Audit Procedures

Before submitting any code, report, or commit, every operator must execute the following safety verification checks:

```bash
# 1. Verify zero real PII or forbidden tracking literals
npm run scan:pii

# 2. Verify all shell commands match valid project scripts
npm run check:docs

# 3. Verify complete test suite and build pass without egress
npm run verify
```

If `npm run scan:pii` reports any violation, stop immediately and remediate before proceeding.
