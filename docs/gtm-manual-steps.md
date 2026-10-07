# Manual GTM configuration reference

Use these settings only in a dedicated non-production Web container and a new workspace. They describe a template configuration; they do not mean the known container `GTM-KRH5W5MX` has been configured. Account access is pending.

## Variables

Create a Constant named `const - ga4_measurement_id` with the intended non-production GA4 measurement ID. The sample value is `G-GQBPF316M0`; property access and event receipt remain unverified.

Create Data Layer Version 2 variables named `dlv - <key>` for each key below:

`form_id`, `lead_type`, `submission_id`, `attribution_status`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `timestamp`, and `debug_mode`.

## Trigger

Create a **Custom Event** trigger named `CE - demo_lead_success`. Match the exact event name `demo_lead_success` and add filters requiring `dlv - form_id` equals `alder_consultation`, `dlv - lead_type` equals `consultation`, and `dlv - submission_id` matches a UUID pattern. The filters intentionally exclude the Alder invalid-form diagnostic payload, which uses a different form ID.

## Google Tag and GA4 event

Create `Google Tag - GA4` using `{{const - ga4_measurement_id}}`, trigger it on **All Pages**, and set the configuration parameter `debug_mode` to `true`. Keep this tag paused until the measurement ID is confirmed and the configuration is reviewed.

Create `GA4 Event - demo_lead_success` with event name `demo_lead_success`, measurement ID `{{const - ga4_measurement_id}}`, and trigger `CE - demo_lead_success`. Keep it paused until reviewed. Map these event parameters:

| Parameter | GTM value |
|---|---|
| `form_id` | `{{dlv - form_id}}` |
| `lead_type` | `{{dlv - lead_type}}` |
| `submission_id` | `{{dlv - submission_id}}` |
| `attribution_status` | `{{dlv - attribution_status}}` |
| `utm_source` | `{{dlv - utm_source}}` |
| `utm_medium` | `{{dlv - utm_medium}}` |
| `utm_campaign` | `{{dlv - utm_campaign}}` |
| `utm_term` | `{{dlv - utm_term}}` |
| `utm_content` | `{{dlv - utm_content}}` |
| `gclid` | `{{dlv - gclid}}` |
| `timestamp` | `{{dlv - timestamp}}` |
| `debug_mode` | `true` |

`scenario` is present in the application event but is not mapped by this template. The event name itself is used by the trigger and is not an event parameter.

## Google Ads tags

The JSON import template includes a paused Conversion Linker on All Pages and a paused Google Ads conversion tag on `CE - demo_lead_success`. The conversion tag includes replacement placeholders for the conversion ID and label and uses `submission_id` as its transaction ID. Keep these tags paused unless a real authorized test conversion action and its identifiers have been confirmed. No conversion is sent by the supplied template.

## Preview checks

After reviewing the config, temporarily unpause the Google Tag and GA4 Event tag for Preview. Connect Preview to the local application and submit a valid Alder lead. Verify that the filtered custom event appears after local API success and that the GA4 Event tag fires once with the mapped values. The invalid-form diagnostic event must not match the Alder trigger filters. Preview only verifies the workspace. Use GA4 DebugView to verify receipt; mark `demo_lead_success` as a Key Event separately if authorized. Neither receipt nor Key Event setup is confirmed at present. Do not publish as part of this procedure.
