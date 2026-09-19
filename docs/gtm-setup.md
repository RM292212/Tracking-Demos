# Google Tag Manager Setup Guide (Non-Production Web Container)

This beginner-friendly guide walks through creating and configuring a dedicated, non-production Google Tag Manager (GTM) Web container for the ResponseLock Conversion Integrity Demo Workspace.

---

## 1. Safety & Architecture Boundary

> ### ⚠️ Strict Non-Production Warning
> **Never use a live client, agency, or production Google Tag Manager container for this demo.**  
> Always create a brand-new, isolated test container dedicated strictly to local development and training.
> - **Fictional Data Only**: All test submissions use synthetic data (`demo.user@example.com`, `+1-555-0100`).
> - **Isolated Environment**: Zero production conversion tags or live ad accounts may be linked.
> - **No Hard Dependency**: The ResponseLock demo app operates completely in simulated mode even if no GTM container ID is configured.

---

## 2. Step 1: Create a Dedicated Non-Production GTM Container

1. Open your browser and navigate to [tagmanager.google.com](https://tagmanager.google.com/).
2. Log in with your testing or sandbox Google account.
3. In the top-left account selector, click **Create Account**.
4. Fill in the **Account Setup** fields:
   - **Account Name**: `ResponseLock Demo Training`
   - **Country**: Select your primary country.
   - **Share data anonymously**: Optional (leave unchecked for sandboxes).
5. Fill in the **Container Setup** fields:
   - **Container Name**: `ResponseLock Local Web Container`
   - **Target Platform**: Select **Web** (crucial: do not choose Server, iOS, or Android).
6. Click **Create** and accept the Google Tag Manager Terms of Service Agreement.
7. A modal will appear displaying code snippets titled *"Install Google Tag Manager"*.
   - **Close this modal by clicking OK or the X**.
   - You do **NOT** need to manually copy or paste these snippets into the application code. The ResponseLock Next.js application already includes an automated, strict `<GtmScript />` component that injects the container when configured in environment variables.
8. Note your **Container ID** in the top navigation bar (formatted as `GTM-XXXXXXX`).

---

## 3. Step 2: Configure Environment Variables in the Demo App

The Next.js demo application validates the GTM container ID using strict Zod schema checking (`/^GTM-[A-Z0-9]{7,}$/`).

1. In the terminal, navigate to the `demo` directory:
   ```bash
   cd demo
   ```
2. Create your local environment file by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   *(On Windows PowerShell, you can use `Copy-Item .env.example .env.local`)*
3. Open `.env.local` in your editor and set `NEXT_PUBLIC_GTM_CONTAINER_ID`:
   ```bash
   # Dedicated non-production GTM container ID
   NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX

   # Optional dedicated non-production GA4 measurement ID
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Save the file.

---

## 4. Step 3: Import the Pre-Configured Demo Container

Rather than building tags, triggers, and variables manually from scratch, import the pre-built container export provided in this repository.

1. In Google Tag Manager, click the **Admin** tab in the top navigation bar.
2. In the right-hand **Container** column, click **Import Container**.
3. Under **Choose container file**, click the button and select:
   ```
   gtm/responselock-demo-container.json
   ```
4. Under **Choose workspace**:
   - Click **New** and name it `ResponseLock Demo Validation` (do NOT import into Default Workspace).
5. Under **Choose an import option**:
   - Select **Merge**.
   - Choose **Overwrite conflicting tags, triggers, and variables**.
6. Review the import summary:
   - **Tags added**: 2 (`Google Tag - GA4 Configuration`, `GA4 Event - demo_lead_success`)
   - **Triggers added**: 2 (`CE - demo_lead_success`, `All Pages`)
   - **Variables added**: 6 (`const - ga4_measurement_id`, and 5 DataLayer Variables)
7. Click **Confirm**.

---

## 5. Step 4: Align the GA4 Measurement ID Variable

1. In GTM, navigate to **Variables** (left sidebar).
2. Under **User-Defined Variables**, click on **`const - ga4_measurement_id`**.
3. The default value is a placeholder (`G-DEMO000001`).
4. Replace it with your dedicated non-production GA4 Measurement ID (the same value you placed in `demo/.env.local`).
5. Click **Save**.

---

## 6. Step 5: Start the Local Application & Connect Tag Assistant

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Verify in your terminal that the app is listening at `http://localhost:3000`.
3. In Google Tag Manager, click the blue **Preview** button in the upper right.
4. Google Tag Assistant (`tagassistant.google.com`) will open in a new browser tab.
5. In the **Website URL** field, input:
   ```
   http://localhost:3000
   ```
6. Click **Connect**.
7. A new window will open showing the ResponseLock demo application with a Tag Assistant debugging badge in the bottom-right corner.
8. In the Tag Assistant tab, verify that:
   - The status displays **Connected**.
   - On the left sidebar, the `Container Loaded` event appears.
   - The tag `Google Tag - GA4 Configuration` shows as fired.

---

## 7. Step 6: Testing Conversion Event Firing

1. In the application window, navigate to `http://localhost:3000/scenario/baseline`.
2. **Accept Consent Mode v2 Banner**: Click **"Accept All Cookies"** on the banner at the bottom of the page. This updates `analytics_storage` to `'granted'`, allowing GA4 event tags to fire and transmit data.
3. Fill out the fictional lead form:
   - Work Email: `demo.user@example.com`
   - Full Name: `Jane Doe`
   - Company Name: `Example Media Group`
   - Monthly Ad Spend: `$10,000 - $50,000`
   - Primary Tracking Challenge: `Attribution mismatch between GA4 and CRM`
4. Click **Submit Test Lead**.
5. Observe the results:
   - In the Next.js app: The success panel renders, and the Observability Timeline records `demo_lead_success`.
   - In Google Tag Assistant: Event `demo_lead_success` appears in the left summary pane.
   - Click the event: Confirm that `GA4 Event - demo_lead_success` fired successfully.
   - Inspect the tag parameters: Confirm all mapped parameters (`submission_id`, `form_id`, `lead_type`, `scenario`, `attribution_status`, `debug_mode`) are populated with clean, non-PII values.

---

## 8. Container Versioning & Preview-First Principle

> [!IMPORTANT]
> - **DO NOT publish the container immediately after import.**
> - Local development and training operate directly against unpublished workspace drafts using Google Tag Assistant Preview mode.
> - Publish ONLY if a permanent container version snapshot is required after full verification.

---

## 9. Next Steps & Manual Alternative

- For complete click-by-click instructions on configuring GTM tags, triggers, and variables without the JSON file, consult `docs/gtm-manual-steps.md`.
- To inspect real-time events and parameter verification in GA4, see `docs/ga4-debugview-setup.md`.
- To understand why Google Ads is bounded as conceptual-only, read `docs/google-ads-boundary.md`.
