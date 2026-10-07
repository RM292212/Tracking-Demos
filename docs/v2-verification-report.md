# Alder V2 verification report

**Date:** 2026-10-08
**Scope:** Local application behavior, automated checks, and production-browser review. This report does not claim an end-to-end Google Ads or GA4 conversion path.

## V2 UI and event contract

The Alder V2 flow is additive: the root route presents the fictional BusinessLeadForm, and `/audit` provides the repair example and evidence panel. A V2 `demo_lead_success` event is emitted only after a schema-valid local API receipt matches the submitted UUID and `baseline` scenario. Its exact 14 fields are `event`, `form_id`, `lead_type`, `scenario`, `submission_id`, `attribution_status`, `debug_mode`, `timestamp`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, and `gclid`. Attribution fields are sanitized; names, email, phone, free text, and raw URLs do not enter the event. The legacy seven-key contract remains unchanged.

While awaiting a response, the tab stores the complete pending request in `sessionStorage` under `responselock_v2_pending_request`; this contains form values needed to retry the same API request and idempotency key. The pending record is cleared after confirmation or an explicit start-over. Event deduplication is keyed by `submission_id` for the current tab session. This retry state is separate from the PII-free dataLayer event.

## Verification results

- Unit tests: **149/149 passed** across 17 files.
- Focused V2/observability E2E checks: **9/9 passed** (5 V2 tests plus 4 observability tests).
- Complete E2E suite: **37/37 passed**, including 5 V2 tests and 32 legacy tests.
- TypeScript typecheck: passed.
- ESLint: passed with 0 errors and 14 warnings.
- Documentation checks: 52 passed; PII scan passed.
- Production build: passed; all 17 routes compiled. Four unused-variable build warnings remain.
- The original six local CRM rows were restored after E2E cleanup from `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\crm-before-v2-tests.jsonl`.
- E2E was run against Playwright's development server. Stop any server on port 3000 before a rerun; Playwright reuses an existing server, and production returns 403 for the test-only `/api/dev/reset` endpoint.

## Production-browser review

The production build was reviewed at 1440px and 1280px desktop widths and at 390px mobile width. The pages had no horizontal overflow. A fresh production tab had no console errors or warnings.

The tested flow began with tagged navigation to `/audit`; the synthetic UTM and click-ID values remained available there. The intentionally broken example emitted the canonical event name with the excluded `form_id: alder_consultation_broken` and created no CRM record. After applying the corrected handler, the same blank submission produced no canonical event or CRM record. A synthetic valid submission reached the local API, produced a matching CRM record and one canonical event, and included no PII in the event payload. Replaying the same submission ID confirmed the duplicate while keeping the canonical event count at one. Reloading did not create a new event and showed the prior receipt state. The invalid mobile submission produced no canonical event.

The primary-agent **development-browser** review also confirmed the legacy attribution-loss scenario: the legacy defect form did not carry attribution into its CRM record. The original six legacy defect scenarios remain preserved; the full suite's 32 legacy E2E tests passed. These are local application observations, not proof of external analytics receipt.

## GTM, GA4, and Ads boundaries

The GTM script loaded in the browser, but the live container `GTM-KRH5W5MX` currently has no tags, triggers, or rules. Account sign-in is unavailable, so no import acceptance, Preview session, or publication was verified. The repository JSON is a four-tag import template with two triggers and thirteen variables; every tag is paused. The GA4 measurement setting and Ads conversion ID/label are placeholders in that template.

The configured GA4 measurement ID `G-GQBPF316M0` has not been verified in the GA4 property. GA4 receipt and Key Event status are unknown. No Google Ads conversion action is configured or tested. Meta Pixel, Conversions API, and Enhanced Conversions are not implemented.

## Recording artifact

Native desktop recordings are not public-ready: the first raw capture, `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\qa-screen-recording-20261008-001124.webm`, is 35:29, 10,645 VP8 frames at 1440×900, but its bounds are DPI-cropped. Other native captures include unrelated foreground-app switches.

The clean browser-only evidence is assembled from the 57 actual timestamped CUA browser screenshots in `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\v2-browser-capture\manifest.json`. `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\qa-browser-repair.webm` is 14.20 seconds. `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\upwork-repair-proof-10s.webm` is an exact 10.00-second silent VP8 excerpt at 1425×891 and 5 fps, using 50 actual browser screenshots sampled from original capture times 1s through 11s. The excerpt starts at original capture time 1s, already on `/audit`; its clip timeline is: 0–1s, audit page; about 1s, intentionally broken blank form shows one event-name diagnostic with an excluded `form_id` and no CRM record (about 2s in the original capture); about 4s, corrected blank form is blocked before confirmation (about 5s original); about 7s, synthetic valid submission reaches and is confirmed by the local API (about 8s original); 8–10s, the held final browser frame shows one matching CRM row and one canonical event. A suggested edit that begins with a website view would need an earlier source frame; this excerpt does not contain it. Frames between captures hold the latest actual screenshot; this is not a continuous screen recording. It is visual evidence of the local flow only, not GTM, GA4, or Ads receipt.

The assembler helper is `C:\Users\Ranji\.codex\visualizations\2026\10\07\01a11787-06dd-78d1-bdc6-9b49754eab43\v2-browser-capture\assemble-browser-capture.ps1`. Its PowerShell syntax parse passed. It accepts real PNG or JPEG image data, samples manifest timestamps at 5 fps, and copies JPEG screenshot bytes unchanged.
