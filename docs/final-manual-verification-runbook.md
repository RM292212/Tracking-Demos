# ResponseLock Final Manual Verification Runbook

**Document Purpose**: Canonical, single-source manual verification runbook for the ResponseLock Lead & Conversion Integrity Demo workspace.  
**Target Environment**: Windows 11, Node.js v24.18.0, npm 11.16.0, Chromium browser.  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Dedicated Test Identifiers**: GTM Container: `GTM-KRH5W5MX` | GA4 Property: `G-GQBPF316M0`  

---

## Part A: Local Preflight & Environment Preparation

### 1. Working Directory
All commands must be executed from the workspace root:
```powershell
Set-Location "C:\Users\Ranji\code-base\RL-Demo"
```

### 2. Verify Local Code Quality & Automated Tests
Execute the local verification pipeline before touching manual systems:
```powershell
npm run verify
```
*Expected Result*: 8 green checkmarks (typecheck, lint, 135 unit tests, 32 E2E tests, build, scan:pii, check:docs).

### 3. Start Development Server
```powershell
npm run dev
```
*Expected Result*: Next.js starts on `http://localhost:3000`.

### 4. Reset Local CRM & Storage State
In a separate PowerShell terminal, reset the local simulated database:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/dev/reset"
```
Or navigate in your browser to `http://localhost:3000/crm` and click **"Reset Demo CRM Database"**.

---

## Part B: Safe GTM Container Import & Workspace Review

> [!IMPORTANT]
> **Safe Import Workflow Principles**:
> 1. Confirm the container is a **dedicated non-production test container** (`GTM-KRH5W5MX`). Never import into a production client container.
> 2. Create an isolated workspace named `ResponseLock Demo Validation`. Never import into `Default Workspace`.
> 3. **Preview BEFORE publishing**. Never publish imported tags before testing them in Google Tag Assistant.

### Step-by-Step GTM Import
1. Navigate to [Google Tag Manager](https://tagmanager.google.com/) and open test container `GTM-KRH5W5MX`.
2. Navigate to **Admin > Import Container**.
3. Select file: `C:\Users\Ranji\code-base\RL-Demo\gtm\responselock-demo-container.json`.
4. Choose destination workspace: Click **New** and name it `ResponseLock Demo Validation`.
5. Select import option: **Overwrite conflicting tags, triggers, and variables**.
6. Review the import summary:
   - 2 Tags: `Google Tag - GA4 Configuration` and `GA4 Event - demo_lead_success`
   - 1 Trigger: `CE - demo_lead_success`
   - 6 Variables: `const - ga4_measurement_id`, `dlv - submission_id`, `dlv - form_id`, `dlv - lead_type`, `dlv - scenario`, `dlv - attribution_status`
7. Click **Confirm**.
8. Inspect the variable `const - ga4_measurement_id` and ensure its value matches `G-GQBPF316M0`.
9. Click **Preview** in the top right to launch Google Tag Assistant.
10. Enter target URL: `http://localhost:3000/` and click **Connect**.

---

## Part C: Baseline Verification (Analytics Consent Accepted)

1. **Navigate to**: `http://localhost:3000/scenario/baseline?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001`
2. **Grant Consent**: Locate the Consent Mode v2 banner at the bottom of the viewport and click **"Accept All Cookies"**.
3. **Enter Fictional Lead Data**:
   - Full Name: `Morgan Vance`
   - Work Email: `morgan.vance@example.com`
   - Company Name: `Vance Growth Partners`
   - Monthly Ad Spend: `$10k-$50k`
   - Primary Challenge: `Tracking discrepancies between ad spend and CRM revenue`
4. **Click**: **"Submit Audit Request"**
5. **Expected Local Results**:
   - UI: Green confirmation card renders confirming submission UUID.
   - Browser Console: Exactly 1 `demo_lead_success` event pushed to `window.dataLayer`.
   - Local CRM (`http://localhost:3000/crm`): Exactly 1 record with `mapping_status: "valid"`.
6. **Expected GTM Tag Assistant Results**:
   - Event `demo_lead_success` appears in the left timeline.
   - Tag `GA4 Event - demo_lead_success` shows **Fired 1 times**.
7. **Expected GA4 DebugView Results**:
   - Open GA4 `G-GQBPF316M0` > Admin > DebugView.
   - Event `demo_lead_success` appears on the 60-second stream.
   - Click event and verify parameters: `form_id: lead_audit_demo`, `lead_type: agency_audit_inquiry`, `scenario: baseline`, `attribution_status: present`.
8. **Screenshots to Capture**:
   - `evidence/baseline/screenshots/01-form-ui.png`
   - `evidence/baseline/screenshots/02-network-request.png`
   - `evidence/baseline/screenshots/03-datalayer-console.png`
   - `evidence/baseline/screenshots/04-crm-record.png`
   - `evidence/baseline/screenshots/05-gtm-preview.png`

---

## Part D: Baseline Verification (Analytics Consent Denied)

1. Open a new Incognito / Private window or clear local storage.
2. Navigate to `http://localhost:3000/scenario/baseline`.
3. In the Consent Banner, click **"Decline Non-Essential"** (or observe default denial).
4. Verify dataLayer shows consent defaults: `ad_storage: 'denied'`, `analytics_storage: 'denied'`.
5. Submit a valid lead:
   - Full Name: `Taylor Reed`
   - Work Email: `taylor.reed@example.com`
   - Company: `Reed Strategy Group`
6. **Observations to Record**:
   - Local App & CRM: Form submits normally; 1 CRM record is created locally.
   - DataLayer: `demo_lead_success` is pushed to dataLayer.
   - GTM Tag Assistant: Consent tab indicates `analytics_storage` is `denied`.
   - GA4 DebugView: Check whether GA4 receives cookieless pings or drops the event completely. Do not assume behavior without inspecting DebugView.

---

## Part E: Defects 1–6 Manual Reproduction

### Defect 1: False Conversion on Invalid Submit
- **Reset**: `Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/dev/reset"`
- **URL**: `http://localhost:3000/scenario/defect-1`
- **Action**: Leave all form fields blank. Click **"Submit Audit Request"**.
- **Expected Local Result**: Red validation errors on screen; 0 network requests; 0 CRM rows in `/crm`; but **1 `demo_lead_success` event in `window.dataLayer`**.
- **Expected GTM Result**: Tag Assistant shows `GA4 Event - demo_lead_success` fired on button click.
- **Expected GA4 Result**: DebugView registers `demo_lead_success` despite zero backend lead existence.
- **Screenshots**: Save to `evidence/defect-01-invalid-submit-fire/screenshots/`.
- **Finding File**: Update `evidence/defect-01-invalid-submit-fire/finding.md`.

### Defect 2: Duplicate Conversion Snippet
- **Reset**: Reset CRM via `/crm` UI.
- **URL**: `http://localhost:3000/scenario/defect-2`
- **Action**: Fill valid form (Name: `Alex Mercer`, Email: `alex.mercer@example.com`). Click **"Submit Audit Request"** once.
- **Expected Local Result**: 1 CRM record saved (idempotency key protection); **2 identical `demo_lead_success` events in dataLayer sharing the same `submission_id`**.
- **Expected GTM Result**: Tag Assistant shows `GA4 Event - demo_lead_success` fired **2 times**.
- **Expected GA4 Result**: DebugView shows 2 events arrive in quick succession with identical `submission_id`.
- **Screenshots**: Save to `evidence/defect-02-duplicate-conversion/screenshots/`.
- **Finding File**: Update `evidence/defect-02-duplicate-conversion/finding.md`.

### Defect 3: Missing Conversion (Typo in Event Name)
- **Reset**: Reset CRM.
- **URL**: `http://localhost:3000/scenario/defect-3`
- **Action**: Fill valid form. Click submit.
- **Expected Local Result**: 1 CRM record created; dataLayer contains `demo_lead_sucess` (spelled with single 'c'); zero `demo_lead_success` events.
- **Expected GTM Result**: Custom event trigger fails to match; `GA4 Event - demo_lead_success` is listed under **Tags Not Fired**.
- **Expected GA4 Result**: DebugView receives zero key events.
- **Screenshots**: Save to `evidence/defect-03-missing-conversion/screenshots/`.
- **Finding File**: Update `evidence/defect-03-missing-conversion/finding.md`.

### Defect 4: DataLayer Schema Drift
- **Reset**: Reset CRM.
- **URL**: `http://localhost:3000/scenario/defect-4`
- **Action**: Fill valid form. Click submit.
- **Expected Local Result**: 1 CRM record created; dataLayer event has `form_id` missing/undefined, and `lead_type: "contact"` instead of `"agency_audit_inquiry"`.
- **Expected GTM Result**: Tag fires, but variable `dlv - form_id` resolves to `undefined`.
- **Expected GA4 Result**: DebugView shows `form_id = (not set)`.
- **Screenshots**: Save to `evidence/defect-04-bad-event-parameters/screenshots/`.
- **Finding File**: Update `evidence/defect-04-bad-event-parameters/finding.md`.

### Defect 5: SPA Navigation Drops Attribution
- **Reset**: Reset CRM.
- **URL**: `http://localhost:3000/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-005`
- **Action**: Step 1: Fill name and email, click **"Next Step"**. Step 2: Notice URL query string is gone. Complete Step 2 and submit.
- **Expected Local Result**: DataLayer event has `attribution_status: "dropped"`; CRM record shows `lead_source: "direct"`, `campaign_name: "none"`, `gclid: ""`.
- **Expected GTM Result**: Tag fires, but campaign attribution metadata is empty.
- **Expected GA4 Result**: Traffic attributed to Direct / None.
- **Screenshots**: Save to `evidence/defect-05-attribution-loss/screenshots/`.
- **Finding File**: Update `evidence/defect-05-attribution-loss/finding.md`.

### Defect 6: CRM Field Mapping Corruption
- **Reset**: Reset CRM.
- **URL**: `http://localhost:3000/scenario/defect-6?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-006`
- **Action**: Fill valid form with complete attribution. Submit.
- **Expected Local Result**: DataLayer event has complete, healthy attribution (`attribution_status: "present"`). However, inspecting `/crm` reveals `lead_source` is empty, `campaign_name` is empty, and `lead_source_detail` contains `"google"`.
- **Expected GTM Result**: Deceptive green checkmark: GTM tag fires cleanly.
- **Expected GA4 Result**: Deceptive green checkmark: GA4 receives event cleanly.
- **Screenshots**: Save to `evidence/defect-06-incomplete-crm-record/screenshots/`.
- **Finding File**: Update `evidence/defect-06-incomplete-crm-record/finding.md`.

---

## Part F: Evidence Finalization & Sign-Off

1. **Organize Screenshots**: Move captured PNGs to their designated directories:
   `evidence/<scenario>/screenshots/01-form-ui.png`, etc.
2. **Update Status in Finding Files**:
   Once GTM Preview and GA4 DebugView have been verified, update each `finding.md` file from `PENDING` to `PASS` or `CONFIRMED (External)`.
3. **Record Test Metadata**:
   Update `Test Date`, `Tester Name`, and `Environment` in `evidence/verification-status.md`.

---

## Part G: Client Explanation Practice Guide

For each defect, practice answering these 8 diagnostic questions without notes:

1. **What should have happened?** (The architectural contract)
2. **What actually happened?** (The observed defect)
3. **What evidence proves it?** (DataLayer payload, GTM firing log, CRM row)
4. **What was the root cause?** (Click trigger, surviving legacy listener, typo, mapper drift, routing state loss, webhook misconfiguration)
5. **Why does it matter commercially?** (False bidding feedback, inflated CPA, masked revenue, unassigned CRM leads)
6. **What cannot be concluded?** (Actual live dollar impact on Smart Bidding requires account audit)
7. **What is the safe fix?** (Post-201 firing, listener removal, constant alignment, persistent storage, mapper fix)
8. **How would the fix be verified?** (Re-testing across all 4 verification tiers)
