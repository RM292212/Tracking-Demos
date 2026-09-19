# ResponseLock Audit Evidence Repository

Welcome to the ResponseLock Conversion-Integrity Evidence Repository. This directory houses the standardized technical proof packages generated during the ResponseLock Lead & Conversion Integrity Audit ($350 fixed-scope evaluation for paid-media agencies).

The primary objective of these evidence packages is to provide incontrovertible, reproducible proof of tracking health or failure across the entire conversion chain:
`ad click -> landing page with UTM/GCLID -> attribution capture -> form validation -> submission -> dataLayer -> GTM -> GA4 -> CRM record`.

---

## Directory Layout & Conventions

The repository is structured into seven distinct verification packages: one baseline reference package confirming an intact conversion chain, and six packages documenting production-shaped tracking defects.

```text
evidence/
├── README.md                                  # Repository overview and evidence standards
├── baseline/
│   ├── finding.md                             # Verified Baseline: intact conversion chain
│   └── screenshots/                           # Captured screenshots (DOM, Console, Network, CRM)
├── defect-01-invalid-submit-fire/
│   ├── finding.md                             # Finding RL-AUDIT-DEF-001: Premature click conversion
│   └── screenshots/
├── defect-02-duplicate-conversion/
│   ├── finding.md                             # Finding RL-AUDIT-DEF-002: Duplicate legacy/modern events
│   └── screenshots/
├── defect-03-missing-conversion/
│   ├── finding.md                             # Finding RL-AUDIT-DEF-003: Misspelled event name
│   └── screenshots/
├── defect-04-bad-event-parameters/
│   ├── finding.md                             # Finding RL-AUDIT-DEF-004: Parameter schema drift
│   └── screenshots/
├── defect-05-attribution-loss/
│   ├── finding.md                             # Finding RL-AUDIT-DEF-005: Query loss across SPA navigation
│   └── screenshots/
└── defect-06-incomplete-crm-record/
    ├── finding.md                             # Finding RL-AUDIT-DEF-006: Server CRM mapper corruption
    └── screenshots/
```

### Folder Conventions

1. **`finding.md`**: The authoritative technical report for the scenario. Every finding package contains a `finding.md` adhering strictly to the ResponseLock Audit Finding Specification.
2. **`screenshots/`**: High-resolution screen captures of developer tooling during test execution (DevTools Console, Network requests, Observability Timeline, and Simulated CRM Viewer).
3. **Naming Consistency**: Defect folders use zero-padded identifiers (`defect-01-*` through `defect-06-*`) aligned with the Defect Catalog (`docs/defect-catalog.md`).

---

## Finding Document Schema

Each `finding.md` file contains the following standardized sections:

| Section | Description |
|---|---|
| **Finding Header** | Finding ID (`RL-AUDIT-BASE-001` or `RL-AUDIT-DEF-001`..`006`), Title, Audit Status, Severity, and Affected Components. |
| **Real-World Analogue** | The concrete production development error, agency handoff mistake, or legacy migration oversight represented by this scenario. |
| **Reproduction Steps** | Deterministic, step-by-step browser instructions to trigger and observe the defect. |
| **Technical Evidence** | Verbatim technical payloads: sanitized `window.dataLayer` event JSON, raw CRM row JSONL snippet, HTTP network trace, and timeline entries. |
| **Verification Layers** | Status across the four verification tiers: Confirmed locally, Requires GTM Preview, Requires GA4 DebugView, Not tested in Google Ads. |
| **Business Impact** | Quantitative and qualitative damage to paid advertising spend, Smart Bidding algorithms, and sales pipeline attribution. |
| **Remediation Code Diff** | Production-ready unified diff (`--- a/... +++ b/...`) illustrating the precise code fix required. |

---

## Zero-PII Policy & Safety Mandate

ResponseLock enforces a strict, automated Zero-PII (Personally Identifiable Information) policy across all evidence artifacts:

- **Prohibited Data**: Real customer names, real email addresses, real phone numbers, real business postal addresses, and unredacted raw query strings containing personal information are strictly forbidden.
- **Permitted Synthetic Fixtures**:
  - Email addresses must strictly use approved RFC 2606 fictional domains: `@example.com`, `@example.org`, `@example.net`, or `@domain.com`.
  - Phone numbers must strictly use the 555-0100 to 555-0199 fictional allocation (e.g., `+1-555-0100`).
  - Company names must be synthetic fixtures (e.g., *Acme Growth Partners*, *Apex Media Lab*).
  - Identifiers must be randomly generated RFC 4122 UUID v4 strings.
- **Analytics Whitelist**: Only the seven approved keys defined in `demo/src/lib/contracts/events.ts` may appear in conversion payloads (`event`, `form_id`, `lead_type`, `scenario`, `submission_id`, `attribution_status`, `debug_mode`).
- **Automated Verification**: Evidence artifacts are automatically scanned using `npm run scan:pii` to guarantee zero PII leaks and zero unauthorized tracking ID literals.

---

## Four-Layer Verification Framework

To avoid confusion between browser-level events and ad network ingestion, all evidence packages classify observations into four explicit verification tiers:

1. **Confirmed locally**: Proven in the running application via DOM state, browser console `window.dataLayer` inspection, and local JSONL CRM records.
2. **Requires GTM Preview**: Requires manual verification by connecting Google Tag Assistant to confirm custom event trigger matching and tag firing rules (Pending user verification).
3. **Requires GA4 DebugView**: Requires manual verification by observing real-time event ingestion and parameter extraction inside the Google Analytics 4 administrative DebugView console (Pending user verification).
4. **Not tested in Google Ads**: Acknowledged boundary. Google Ads conversion actions are conceptual in training workspaces to prevent test data from contaminating live Smart Bidding bidding signals or generating accidental billing activity.

---

## Integration with the ResponseLock Audit Report

During a commercial $350 audit, these evidence packages form the evidentiary backbone of the **Sample Audit Report** (`audit-template/sample-audit-report.md`). Instead of subjective claims, the client receives exact timestamped logs, JSON payloads, and side-by-side diffs proving where their conversion tracking leaks revenue.
