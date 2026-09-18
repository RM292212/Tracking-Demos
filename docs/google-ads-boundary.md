# Google Ads Conversion Tracking Boundary & Audit Methodology

This document explains why Google Ads conversion tracking is strictly **conceptual-only** in the ResponseLock Lead & Conversion Integrity Demo Workspace, and details how a ResponseLock Lead & Conversion Integrity Auditor audits Google Ads conversion configurations during a live $350 fixed-scope audit.

---

## 1. The Boundary: Why Google Ads is Conceptual-Only in Local Training

In this local demonstration and training workspace, Google Ads conversion tracking is explicitly marked as **`Not tested in Google Ads`** across all scenarios.

### Three Primary Architectural & Safety Reasons:

1. **Safety Rules (Zero External Network Egress & No Real Spend)**:
   - Fictional data only: The demo creates synthetic leads with fictional names and emails (`demo.user@example.com`).
   - Ad account safety: Sending simulated test leads or fake GCLIDs (`DEMO-GCLID-001`) into a live production Google Ads account risks triggering automated account suspensions for invalid traffic, policy violations, or spoofed conversion uploads.
   - Zero egress: The simulated CRM and local application operate entirely within localhost.
2. **Deterministic Root-Cause Hierarchy**:
   - The marketing conversion chain flows linearly:
     ```
     Ad Click (GCLID/UTM) 
       → Landing Page 
         → Attribution Capture 
           → Form Validation 
             → Confirmed API Receipt 
               → dataLayer Event 
                 → GTM Trigger 
                   → GA4 Key Event 
                     → Google Ads Conversion Action
     ```
   - If the chain breaks upstream (e.g. at the form, dataLayer, GTM, or attribution storage), Google Ads will **never** receive the conversion or will receive corrupted data, regardless of how Google Ads is configured.
   - Proving the integrity of upstream layers (dataLayer and GTM) is 90% of the conversion auditor's technical investigation.
3. **No Live Account Requirement for Training**:
   - Agency students learning the ResponseLock methodology can master detection of all six critical defects without needing access to a funded, active Google Ads account.

---

## 2. The Real-World Google Ads Conversion Pipeline

In production client environments, conversions reach Google Ads through one of two technical paths:

```
[User Submits Form]
       │
       ▼
[dataLayer.push({ event: 'demo_lead_success', ... })]
       │
       ├───────────────────────────────────────────────────────┐
       ▼                                                       ▼
[Path A: GA4 Import]                                 [Path B: Direct GTM Tag]
       │                                                       │
  GTM GA4 Event Tag                                  GTM Conversion Linker Tag
       │                                                       │
  GA4 Key Event Recorded                             GTM Google Ads Conversion Tag
       │                                               (Conversion ID + Label)
  GA4 ↔ Google Ads Account Link                                │
       │                                                       │
  Imported into Google Ads Conversions                         ▼
       │                                            [Google Ads Ad Engine]
       └───────────────────────────────────────────────────────┘
```

### Path A: GA4 Key Event Import (Most Common in Modern Agencies)
1. Event `demo_lead_success` is sent to GA4 via GTM.
2. Inside GA4 (**Admin** > **Data display** > **Events**), the event is marked as a **Key Event**.
3. Google Ads is linked to GA4 (**Tools and settings** > **Linked accounts** > **Google Analytics (GA4)**).
4. In Google Ads (**Goals** > **Conversions** > **Summary**), the auditor clicks **New conversion action** > **Import** > **Google Analytics 4 properties (Web)**.

### Path B: Direct Google Ads Conversion Tracking via GTM
1. GTM deploys a **Conversion Linker** tag on *All Pages* to capture GCLID/WBRAID/GBRAID parameters into first-party cookies (`_gcl_aw`).
2. GTM deploys a **Google Ads Conversion Tracking** tag fired by the Custom Event `demo_lead_success`, specifying the Google Ads `Conversion ID` and alphanumeric `Conversion Label`.

---

## 3. How a ResponseLock Auditor Audits Google Ads Settings (Without Live Clicks)

In the $350 ResponseLock Lead & Conversion Integrity Audit, the auditor inspects client Google Ads conversion actions directly in read-only mode (`access/access-and-authorization-checklist.md`).

Auditors verify the following critical settings:

| Setting | Recommended Value for Lead Gen | Common Client Defect / Risk | Audit Impact |
|---|---|---|---|
| **Action Goal** | `Submit lead form` | Set to generic `Page view` or `Sign-up` | Misleads Smart Bidding algorithms on conversion intent. |
| **Action Optimization** | **Primary** (for true leads), **Secondary** (for micro-conversions) | Set to *Primary* on page views or button clicks | Smart Bidding optimizes for clicks rather than qualified form completions. |
| **Counting Method** | **One conversion** | Set to **Every conversion** | If a user refreshes or Defect 2 fires twice, Google Ads counts 2 conversions, artificially depressing reported CPA by 50%. |
| **Click-Through Window** | 30 to 90 days (aligned with sales cycle) | Default 30 days when sales cycle is 60+ days | Leads closing after day 30 are attributed to organic/direct, blinding paid search optimization. |
| **Attribution Model** | **Data-driven attribution (DDA)** | Outdated *First Click* or *Last Click* | Ignores upper-funnel search and display keywords that initiated research. |
| **Enhanced Conversions** | Enabled with strict hashing & consent compliance | Enabled without consent or using unhashed plain-text | Compliance violation under GDPR/CCPA, or data quality degradation. |

---

## 4. Enhanced Conversions & the ResponseLock Zero-PII Invariant

### What is Enhanced Conversions?
Enhanced Conversions for Web allows advertisers to send first-party customer data (email addresses, phone numbers, postal addresses) captured from form submissions to Google. The data must be normalized (trimmed, lowercased) and hashed using **SHA-256** before dispatch, or collected via Google's client-side user-provided data capabilities.

### Why ResponseLock Strictly Prohibits PII in Analytics DataLayers:
1. **Accidental PII Leakage**: Many developers mistakenly push raw, unhashed email addresses and names into `window.dataLayer`. In standard GA4 tags, custom parameters containing raw email addresses violate Google's Terms of Service and risk account termination.
2. **Audit Rule**: The ResponseLock demo strictly enforces the **Approved Analytics Payload Keys** whitelist:
   ```typescript
   ['event', 'form_id', 'lead_type', 'scenario', 'submission_id', 'attribution_status', 'debug_mode']
   ```
3. **Enhanced Conversions Verification in Real Audits**:
   - When auditing an agency client claiming to use Enhanced Conversions, the auditor verifies whether hashing occurs client-side or server-side.
   - If client-side GTM variables are used, the auditor verifies that the regex/transformation accurately scrubs non-alphanumeric characters from phone numbers and trims whitespace from emails prior to SHA-256 hashing.

---

## 5. Epistemic Classification in Audit Reports

ResponseLock enforces strict evidence labeling throughout all documentation and audit deliverables:

| Verification Layer | Label Meaning | Demo Status |
|---|---|---|
| **Confirmed Locally** | Fully tested and asserted in unit tests, Playwright E2E, and local CRM logs. | Supported across all 7 scenarios. |
| **Requires GTM Preview** | Verified by running Google Tag Assistant connected to localhost. | Supported when GTM container ID is configured. |
| **Requires GA4 DebugView** | Verified in real-time GA4 DebugView with `debug_mode: true`. | Supported when GA4 measurement ID is configured. |
| **Not tested in Google Ads** | Untested in live Google Ads due to zero-egress and safety boundaries. | Permanent boundary for all demo scenarios. |
