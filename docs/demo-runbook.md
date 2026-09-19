# ResponseLock Demo Runbook: Step-by-Step Operator Guide

**Audience**: New developers, QA engineers, agency auditors, and demonstration operators.  
**Tested Environment**: Windows 11, PowerShell 5.1, Node.js v24.18.0 (LTS), npm 11.16.0.  
**Workspace Location**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit.  

---

## 1. Quick Start (TL;DR)

If your environment is already set up and dependencies are installed, you can start the application immediately:

```bash
# 1. Navigate to the demo directory
cd demo

# 2. Start the local development server
npm run dev

# 3. Open your browser
# Navigate to http://localhost:3000
```

To run the complete automated test suite and verification checks:

```bash
# Run the full 7-stage verification pipeline
npm run verify
```

---

## 2. System Prerequisites & Environment Verification

Before running the application, verify your host machine matches the required specifications:

### 2.1 Check Node.js and npm Versions
Open PowerShell 5.1 and run:

```powershell
node -v
# Expected: v24.18.0 (or v24.x LTS)

npm -v
# Expected: 11.16.0 (or 11.x)

git --version
# Expected: git version 2.55.0 or later
```

### 2.2 Verify Port Availability
The Next.js application binds to port 3000 by default. Check that port 3000 is not occupied:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```
If no output is returned, port 3000 is free. If a process is listening, terminate it or stop the conflicting service before proceeding.

---

## 3. Fresh Installation & Setup

### 3.1 Clone or Navigate to Workspace Root
Ensure you are at the workspace root directory:

```powershell
cd C:\Users\Ranji\code-base\RL-Demo
```

### 3.2 Install Dependencies
Install all required dependencies using npm 11.16.0:

```bash
# Install root and workspace dependencies
npm install
```

This installs all dependencies strictly defined in the project specification: Next.js (App Router), React 19, TypeScript, Zod, Vitest, Playwright, and `@axe-core/playwright`.

### 3.3 Configure Local Environment Variables
Copy the example environment file to `.env.local` inside the `demo/` directory:

```powershell
Copy-Item demo\.env.example demo\.env.local
```

Inspect `demo/.env.local`:
```ini
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-KRH5W5MX
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-GQBPF316M0
```

> **Note on Safety**: These are dedicated non-production test identifiers. The application operates safely even if these variables are empty or omitted (the UI will indicate that GTM/GA4 is unconfigured, while all local simulations remain 100% functional).

---

## 4. Running the Application

### 4.1 Start the Development Server
From the workspace root or the `demo/` directory:

```bash
# Option A: Run directly from demo/
cd demo
npm run dev

# Option B: Run from workspace root
npm run dev
```

The Next.js App Router server starts on `http://localhost:3000`. You will see output similar to:
```
  ▲ Next.js 15.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local
 ✓ Starting...
 ✓ Ready in 1.4s
```

Open `http://localhost:3000` in Google Chrome or Microsoft Edge.

---

## 5. Guided Walkthrough: Scenarios & Defect Demonstrations

The application includes 10 primary routes accessible via the navigation header.

### 5.1 Route 1: Home & Dashboard (`/`)
- **Purpose**: System overview, scenario status matrix, and architectural links.
- **Verification**: Check that all 7 scenarios (Baseline + 6 defects) are listed with links and expected behavior summaries.

### 5.2 Route 2: Baseline Valid & Invalid Submissions (`/scenario/baseline`)
- **Route**: `http://localhost:3000/scenario/baseline`
- **What it Proves**: The correct, intact 12-step conversion chain.
- **Step-by-Step Test 1 (Invalid Rejection)**:
  1. Click the "Submit Request" button without filling out the form.
  2. **Expected Result**:
     - Client validation fails immediately.
     - Inline red error messages appear below required fields.
     - The Observability panel records `validation: Form validation failed`.
     - Exactly **zero** network requests are sent to `/api/leads`.
     - Exactly **zero** records are added to the CRM.
     - Exactly **zero** events are pushed to `window.dataLayer`.
- **Step-by-Step Test 2 (Valid Submission)**:
  1. Fill out the fictional form fields:
     - Full Name: `Demo User`
     - Work Email: `demo.user@example.com`
     - Company: `Example Media Group`
     - Monthly Ad Spend: `$10,000 - $50,000`
     - Primary Challenge: `Tracking discrepancies between GTM and CRM`
  2. Click "Submit Request".
  3. **Expected Result**:
     - Client validation passes.
     - Submit button disables and indicates submission in flight.
     - POST `/api/leads` is sent with `Idempotency-Key` equal to the generated `submission_id`.
     - Server sleeps 420ms (deterministic latency) and returns `201 Created`.
     - Success banner renders from server response.
     - Exactly **one** `demo_lead_success` event is pushed to `window.dataLayer`.
     - Exactly **one** row is written to the local CRM (`demo/data/crm-records.jsonl`).

### 5.3 Route 3: Defect 1 — False Conversion on Invalid Submission (`http://localhost:3000/scenario/defect-1`)
- **Real-World Analogue**: A GTM trigger configured on "Click - All Elements" matching the submit button CSS selector, rather than listening for successful form completion.
- **Step-by-Step Test**:
  1. Navigate to `http://localhost:3000/scenario/defect-1`.
  2. Leave all fields completely blank.
  3. Click "Submit Request".
  4. **Expected Result**:
     - The click listener fires immediately on button press, pushing `demo_lead_success` (`scenario: 'defect-1'`) to `window.dataLayer`.
     - Form validation executes afterward and fails, displaying validation errors.
     - No network request is made to `/api/leads`.
     - No row is written to the CRM.
     - **Result**: **1 false conversion event in dataLayer, 0 CRM leads**. Ad algorithms would optimize toward users who click submit without filling the form!

### 5.4 Route 4: Defect 2 — Duplicate Conversion Push (`http://localhost:3000/scenario/defect-2`)
- **Real-World Analogue**: A legacy agency script remaining active on the site alongside a new tag manager trigger, causing double reporting.
- **Step-by-Step Test**:
  1. Navigate to `http://localhost:3000/scenario/defect-2`.
  2. Complete the form with valid fictional details (`demo.user@example.com`, etc.).
  3. Click "Submit Request".
  4. **Expected Result**:
     - Legacy click listener pushes `demo_lead_success` on click.
     - Post-submission handler pushes `demo_lead_success` again on 201 Created.
     - Both events share the identical `submission_id`.
     - The server's `Idempotency-Key` deduplication ensures only **1 CRM row** is created.
     - **Result**: **2 conversion events in dataLayer for 1 CRM lead**, cutting reported CPA in half!

### 5.5 Route 5: Defect 3 — Missing Conversion Due to Typo (`http://localhost:3000/scenario/defect-3`)
- **Real-World Analogue**: A developer refactoring code introduces a typo in the event name (`demo_lead_sucess`), while GTM listens for `demo_lead_success`.
- **Step-by-Step Test**:
  1. Navigate to `http://localhost:3000/scenario/defect-3`.
  2. Complete the form and submit.
  3. **Expected Result**:
     - Form submits successfully (201 Created) and 1 CRM record is created.
     - An event is pushed to `window.dataLayer`, but the event name is `'demo_lead_sucess'`.
     - GTM triggers never fire because they listen for `'demo_lead_success'`.
     - **Result**: **0 conversions tracked in analytics despite 1 genuine paying lead in CRM**.

### 5.6 Route 6: Defect 4 — Bad / Missing Event Parameters (`http://localhost:3000/scenario/defect-4`)
- **Real-World Analogue**: Front-end dataLayer schema drift where field names are altered during a site update, dropping conversion value or lead type.
- **Step-by-Step Test**:
  1. Navigate to `http://localhost:3000/scenario/defect-4`.
  2. Complete the form and submit.
  3. **Expected Result**:
     - Event fires, but `form_id` resolves to `undefined` (dropped from payload) and `lead_type` defaults to `'contact'` instead of `'agency_audit_inquiry'`.
     - The Observability panel displays a side-by-side diff comparing the expected schema against the actual schema.

### 5.7 Route 7: Defect 5 — UTM & GCLID Attribution Loss on SPA Route Navigation (`http://localhost:3000/scenario/defect-5`)
- **Real-World Analogue**: A multi-step form built with a client-side router that pushes a new path without preserving the original URL query parameters, reading from `window.location.search` at submission.
- **Step-by-Step Test**:
  1. Navigate to:  
     `http://localhost:3000/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001`
  2. Observe Step 1: Initial query parameters are detected and displayed.
  3. Click "Next Step" to trigger client-side navigation.
  4. Notice the browser URL updates to the step route without query parameters.
  5. Fill in Step 2 and click "Submit Request".
  6. **Expected Result**:
     - The handler reads `window.location.search` at submit time instead of reading from persisted storage.
     - The payload contains `attribution_status: 'dropped'`.
     - The CRM record stores `lead_source: 'direct'` and empty GCLID.
     - **Result**: Paid ad spend is misattributed as direct traffic.

### 5.8 Route 8: Defect 6 — Incomplete / Mismapped CRM Record (`http://localhost:3000/scenario/defect-6`)
- **Real-World Analogue**: An incorrect server-side webhook mapper or CRM integration mapping source fields into the wrong CRM properties.
- **Step-by-Step Test**:
  1. Navigate to `http://localhost:3000/scenario/defect-6`.
  2. Submit a valid lead with UTM parameters.
  3. Navigate to `http://localhost:3000/crm`.
  4. **Expected Result**:
     - `campaign_name` is completely missing (dropped).
     - `utm_source` was placed into `lead_source_detail`, while `lead_source` remains empty.
     - The CRM table highlights the row as **Mismapped** with missing fields.

### 5.9 Route 9: Simulated CRM Viewer (`/crm`)
- **Route**: `http://localhost:3000/crm`
- **Features**:
  - 10-column table listing all stored leads: Submission ID, Scenario, Contact Values, Timestamp, Lead Source, Source Detail, Campaign, GCLID, Mapping Status, and Intentionally Missing Fields.
  - Permanent disclaimer banner: *This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records.*
  - Quick access to inspect raw JSONL records.

### 5.10 Route 10: Evidence Hub (`/evidence`)
- **Route**: `http://localhost:3000/evidence`
- **Features**: Overview of finding packages for Baseline and Defects 1 through 6, with prefilled markdown audit findings and reproduction steps.

---

## 6. Observability Panel & Test Conditions

Every scenario page features two interactive diagnostic drawers:

### 6.1 Observability Timeline Panel
- Displays chronological events across 9 categories: `lifecycle`, `validation`, `network`, `analytics`, `storage`, `crm`, `attribution`, `consent`, and `defect`.
- PII is automatically redacted before display.
- **Actions**:
  - **Copy Evidence**: Copies a sanitized markdown table of recent events to your clipboard.
  - **Download Manifest**: Downloads `sanitized-evidence-manifest.json` for inclusion in audit reports.

### 6.2 Test Conditions Panel
Allows simulating real-world edge cases without modifying source code:
- **Ad Blocker Simulation**: Simulates an ad blocker preventing GTM snippet execution.
- **API 500 Error**: Forces `/api/leads` to return `500 Internal Server Error`.
- **API Timeout**: Induces a client-side request timeout.
- **Network Throttle (2s)**: Adds a 2-second delay to test submit button disabled states and loading spinners.
- **Consent Mode v2 Toggle**: Allows toggling consent between granted and denied.

---

## 7. Resetting Data

To clear all simulated CRM records and start fresh:

### Method 1: Via the UI
Navigate to `/crm` and click the red **Reset CRM Store** button.

### Method 2: Via PowerShell / cURL
Send a POST request to the dev-guarded reset endpoint:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/dev/reset"
```

> **Security Note**: This endpoint is guarded by `process.env.NODE_ENV !== 'production'`. In production builds, it returns `403 Forbidden`.

---

## 8. Automated Verification & Testing Commands

To run individual quality checks or the full suite:

```bash
# Run ESLint code quality checks
npm run lint

# Run TypeScript typecheck across all modules
npm run typecheck

# Run Vitest unit tests (contracts, schemas, mappers, store mutex)
npm run test:unit

# Run Playwright end-to-end tests (Chromium headless)
npm run test:e2e

# Run security & PII scanner
npm run scan:pii

# Validate all documentation shell commands
npm run check:docs

# Generate canonical verification matrix
npm run emit:matrix

# Run complete 7-stage verification pipeline
npm run verify
```

### 8.1 Production Build & Test
Verify that the application compiles cleanly into a production build:

```bash
# Compile production bundle
npm run build

# Start production server
npm run start
```

---

## 9. The $350 Audit Service Context

When presenting this workspace to agency clients or trainees, emphasize the commercial context:
- **Service Name**: ResponseLock Lead & Conversion Integrity Audit.
- **Fixed Price**: Exactly **$350** (never varied or discounted).
- **Turnaround**: 5 business days.
- **Core Lesson**: *A form that works does not mean conversion data is trustworthy.*
