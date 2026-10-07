# Manual verification runbook

This procedure covers local Alder V2 behavior and the optional external GTM/GA4 checks. The known GTM container `GTM-KRH5W5MX` is empty and account access is pending. GA4 access is pending. No Ads conversion has been tested. Local success does not establish external tag delivery.

## Local verification

1. Back up `demo/data/crm-records.jsonl` before running E2E or any flow that resets the local CRM.
2. Before E2E, stop any server already using port 3000, especially a production server. Playwright reuses an existing server on that port; production returns 403 for the test-only `/api/dev/reset`, while E2E expects its configured development server to start.
3. From the repository root, run `npm run lint`, `npm run typecheck`, and `npm run test:unit`. Run E2E separately only after confirming the CRM backup is available; the E2E setup may reset local CRM data.
4. Start the demo with `npm run dev` and open `/` and `/audit`.
5. On the home page, inspect the consultation form. Submit it empty and confirm validation appears, no POST to `/api/leads` occurs, and no canonical V2 event is pushed.
6. On `/audit`, use the invalid-submit repair example. It may show a `demo_lead_success` event name with `form_id: alder_consultation_broken`; confirm it is excluded by the Alder GTM trigger conditions. The corrected empty form must validate before any API request or canonical event.
7. Use the synthetic details action to exercise the real local endpoint. Confirm a matching success response, a local CRM record with the same `submission_id`, and one canonical `demo_lead_success` payload with `form_id: alder_consultation`, `lead_type: consultation`, attribution status, safe attribution values, `timestamp`, and `debug_mode: true`.
8. Exercise a failed request followed by retry. The retry must reuse the same idempotency key; a confirmed duplicate may create the one event if the first response was lost, while later replays must not add another event. A new lead requires **Start another request**.
9. Capture actual screenshots or a screen recording only from the live browser. Label local observations as local; do not mark GTM, GA4, or Ads evidence confirmed from local output.

## Optional GTM Preview

Proceed only after authorized access and confirmation of the non-production destination. Import `gtm/responselock-demo-container.json` into a new workspace using **Merge**. The template contains four paused tags, two triggers, and thirteen variables. It starts with a GA4 measurement placeholder and replacement Google Ads conversion ID/label values. Review the destination and exact trigger filters before enabling anything.

The `CE - demo_lead_success` trigger requires the exact event name, `form_id=alder_consultation`, `lead_type=consultation`, and a UUID-formatted `submission_id`. It intentionally excludes legacy lab events and the invalid-form diagnostic. For a Preview check, replace the GA4 placeholder only with the confirmed intended stream, then temporarily unpause the Google Tag and GA4 Event tag. Keep both Ads tags paused. Confirm the GA4 Event tag fires once for the valid V2 event and inspect its mapped values. Do not publish as part of this procedure.

## Optional GA4 DebugView

After GTM Preview confirms the intended event tag configuration, use the authorized non-production GA4 property to check DebugView receipt. Inspect `form_id`, `lead_type`, `submission_id`, `attribution_status`, the five UTM values, `gclid`, `timestamp`, and `debug_mode`. Record the date, property/stream, and actual observed event. Mark the event as a Key Event only after separately confirming the setting in GA4 and with authorization.

## Evidence and boundaries

Keep external evidence pending until it is personally observed in the relevant product. The import template and local tests do not establish GTM publication, GA4 receipt, Key Event status, Google Ads receipt, campaign attribution, or bidding effects. No Meta Pixel, Conversions API, or Enhanced Conversions test is part of this workspace.
