# Google Tag Manager Manual Configuration Steps (Authoritative Fallback Guide)

This document provides the authoritative, click-by-click manual instructions for configuring Google Tag Manager (GTM) for the ResponseLock Conversion Integrity Demo Workspace without importing the JSON container export.

---

## 1. Prerequisites & Overview

If your organizational security policies or GTM workspace permissions prevent importing `gtm/responselock-demo-container.json`, follow these exact steps to configure the container manually.

### Configuration Inventory

1. **6 User-Defined Variables**:
   - 1 Constant variable (`const - ga4_measurement_id`)
   - 5 DataLayer Variables (`submission_id`, `form_id`, `lead_type`, `scenario`, `attribution_status`)
2. **1 Custom Event Trigger**:
   - `CE - demo_lead_success`
3. **2 Tags**:
   - `Google Tag - GA4 Configuration` (Base initialization)
   - `GA4 Event - demo_lead_success` (Conversion event with parameter mapping)

---

## 2. Step 1: Create User-Defined Variables

In Google Tag Manager, open your workspace and click **Variables** in the left sidebar. Scroll down to the **User-Defined Variables** section.

### Variable 1: Measurement ID Constant
1. Click **New** in the User-Defined Variables pane.
2. Click the **Variable Configuration** box.
3. Select variable type: **Constant** (under *Utilities*).
4. In the **Value** field, enter your non-production GA4 measurement ID (e.g. `G-DEMO000001` or your actual sandbox ID).
5. Name the variable: `const - ga4_measurement_id`.
6. Click **Save**.

### Variable 2: DataLayer Variable - `submission_id`
1. Click **New**.
2. Click **Variable Configuration** and select **Data Layer Variable** (under *Page Variables*).
3. Set **Data Layer Variable Name**: `submission_id` (case-sensitive, exact match).
4. Set **Data Layer Version**: `Version 2`.
5. Leave *Set Default Value* unchecked.
6. Name the variable: `dlv - submission_id`.
7. Click **Save**.

### Variable 3: DataLayer Variable - `form_id`
1. Click **New**.
2. Select **Data Layer Variable**.
3. Set **Data Layer Variable Name**: `form_id`.
4. Set **Data Layer Version**: `Version 2`.
5. Name the variable: `dlv - form_id`.
6. Click **Save**.

### Variable 4: DataLayer Variable - `lead_type`
1. Click **New**.
2. Select **Data Layer Variable**.
3. Set **Data Layer Variable Name**: `lead_type`.
4. Set **Data Layer Version**: `Version 2`.
5. Name the variable: `dlv - lead_type`.
6. Click **Save**.

### Variable 5: DataLayer Variable - `scenario`
1. Click **New**.
2. Select **Data Layer Variable**.
3. Set **Data Layer Variable Name**: `scenario`.
4. Set **Data Layer Version**: `Version 2`.
5. Name the variable: `dlv - scenario`.
6. Click **Save**.

### Variable 6: DataLayer Variable - `attribution_status`
1. Click **New**.
2. Select **Data Layer Variable**.
3. Set **Data Layer Variable Name**: `attribution_status`.
4. Set **Data Layer Version**: `Version 2`.
5. Name the variable: `dlv - attribution_status`.
6. Click **Save**.

---

## 3. Step 2: Create Custom Event Trigger

In the left sidebar, click **Triggers**.

1. Click **New**.
2. Click the **Trigger Configuration** box.
3. Under *Other*, select **Custom Event**.
4. Set **Event name**: `demo_lead_success`  
   *(Crucial: Must match exactly. A typo here, such as `demo_lead_sucess`, replicates Defect 3 where conversions are dropped).*
5. Set **This trigger fires on**: **All Custom Events**.
6. Name the trigger: `CE - demo_lead_success`.
7. Click **Save**.

---

## 4. Step 3: Create Google Tag (GA4 Base Configuration)

In the left sidebar, click **Tags**.

1. Click **New**.
2. Click **Tag Configuration**.
3. Select **Google Tag** (or **Google Analytics: GA4 Configuration** in older interfaces).
4. In **Tag ID**, click the brick icon (`+`) and select `{{const - ga4_measurement_id}}` (or type `{{const - ga4_measurement_id}}`).
5. Expand **Configuration settings** (or *Configuration Settings Table*):
   - Click **Add parameter**.
   - Set **Configuration parameter**: `debug_mode`.
   - Set **Value**: `true`.
6. Click the **Triggering** box below.
7. Select **Initialization - All Pages** (or **All Pages**).
8. Name the tag: `Google Tag - GA4 Configuration`.
9. Click **Save**.

---

## 5. Step 4: Create GA4 Event Tag (`demo_lead_success`)

In the left sidebar, click **Tags**.

1. Click **New**.
2. Click **Tag Configuration**.
3. Select **Google Analytics: GA4 Event**.
4. In **Measurement ID**, click the brick icon and select `{{const - ga4_measurement_id}}`.
5. In **Event Name**, enter: `demo_lead_success`.
6. Expand **Event Parameters**:
   - Click **Add row** 6 times to configure the parameter mapping:

| Parameter Name | Value | Description |
|---|---|---|
| `submission_id` | `{{dlv - submission_id}}` | Unique submission identifier (UUID v4) |
| `form_id` | `{{dlv - form_id}}` | Form identifier (`lead_audit_demo`) |
| `lead_type` | `{{dlv - lead_type}}` | Lead category (`agency_audit_inquiry`) |
| `scenario` | `{{dlv - scenario}}` | Scenario identifier (`baseline`, `defect-1`, etc.) |
| `attribution_status` | `{{dlv - attribution_status}}` | Status (`present`, `partial`, `missing`, `dropped`) |
| `debug_mode` | `true` | Forces instant visibility in GA4 DebugView |

7. Click the **Triggering** box below.
8. Select the trigger created in Step 2: `CE - demo_lead_success`.
9. Name the tag: `GA4 Event - demo_lead_success`.
10. Click **Save**.

---

## 6. Step 5: Verification in GTM Tag Assistant Preview

1. Ensure the demo application is running locally:
   ```bash
   npm run dev
   ```
2. In GTM, click **Preview** in the top right.
3. Enter `http://localhost:3000` in the Tag Assistant prompt and click **Connect**.
4. Navigate to `/scenario/baseline` and submit a valid test lead:
   - Check Tag Assistant:
     - On container load: `Google Tag - GA4 Configuration` status is **Succeeded**.
     - On form submission: An event numbered e.g. `14 demo_lead_success` appears in the left panel.
     - Select `demo_lead_success`: Tag `GA4 Event - demo_lead_success` status shows **Fired 1 time(s)**.
5. Click the fired `GA4 Event - demo_lead_success` tag to inspect **Event Parameters**:
   - Verify that each parameter resolved to its expected DataLayer value and none evaluated to `undefined` or `null`.

---

## 7. Educational Analogues: How GTM Setup Flaws Map to Real Defects

| Mistake in GTM Setup | Resulting Defect in Production | ResponseLock Scenario Analogue |
|---|---|---|
| Trigger set to "Click - All Elements" on button rather than Custom Event | Tag fires on invalid form click before validation runs | **Defect 1** (`/scenario/defect-1`) |
| Two tags both listening to the same event or button click | Double conversion counts in ad platform | **Defect 2** (`/scenario/defect-2`) |
| Typo in Trigger Event Name (e.g. `demo_lead_sucess`) | Tag never fires; zero conversions recorded | **Defect 3** (`/scenario/defect-3`) |
| Misspelled DLV parameter name (e.g. `formId` instead of `form_id`) | Parameter passed as undefined; missing dimensions | **Defect 4** (`/scenario/defect-4`) |
