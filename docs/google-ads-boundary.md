# Google Ads boundary

No Google Ads conversion has been sent or tested from this local training workspace. There is no real conversion action ID or label configured.

The GTM import template includes a Conversion Linker and a Google Ads conversion tag as an architectural example. Both are paused. The conversion tag contains explicit replacement placeholders for its conversion ID and label, and uses the V2 `submission_id` as its transaction ID. It cannot be treated as ready to send conversions. Keep the tags paused unless an authorized non-production test action and its identifiers are confirmed.

The local demo can exercise lead submission, attribution capture, CRM persistence, and the sanitized `demo_lead_success` dataLayer event. GTM Preview, GA4 receipt, GA4 Key Event setup, Google Ads import, Ads conversion receipt, campaign attribution, spend, and bidding results are separate checks. The GTM container is currently empty; GTM access is pending. GA4 property access is also pending.

No Meta Pixel, Conversions API, Enhanced Conversions, offline conversion upload, or live ad network integration is included. The local event excludes PII. Do not add customer form values, raw URLs, or hashed customer data to the analytics payload as part of this template.
