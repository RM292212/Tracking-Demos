# GTM setup and evidence guide

This guide describes the optional path from the local Alder demo to a dedicated GTM Web container. The known container `GTM-KRH5W5MX` is currently empty and account access is pending. The file `gtm/responselock-demo-container.json` is an import template, not a live or published configuration. All template tags are paused, and the GA4 measurement ID begins as a placeholder.

## Before import

Use a non-production Web container and a new workspace. The template has placeholder account/container metadata, four paused tags, two triggers, and thirteen user-defined variables. It defines a Google Tag and GA4 event tag for `demo_lead_success`. The trigger also requires `form_id=alder_consultation`, `lead_type=consultation`, and a UUID-formatted `submission_id`; this excludes the invalid-form diagnostic event. The Google Ads Conversion Linker and conversion tag remain paused, and the conversion ID and label are replacement placeholders. No Meta or Enhanced Conversions implementation is included.

## Import steps

1. In GTM, select the intended non-production Web container and create a new workspace.
2. Choose **Admin → Import Container**, then select `gtm/responselock-demo-container.json`.
3. Choose **Merge** and review the import preview. Confirm the four tags, two triggers, and thirteen variables. Resolve name conflicts deliberately; do not overwrite a shared workspace.
4. Replace the `G-XXXXXXXXXX` value in `const - ga4_measurement_id` only after confirming the intended stream. The application's configured value `G-GQBPF316M0` is known, but GA4 access is pending and receipt has not been verified.
5. Review the filters and tag settings, then unpause the Google Tag and GA4 Event tag only for an authorized Preview check. Submit a valid Alder lead and inspect the `demo_lead_success` event. Verify the GA4 Event tag fires once and the `form_id`, `lead_type`, `submission_id`, `attribution_status`, attribution values, timestamp, and debug flag resolve as expected.
6. Keep Google Ads tags paused until an authorized conversion ID and label are provided and the tag is reviewed against the intended test action. Publishing is a separate action and is not part of local verification.

## What each layer establishes

Local tests establish local form, API, attribution, CRM, and dataLayer behavior. GTM Preview can establish whether an imported workspace evaluates a trigger and fires a tag. GA4 DebugView is needed to establish receipt in an accessible property. A Key Event must be configured separately in GA4. No Ads conversion action, ad spend, Meta Pixel, or Conversions API behavior has been tested here.

See [GTM import notes](../gtm/IMPORT-NOTES.md), [manual GTM setup](gtm-manual-steps.md), and [the GA4 DebugView guide](ga4-debugview-setup.md).
