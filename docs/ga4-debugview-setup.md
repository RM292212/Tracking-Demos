# GA4 DebugView Inspection Guide & Verification Checklist

This guide instructs auditors and testers how to inspect real-time conversion events in Google Analytics 4 (GA4) DebugView using `debug_mode: true`, verify parameter integrity, and record manual test observations.

---

## 1. Why GA4 DebugView is Essential

Standard GA4 reports experience a processing latency of 24 to 48 hours. Standard Realtime reports aggregate data and truncate parameter inspection. 

**GA4 DebugView** provides a live, un-aggregated event stream with sub-second latency, allowing auditors to inspect:
- Exact arrival timestamp of incoming events down to the second.
- Complete event parameter dictionaries (verifying custom parameters).
- Presence or absence of events resulting from tracking defects.
- Verification that zero Personally Identifiable Information (PII) is transmitted to Google servers.

---

## 2. How `debug_mode: true` Works in ResponseLock

In ResponseLock, `debug_mode` is enabled automatically through two complementary mechanisms:
1. **Application DataLayer Contract**: Every valid or defect-driven `demo_lead_success` payload includes `debug_mode: true` directly in the object pushed to `window.dataLayer`.
2. **GTM Tag Configuration**:
   - The `Google Tag - GA4 Configuration` tag sets `debug_mode: true` in its configuration table.
   - The `GA4 Event - demo_lead_success` tag passes `debug_mode: true` as an explicit event parameter.
3. **Google Tag Assistant**: When connected via GTM Preview mode (`tagassistant.google.com`), a debug signal (`_dbg=1`) is appended to requests, automatically routing hits to DebugView.

---

## 3. Navigating to GA4 DebugView

1. Open [analytics.google.com](https://analytics.google.com/).
2. Select your dedicated non-production GA4 property.
3. In the lower-left navigation, click **Admin** (gear icon).
4. Under **Data display** (or *Property Settings*), click **DebugView**.
5. In the top-left corner of the DebugView screen, locate the **Debug Device** selector:
   - If multiple testers or devices are active, select your browser instance (e.g. *Google* or *Chrome*).
   - If no device appears, ensure the demo app is running, GTM Preview is connected, and trigger an interaction in the application.
   - **Consent Requirement**: Ensure that you have clicked **"Accept All Cookies"** on the demo application's Consent Banner so `analytics_storage: 'granted'` is active; default denial suppresses regular hit collection.

---

## 4. Reading the DebugView Interface

The DebugView dashboard contains three primary panels:

```
+-------------------+-----------------------------------+-----------------------+
|  Minutes Stream   |          Seconds Stream           |    Parameter Detail   |
|   (30 Minutes)    |           (60 Seconds)            |    (Selected Event)   |
+-------------------+-----------------------------------+-----------------------+
| Displays vertical | Displays pulsing timeline circles | Clicking an event in  |
| bars showing hit  | for each incoming event in real-  | the seconds stream    |
| volume over the   | time. Top events list shows       | reveals all key-value |
| past 30 minutes.  | event counts in the session.      | parameters.           |
+-------------------+-----------------------------------+-----------------------+
```

### Inspecting Parameters
1. Click the blue circle for `demo_lead_success` in the seconds stream.
2. In the right-hand panel, inspect the **Parameters** tab:
   - `submission_id`: Must match the UUID displayed on the demo app's success panel and Observability timeline.
   - `form_id`: Should be `lead_audit_demo` (absent or undefined in Defect 4).
   - `lead_type`: Should be `agency_audit_inquiry` (incorrect `'contact'` in Defect 4).
   - `scenario`: Must match the active scenario (`baseline`, `defect-1`, etc.).
   - `attribution_status`: Must be `'present'`, `'partial'`, `'missing'`, or `'dropped'`.
   - `debug_mode`: Value `1` or `true`.
3. Verify the **User Properties** tab and confirm zero user-level PII has been stored.

---

## 5. Expected Behavior Across All 7 Scenarios

| Scenario | Application Action | Expected in GA4 DebugView | Diagnostic Interpretation |
|---|---|---|---|
| **Baseline Valid** | Submit valid lead | Exactly 1 `demo_lead_success` event with all 5 parameters | Correct conversion tracking. |
| **Baseline Invalid** | Click submit with empty form | **Zero events** appear in DebugView | Correct form validation gate. |
| **Defect 1** | Click submit with empty form | Exactly 1 `demo_lead_success` event (`scenario: 'defect-1'`) | **False conversion**: Fired on intent, not valid lead. |
| **Defect 2** | Submit valid lead | **2 x `demo_lead_success`** with identical `submission_id` | **Duplicate conversion**: Double-counting in analytics. |
| **Defect 3** | Submit valid lead | **Zero `demo_lead_success`** events | **Missing conversion**: Event name typo (`demo_lead_sucess`). |
| **Defect 4** | Submit valid lead | 1 `demo_lead_success`, but `form_id` missing & `lead_type: 'contact'` | **Schema drift**: Reporting dimensions broken. |
| **Defect 5** | Submit valid lead after SPA step | 1 `demo_lead_success` with `attribution_status: 'dropped'` | **Attribution loss**: Query parameters lost on navigation. |
| **Defect 6** | Submit valid lead | 1 `demo_lead_success` appears correctly in GA4 | **Downstream defect**: GA4 is correct, but CRM is incomplete. |

---

## 6. Manual Verification Table (Blank for Auditors)

Use this table during live or manual training audits to record timestamped observations directly from GA4 DebugView.

| Timestamp (UTC) | Scenario ID | Event Name in DebugView | Event Count | `submission_id` (First 8 chars) | `form_id` | `lead_type` | `attribution_status` | Zero PII Confirmed? | Tester Initials |
|---|---|---|---|---|---|---|---|---|---|
| `____-__-__ __:__` | `baseline (valid)` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `baseline (invalid)` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-1` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-2` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-3` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-4` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-5` | | | | | | | [ ] Yes / [ ] No | |
| `____-__-__ __:__` | `defect-6` | | | | | | | [ ] Yes / [ ] No | |

---

## 7. Troubleshooting DebugView Connection

1. **No Devices Listed in Debug Device Dropdown**:
   - Check that the Google Tag Configuration has `debug_mode: true`.
   - Verify that your browser ad blocker or brave shields are disabled for `http://localhost:3000`.
   - Refresh the Next.js app while Google Tag Assistant is connected.
2. **Events Appear in GTM Preview but Not in GA4**:
   - Confirm that `const - ga4_measurement_id` in GTM matches your GA4 Data Stream Measurement ID exactly.
   - Verify that your local network allows outbound HTTPS requests to `*.google-analytics.com`.
   - **Check Consent Status**: If analytics consent is in default denied state, GA4 hit collection is blocked or restricted. Click **"Accept All Cookies"** on the consent banner in `http://localhost:3000`.
3. **Parameters Missing in DebugView Detail Panel**:
   - Click the event circle in the seconds stream and wait 2 seconds for parameter hydration.
   - Verify that DataLayer Variables in GTM match the exact property names in `window.dataLayer`.
