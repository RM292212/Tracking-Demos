# Tracking demos

This repository contains two local training demos for auditing lead conversion tracking. The original ResponseLock lab remains available with its six intentional defects. The Alder V2 route adds a fictional BusinessLeadForm flow and an `/audit` evidence view.

The V2 success event is `demo_lead_success`. It is pushed only after the local API confirms a lead, and contains a generated submission ID, the `alder_consultation` form ID, `consultation` lead type, attribution status and allowlisted attribution values. Names, email addresses, phone numbers, free text and raw URLs are excluded. The V2 event contract is additive; the legacy seven-key contract and scenarios remain preserved.

While a request is unresolved, the complete pending form payload is kept in that browser tab's `sessionStorage` so a retry reuses the same values and idempotency key. It is cleared after confirmation or when the user starts over. This browser-local retry record is separate from the PII-free dataLayer event.

## Verification boundaries

- Local form, API, attribution, CRM and dataLayer behavior can be exercised by the local app and unit tests.
- The GTM container ID in the local environment refers to a known empty container. A JSON file in `gtm/` is an import template; it is not evidence that its tags are imported, published, or firing.
- A GA4 measurement ID is configured locally, but property access is pending, so event receipt and Key Event configuration are unverified.
- Google Ads tags in the import template are paused and contain replacement placeholders until a real conversion ID and label are supplied. No Ads conversion has been tested.
- No Meta Pixel, Conversions API, or Enhanced Conversions implementation is included.

## Run locally

From the repository root, use `npm run dev`, `npm run test:unit`, `npm run lint`, or `npm run typecheck`. Before `npm run test:e2e`, preserve CRM data and stop any server occupying port 3000, especially a production server. Playwright reuses an existing server on that port; a production server rejects the test-only `/api/dev/reset` request with 403 instead of letting the configured development server start.

See [the GTM import notes](gtm/IMPORT-NOTES.md), [the audit boundaries](docs/google-ads-boundary.md), and [the project status](STATUS.md) for current evidence and setup details.
