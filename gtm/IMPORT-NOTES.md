# Google Tag Manager Container Import Notes

This document provides technical instructions, architectural notes, and caveats for importing `gtm/responselock-demo-container.json` into a Google Tag Manager (GTM) Web container.

---

## 1. Overview of the Export Artifact

The file `gtm/responselock-demo-container.json` is a standard Google Tag Manager Version 2 export JSON file configured specifically for the ResponseLock Conversion Integrity Demo.

### Pre-Configured Assets

| Type | Asset Name | Description |
|---|---|---|
| **Tag** | `Google Tag - GA4 Configuration` | Initializes the Google Tag with `debug_mode: true` on all pages. |
| **Tag** | `GA4 Event - demo_lead_success` | Dispatches the GA4 conversion event when `demo_lead_success` is pushed. |
| **Trigger** | `CE - demo_lead_success` | Custom Event trigger that matches event name `demo_lead_success`. |
| **Trigger** | `All Pages` | Standard Pageview trigger for Google Tag initialization. |
| **Variable** | `const - ga4_measurement_id` | Constant variable holding the GA4 Measurement ID (default dummy: `G-DEMO000001`). |
| **Variable** | `dlv - submission_id` | DataLayer Variable (Version 2) reading `submission_id`. |
| **Variable** | `dlv - form_id` | DataLayer Variable (Version 2) reading `form_id`. |
| **Variable** | `dlv - lead_type` | DataLayer Variable (Version 2) reading `lead_type`. |
| **Variable** | `dlv - scenario` | DataLayer Variable (Version 2) reading `scenario`. |
| **Variable** | `dlv - attribution_status` | DataLayer Variable (Version 2) reading `attribution_status`. |

---

## 2. Import Walkthrough

### Step 1: Access GTM Container Admin
1. Open [tagmanager.google.com](https://tagmanager.google.com/).
2. Select your dedicated non-production container (or create a new Web container as instructed in `docs/gtm-setup.md`).
3. Click the **Admin** tab in the top navigation bar.
4. Under the **Container** column (right side), select **Import Container**.

### Step 2: Select the JSON File
1. Click **Choose container file**.
2. Select `gtm/responselock-demo-container.json` from this repository.

### Step 3: Choose Destination Workspace
1. Choose **Existing** workspace (typically `Default Workspace`), or click **New** to create an isolated workspace named `ResponseLock Demo`.

### Step 4: Choose Merge vs. Overwrite Option

You must select an import resolution strategy:

#### Option A: Overwrite (Use with Caution)
- **When to choose**: Only when setting up a brand-new, completely empty test container where no other tags exist.
- **Behavior**: Deletes all existing tags, triggers, and variables in the workspace and replaces them entirely with the contents of this JSON file.

#### Option B: Merge (Recommended for Existing Workspaces)
- **When to choose**: When your container already contains other tags or when working in a shared development workspace.
- **Sub-option 1: Overwrite conflicting tags, triggers, and variables**:
  - Replaces any tag, trigger, or variable that shares an exact name with an incoming item.
  - *Recommended when updating or re-importing the ResponseLock container.*
- **Sub-option 2: Rename conflicting tags, triggers, and variables**:
  - Appends a number or suffix to conflicting names to prevent overwriting existing assets.
  - *Caution*: May lead to duplicate tag firings if old tags remain active.

### Step 5: Review the Import Summary
1. Review the preview table showing **Tags to Add/Modify**, **Triggers to Add/Modify**, and **Variables to Add/Modify**.
2. Confirm there are **0 deleted items** (if using Merge) and that the 2 tags, 2 triggers, and 6 variables are listed.
3. Click **Confirm** to complete the import.

---

## 3. Post-Import Configuration & Environment Alignment

### 3.1 Update the GA4 Measurement ID Variable
The imported container specifies a dummy Measurement ID:
```
const - ga4_measurement_id = G-DEMO000001
```

If you are validating events in a real non-production GA4 property:
1. In GTM, navigate to **Variables** > **User-Defined Variables**.
2. Click `const - ga4_measurement_id`.
3. Change the Value to your actual non-production GA4 Measurement ID (for example, the value matching `NEXT_PUBLIC_GA4_MEASUREMENT_ID` in `demo/.env.local`).
4. Click **Save**.

### 3.2 Verify Next.js Environment Variables
Ensure your `demo/.env.local` file contains the corresponding GTM container ID:
```bash
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```
*Note: If testing without a live GTM container, the application operates cleanly in simulated mode without throwing errors.*

---

## 4. Verification in GTM Preview & Tag Assistant

1. In GTM, click **Preview** in the top right header.
2. In the Google Tag Assistant window (`tagassistant.google.com`), enter your local application URL:
   ```
   http://localhost:3000
   ```
3. Ensure the checkbox **Include debug signal in URL** is enabled.
4. Click **Connect**.
5. The local application opens in a new tab, and Tag Assistant confirms the connection with a green badge.
6. When testing `/scenario/baseline`, submit a valid form:
   - In Tag Assistant's left event timeline, locate the `demo_lead_success` event.
   - Click the event and verify that `GA4 Event - demo_lead_success` fired exactly once.
   - Click the tag to inspect the 5 passed parameters (`submission_id`, `form_id`, `lead_type`, `scenario`, `attribution_status`) and confirm values populated from DataLayer.

---

## 5. Security and Integrity Reminders

- **Strictly Non-Production**: Never import this demo container into an active production container.
- **Zero Real PII**: The variables and tags are configured strictly for non-PII operational identifiers. Never modify the tags to capture names, emails, phones, or form input values.
- **Controlled Egress**: In this local training workspace, all analytics tags point to dedicated test IDs or remain in simulated local mode.
