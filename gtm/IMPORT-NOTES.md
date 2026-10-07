# GTM import template notes

`responselock-demo-container.json` is a Version 2 Web-container import template for the Alder V2 local demo. It has not been imported or published. The known target `GTM-KRH5W5MX` is currently empty, and GTM account access is pending. The export's account/container metadata IDs are placeholders; GTM will assign destination identities during import.

## Template contents

The template contains four tags, two triggers, and thirteen user-defined variables:

| Asset | Configuration |
|---|---|
| Google Tag - GA4 | Uses a measurement-ID placeholder through `const - ga4_measurement_id`, with `debug_mode: true`, on All Pages; paused |
| GA4 Event - `demo_lead_success` | Paused; exact custom event and Alder identity filters; maps the V2 payload fields to GA4 parameters |
| Google Ads - Conversion Linker | Paused; All Pages trigger |
| Google Ads - Lead Conversion | Paused; exact custom event trigger; conversion ID and label are explicit replacement placeholders; transaction ID maps to `submission_id` |
| `CE - demo_lead_success` | Custom Event trigger with exact event name, `form_id=alder_consultation`, `lead_type=consultation`, and UUID-formatted `submission_id` filters |
| All Pages | Pageview trigger for the Google Tag and Conversion Linker |
| `const - ga4_measurement_id` | Placeholder `G-XXXXXXXXXX`; replace only after confirming the intended stream and access |
| `dlv - ...` | Data Layer Version 2 variables for `form_id`, `lead_type`, `submission_id`, `attribution_status`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `timestamp`, and `debug_mode` |

The GA4 event parameters use those twelve values. The `event` field selects the trigger and is not sent as an event parameter. The V2 payload also has `scenario`; the GTM template intentionally does not register it as a DLV or GA4 parameter. All four tags are paused in the template. No Meta Pixel, Conversions API, or Enhanced Conversions tags are included.

## Import and review

1. Use a dedicated non-production Web container and create a new workspace for this import.
2. Import `gtm/responselock-demo-container.json` with **Merge**. Review all additions and conflicts before confirming; do not overwrite a shared workspace.
3. Inspect both Google Ads tags. They are paused and cannot send a conversion as supplied. Do not unpause the conversion tag until an authorized real conversion ID and label are available and the destination is confirmed as a test action.
4. Replace `G-XXXXXXXXXX` only after confirming the intended non-production stream. The configured application value `G-GQBPF316M0` is known, but property access is pending and a syntactically valid ID does not prove event receipt.
5. Review the event and identity filters, then unpause only the Google Tag and GA4 Event tags for an authorized Preview check. Confirm the event tag fires once and inspect its mapped values. Preview evidence applies only to the imported workspace; publish only after a separate review and explicit authorization. Keep both Google Ads tags paused.

## Evidence status

The local application contract and this JSON template can be inspected locally. GTM import, Preview, publication, GA4 receipt, and Key Event setup have not been confirmed. The real GTM container is empty at the time of this documentation, and GA4 property access is pending. No Google Ads conversion was tested.
