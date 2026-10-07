# ResponseLock System Architecture & Technical Specification

**Status**: AUTHORITATIVE ARCHITECTURAL SPECIFICATION  
**Target Application**: Next.js 15 App Router, React 19, TypeScript  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit  

---

## 1. System Overview & Architectural Purpose

The ResponseLock Conversion-Integrity Demo Workspace is an educational and forensic testing environment. It demonstrates how tracking flaws, attribution loss, and data drift silently corrupt digital advertising campaigns and CRM databases—even when the web form appears to function perfectly.

The core educational principle is:
> **A form that successfully submits does not mean conversion data is trustworthy.**

The system is built on Next.js 15 App Router with zero external database dependencies, storing simulated CRM leads in a local JSONL file guarded by an asynchronous in-process mutex.

---

## 2. Local Conversion Data Flow

The legacy lab models the chain from ad click through a local CRM write and dataLayer event. GTM, GA4, and Ads are separate verification boundaries. The GTM container is currently empty, GA4 access is pending, and no Ads conversion has been tested.

```
[ Paid Ad Click with UTM/GCLID ]
               │
               ▼
[ 1. Landing Page Entry (http://localhost:3000/scenario/...) ]
               │
               ▼
[ 2. Attribution Engine (first-touch cookie + last-touch sessionStorage) ]
               │
               ▼
[ 3. User Completes Accessible <form noValidate> ]
               │
               ▼
[ 4. Client Validation (Zod schema: format, required fields, honeypot) ]
        │                             │
    (Fails)                       (Passes)
        │                             │
        ▼                             ▼
[ Inline Field Errors ]       [ 5. Generate submission_id (UUID v4) ]
[ 0 Network Requests  ]               │
[ 0 dataLayer Pushes  ]               ▼
[ 0 CRM Records       ]       [ 6. POST /api/leads with Idempotency-Key ]
                                      │
                                      ▼
                      [ 7. Server Route Handler (/api/leads) ]
                        - Zod server-side validation
                        - Honeypot check (website/fax empty)
                        - Idempotency-Key == submission_id check
                        - Scenario-specific CRM field mapper
                        - Deterministic latency sleep (420ms)
                                      │
                                      ▼
                      [ 8. Async Mutex Acquisition ]
                        - In-mutex deduplication check
                        - Append single JSONL row to crm-records.jsonl
                        - Release mutex lock
                                      │
                                      ▼
                      [ 9. Server Responds: 201 Created ]
                                      │
                                      ▼
                      [ 10. Client Receives 201 Response ]
                        - Render Success UI from response payload
                                      │
                                      ▼
[ 11. Push window.dataLayer ('demo_lead_success') ]
                        - Legacy scenarios use a frozen 7-key contract
                        - Alder V2 uses a separate 14-field allowlist
                        - No form values or raw URLs enter the analytics payload
                                      │
                                      ▼
                      [ Optional external verification — pending ]
                        - GTM Preview: trigger and tag behavior
                        - GA4 DebugView: event receipt
                        - Ads: no conversion tested
```

---

## 3. The Contract Pack Architecture

To enable completely isolated, parallel sub-agent development and guarantee long-term stability, all system contracts are frozen in `demo/src/lib/contracts/`:

```
demo/src/lib/contracts/
├── events.ts        # Analytics event names, approved keys whitelist, builder signature
├── crm.ts           # LeadSubmissionPayload, CrmRecord, CrmFieldMap, canonical fields
├── attribution.ts   # AttributionState, AttributionStatus, storage keys, derivation
├── timeline.ts      # 9 TimelineCategory types, TimelineEntry, evidence manifest schema
├── routes.ts        # Route registry (10 routes), metadata, verification-layer badges
└── schema.ts        # Zod request/response validation schemas and TypeScript types
```

### 3.1 Frozen Legacy Analytics Whitelist (7 Keys)
The preserved legacy lab uses `buildAnalyticsPayload()` with the following seven keys:

```typescript
export interface AnalyticsPayload {
  event: 'demo_lead_success' | 'demo_lead_sucess'; // Support Defect 3 typo
  form_id: 'lead_audit_demo';
  lead_type: 'agency_audit_inquiry';
  scenario: ScenarioId;
  submission_id: string; // UUID v4
  attribution_status: 'present' | 'partial' | 'missing' | 'dropped';
  debug_mode: true;
}
```

This contract is preserved for the six legacy defect scenarios. V2 uses a separate additive contract described in [CONTRACTS.md](CONTRACTS.md); it does not change this seven-key builder.

### 3.2 Alder V2 Confirmation and Retry Flow

The V2 route at `/` validates the consultation form, sends the request to the local `/api/leads` handler, and waits for a schema-valid response whose submission ID matches the request. Only then does it push the canonical `demo_lead_success` event for `alder_consultation`. The event contains allowlisted attribution fields but no contact details. A session-scoped emitted-ID guard prevents duplicate pushes. While the result is unresolved, the full request is kept in that tab's `sessionStorage` so a refresh can retry the same values with the same idempotency key. `/audit` displays local evidence and the limits of external verification.

---

## 4. Local Storage Model: Async Mutex JSONL Store

Rather than requiring an external database (PostgreSQL, SQLite, Redis), the demo uses a lightweight, resilient local filesystem storage model:

```
demo/data/crm-records.jsonl
```

### 4.1 Concurrency & Race Condition Prevention
In Node.js, multiple concurrent HTTP requests to `/api/leads` could attempt to read and write to `crm-records.jsonl` simultaneously, leading to interleaved or corrupted JSON lines. 

`src/lib/crm-store.ts` implements an **Async Mutex** pattern:

```typescript
class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked: boolean = false;

  async acquire(): Promise<() => void> {
    if (this.locked) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.locked = true;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.queue.shift();
      if (next) {
        next();
      } else {
        this.locked = false;
      }
    };
  }
}
```

### 4.2 In-Mutex Deduplication & Idempotency
1. When a request arrives with `Idempotency-Key: <submission_id>`, the handler acquires the mutex lock.
2. Inside the critical section, it scans existing records for an existing `submission_id`.
3. If found, it returns the existing record without appending a duplicate.
4. If not found, it appends the serialized JSON record followed by `\n`.
5. The lock is released in a `finally` block, ensuring no deadlocks can occur even if disk I/O throws an error.

### 4.3 Deterministic Latency Emulation
Real CRM integrations (HubSpot, Salesforce, webhook pipelines) experience network and processing latency. To simulate this realistically without introducing non-deterministic flaky tests:
- The server executes a constant `await sleep(420);` (exactly 420 milliseconds).
- `Math.random()` is strictly prohibited throughout the entire codebase.

---

## 5. System State Machines

### 5.1 Form Submission Lifecycle State Machine

```
   ┌──────────────────────────────────────────────────────────┐
   │                          IDLE                            │
   └────────────────────────────┬─────────────────────────────┘
                                │ (User clicks Submit)
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                       VALIDATING                         │
   └─────────────┬──────────────────────────────┬─────────────┘
                 │ (Invalid)                    │ (Valid)
                 ▼                              ▼
   ┌───────────────────────────┐  ┌───────────────────────────┐
   │     VALIDATION_ERROR      │  │        SUBMITTING         │
   │ (Inline errors rendered;  │  │ (Submit button disabled;  │
   │  0 network requests)      │  │  POST /api/leads in flight│
   └───────────────────────────┘  └─────────────┬─────────────┘
                                                │
                         ┌──────────────────────┴──────────────────────┐
                         │ (HTTP 201)                                  │ (HTTP 4xx/5xx / Timeout)
                         ▼                                             ▼
   ┌───────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
   │             CONFIRMED_SUCCESS             │ │               SERVER_ERROR                │
   │ (Success UI rendered from response;       │ │ (Error alert rendered; button re-enabled; │
   │  window.dataLayer pushed; CRM updated)    │ │  0 dataLayer success events pushed)       │
   └───────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

### 5.2 Attribution State Machine

```
   ┌──────────────────────────────────────────────────────────┐
   │                     INITIAL_CAPTURE                      │
   │ User lands with ?utm_source=...&gclid=...                │
   └────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                        PERSISTED                         │
   │ First-touch: 90-day cookie; Last-touch: sessionStorage   │
   └─────────────┬──────────────────────────────┬─────────────┘
                 │                              │
                 │ (SPA Client-Side Route Nav)  │ (Direct Navigation / Defect 5)
                 ▼                              ▼
   ┌───────────────────────────┐  ┌───────────────────────────┐
   │      STATE_PRESERVED      │  │          DROPPED          │
   │ (Baseline: Read from      │  │ (Defect 5: Reads empty    │
   │  persisted storage)       │  │  window.location.search)  │
   └─────────────┬─────────────┘  └─────────────┬─────────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                │
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                     PAYLOAD_ATTACHED                     │
   │ Parameters attached to API payload & dataLayer status    │
   └──────────────────────────────────────────────────────────┘
```

### 5.3 Consent Mode v2 State Machine

```
   ┌──────────────────────────────────────────────────────────┐
   │                       UNINITIALIZED                      │
   └────────────────────────────┬─────────────────────────────┘
                                │ (Root Layout loads)
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                      DEFAULT_DENIED                      │
   │ gtag('consent', 'default', { ad_storage: 'denied', ... })│
   │ GTM Snippet loads with afterInteractive strategy         │
   └────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                     BANNER_PRESENTED                     │
   │ ConsentBanner displays accept/decline choices            │
   └─────────────┬──────────────────────────────┬─────────────┘
                 │ (User clicks Accept)         │ (User clicks Decline)
                 ▼                              ▼
   ┌───────────────────────────┐  ┌───────────────────────────┐
   │      CONSENT_GRANTED      │  │      CONSENT_DENIED       │
   │ gtag('consent', 'update', │  │ gtag('consent', 'update', │
   │ { ad_storage: 'granted'}) │  │ { ad_storage: 'denied'})  │
   └───────────────────────────┘  └───────────────────────────┘
```

---

## 6. Authentic Defect Mechanisms vs. Superficial Mocks

In accordance with strict integrity rules, the six defects in this workspace are implemented as **authentic software bugs** that a real developer could write and deploy, not fake boolean switches or mocked flags:

| Defect | Route | Authentic Implementation Mechanism | Conversion Failure Consequence |
|---|---|---|---|
| **Defect 1** | `/scenario/defect-1` | Pure DOM click event listener bound to the `<button>` element that executes immediately on click, preceding the form validation lifecycle. | **False Conversion**: Button clicks without valid inputs fire conversions, wasting ad spend on clickers rather than buyers. |
| **Defect 2** | `/scenario/defect-2` | An un-removed legacy tracking script (`legacy-conversion-listener.ts`) survives alongside a newly added post-success promise handler. | **Duplicate Conversion**: 2 conversions pushed for 1 lead, artificially halving reported CPA and misleading ad bidding. |
| **Defect 3** | `/scenario/defect-3` | Front-end success handler imports event constant from a stale constants file exporting `LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess'`. | **Missing Conversion**: 0 conversions tracked in analytics despite 1 genuine paying lead in CRM. |
| **Defect 4** | `/scenario/defect-4` | Separate payload mapping module references deprecated property names (`form_name` vs `form_id`), causing values to drop to `undefined`. | **Parameter Schema Drift**: Missing parameters cause conversion tags to fail custom event triggers and conversion value tracking. |
| **Defect 5** | `/scenario/defect-5` | Multi-step form built with client-side routing drops query parameters; form submit handler reads `window.location.search` instead of storage. | **Attribution Loss**: Paid search ad leads ($350 audit inquiry) get classified as "direct" traffic; ad campaigns appear unprofitable. |
| **Defect 6** | `/scenario/defect-6` | Server-side field mapper (`mappers/defect-06.ts`) drops `utm_campaign` and puts `utm_source` into `lead_source_detail` while leaving `lead_source` empty. | **CRM Misalignment**: Marketing attribution is lost in the CRM, breaking sales pod routing and revenue attribution. |

---

## 7. Verification & Build Architecture

The application is validated by a 7-stage automated verification pipeline executed via `npm run verify`:

```
Stage 1: ESLint (npm run lint)
   └─► Stage 2: TypeScript Strict Compilation (npm run typecheck)
         └─► Stage 3: Vitest Unit & Contract Suite (npm run test:unit)
               └─► Stage 4: Next.js Production Build (npm run build)
                     └─► Stage 5: Playwright E2E & Axe A11y Suite (npm run test:e2e)
                           └─► Stage 6: Security & PII Scan (npm run scan:pii)
                                 └─► Stage 7: Documentation Command Check (npm run check:docs)
```

The canonical verification artifact is `demo/test-results/verification-matrix.md`, generated dynamically by `npm run emit:matrix` from actual test outputs.
