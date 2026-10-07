# GA4 DebugView verification guide

`G-GQBPF316M0` is the configured measurement ID for the demo, but GA4 property access is pending. This guide is a procedure for a future authorized check; it is not evidence that GA4 has received events or that `demo_lead_success` is marked as a Key Event.

## Check receipt

1. Confirm the ID in the imported GTM workspace matches the intended non-production GA4 stream.
2. Connect GTM Preview to the locally running application.
3. Submit one valid Alder lead and confirm `demo_lead_success` appears in the GTM Preview event timeline after the API success response.
4. In the accessible GA4 property, open **Admin → Data display → DebugView** and look for the same event.
5. Inspect the parameters: `form_id` (`alder_consultation`), `lead_type` (`consultation`), `submission_id`, `attribution_status`, the allowlisted UTM values, `gclid`, `timestamp`, and `debug_mode`. Confirm that no names, emails, phone numbers, free text, or raw URLs are present.
6. Record the observation, property/stream used, date and time, and whether the event and parameters appeared. Treat absence as an observation to investigate, not proof of a specific cause.

The configured dataLayer debug flag and a GTM Preview session make an event eligible for debugging; neither guarantees GA4 receipt. Consent state, blockers, network access, tag configuration, and property selection can affect what is observed. Do not claim Key Event status until it is checked in the GA4 property.

## Current status

Local tests can verify the application payload. GTM import and Preview have not been confirmed. GA4 receipt and Key Event configuration have not been confirmed because account access is pending. Google Ads receipt and bidding are outside the verification performed here.
