# Workspace status

**Updated:** 2026-10-08

The original ResponseLock lab and its intentional defect scenarios remain in the repository. The Alder V2 flow is additive. Unit, E2E, type, lint, documentation, PII, production-build, and production-browser checks are complete. These results verify the local demo flow only, not a complete external conversion pipeline.

## Local verification

- Unit tests: **149/149 passed** across 17 files.
- Focused V2/observability E2E: **9/9 passed** (5 V2 tests plus 4 observability tests).
- Full E2E suite: **37/37 passed** in approximately two minutes, including all 5 new V2 tests and all 32 legacy tests.
- E2E was run against Playwright's development server; the production build was reviewed separately. Stop any server occupying port 3000 before rerunning E2E because Playwright reuses an existing server and the production app rejects the test-only `/api/dev/reset` endpoint.
- TypeScript typecheck: passed.
- ESLint: passed with **0 errors** and **14 warnings**.
- Documentation command checks: **52 passed**.
- PII scan: passed.
- Production build: passed; all 17 routes compiled. Four pre-existing unused-variable build warnings remain.
- Production-browser review: passed on desktop at 1440px and 1280px and mobile at 390px, with no horizontal overflow. A fresh production tab had no console errors or warnings.
- Native desktop recordings are not public-ready: the first 35:29 capture has a DPI-scaled crop, and other native captures include unrelated foreground-app switches.
- Browser-only visual evidence: `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\qa-browser-repair.webm` is a 14.20-second VP8 assembly of real timestamped browser screenshots. `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\upwork-repair-proof-10s.webm` is the exact 10.00-second, silent, 1425×891, 5 fps excerpt using 50 real browser screenshots from the 1–11 second range. These are screenshot-frame assemblies, not continuous recordings or evidence of platform receipt.

The full E2E run may reset local CRM data. A pre-test backup is available at `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\crm-before-v2-tests.jsonl`; final cleanup restored the original six CRM rows from that backup. Production-browser review verified the Alder attribution route, validation-before-confirmation, successful local API and CRM persistence, one canonical event, duplicate replay suppression, and suppression after refresh. The intentionally broken audit example emitted an excluded diagnostic event without creating a CRM record; the corrected blank form emitted no canonical event or CRM record. The legacy Defect 5 attribution-loss check was done in a development browser, not the production-browser review. Local checks establish local behavior only; they do not establish external tag delivery.

## External-service status

- GTM container `GTM-KRH5W5MX`: account sign-in is unavailable. The live container script responds, but the container currently has no tags, triggers, or rules. No Preview session, import, or publication has been verified.
- `gtm/responselock-demo-container.json`: a four-tag import template with two triggers and thirteen variables. All tags are paused. The GA4 measurement value is a placeholder; Ads conversion ID and label are replacement placeholders. Google Ads tags and Conversion Linker must remain paused until real account details and configuration are reviewed. Import acceptance has not been verified in GTM.
- GA4 measurement ID `G-GQBPF316M0`: configured locally; property access is pending. Event receipt and Key Event status are unverified.
- Google Ads: no conversion action ID or label is configured; no conversion has been sent or tested.
- Meta Pixel, Conversions API, and Enhanced Conversions: no implementation is included.

The GTM script loaded during browser review, but its live container remains empty. No GTM Preview, GA4 DebugView, published-container, live Ads, or external conversion result is established by local tests or build output.

The screenshot assembler is `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\v2-browser-capture\assemble-browser-capture.ps1`. It samples actual browser screenshots against their manifest timestamps and repeats only captured frames; no synthetic frames or labels are added.
