# ResponseLock Demo Troubleshooting Guide

**Status**: AUTHORITATIVE OPERATOR REFERENCE  
**Target Systems**: Next.js 15 App Router, React 19, TypeScript, Vitest, Playwright, GTM, GA4  
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit  

---

## 1. Overview

This guide catalogs concrete failure scenarios encountered when installing, configuring, running, testing, or demonstrating the ResponseLock Conversion-Integrity Demo Workspace. Each entry provides:
- **Symptoms**: Exact error strings, status codes, and user-visible behaviors.
- **Causes**: Architectural, environment, or configuration explanation.
- **Diagnostics**: Exact inspection commands or log evaluation methods.
- **Fixes**: Step-by-step resolution steps.

---

## 2. Catalog of Error Scenarios

### Scenario 01: Port 3000 in Use (`EADDRINUSE`)
- **Symptoms**:
  - Terminal output: `Error: listen EADDRINUSE: address already in use :::3000` or `Port 3000 is already in use, using 3001 instead`.
  - Browser tests fail because Playwright expects `http://localhost:3000`.
- **Causes**: A previous `next dev` instance, another node process, or a background service is occupying port 3000.
- **Diagnostics**:
  - Run in PowerShell: `Get-NetTCPConnection -LocalPort 3000`
  - Identify the Owning Process ID (PID).
- **Fixes**:
  - Terminate the process using the PID:
    ```powershell
    Stop-Process -Id <PID> -Force
    ```
  - Alternatively, kill all running node instances:
    ```powershell
    Get-Process node | Stop-Process -Force
    ```
  - Restart the development server:
    ```bash
    npm run dev
    ```

---

### Scenario 02: Node.js Version Mismatch
- **Symptoms**:
  - Build failure or syntax errors regarding native modules: `SyntaxError: Unexpected token ...` or package engine warning.
  - Features relying on Node 24 standard library enhancements fail.
- **Causes**: Host machine is running Node.js v18 or v20 instead of the required `v24.18.0`.
- **Diagnostics**:
  - Check active version: `node -v`
- **Fixes**:
  - Switch to Node.js v24 via nvm-windows:
    ```powershell
    nvm use 24.18.0
    ```
  - Or update your PATH environment variable to point to Node v24.18.0 installation directory.

---

### Scenario 03: Missing Dependencies (`Cannot find module`)
- **Symptoms**:
  - Terminal error: `Error: Cannot find module 'next'` or `Error: Cannot find module 'zod'`.
  - `npm run dev` or `npm run build` exits immediately with code 1.
- **Causes**: Workspace dependencies were never installed or `node_modules` was deleted.
- **Diagnostics**:
  - Check if directory exists: `Test-Path demo/node_modules`
- **Fixes**:
  - Run fresh installation from workspace root:
    ```bash
    npm install
    ```

---

### Scenario 04: JSONL Store Lock Timeout
- **Symptoms**:
  - API response on `/api/leads`: `503 Service Unavailable` or `500 Internal Server Error` with JSON `{ success: false, error: "Store acquisition timeout" }`.
  - Server log: `[crm-store] Failed to acquire lock within 5000ms`.
- **Causes**: Async mutex in `src/lib/crm-store.ts` timed out waiting for a previous write operation or file handle release on `crm-records.jsonl`.
- **Diagnostics**:
  - Check for stuck file locks or runaway concurrency in tests.
  - Verify disk write permissions on `demo/data/`.
- **Fixes**:
  - Ensure `crm-store.ts` releases the mutex inside a `finally` block.
  - Verify no external text editors (e.g. Notepad, Excel) have locked `demo/data/crm-records.jsonl`.
  - Reset the store:
    ```powershell
    Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/dev/reset"
    ```

---

### Scenario 05: Invalid GTM Container ID Regex
- **Symptoms**:
  - Status indicator in app header shows `GTM: Invalid`.
  - Console warning: `[GtmScript] Invalid GTM Container ID format`.
  - GTM script is not injected into the DOM.
- **Causes**: `NEXT_PUBLIC_GTM_CONTAINER_ID` in `.env.local` does not match `/^GTM-[A-Z0-9]{7,}$/` (e.g. lowercase letters or missing `GTM-` prefix).
- **Diagnostics**:
  - Inspect `demo/.env.local`: `Get-Content demo/.env.local`
- **Fixes**:
  - Correct the value in `demo/.env.local` to uppercase matching the spec:
    ```ini
    NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-KRH5W5MX
    ```
  - Restart the development server: `npm run dev`.

---

### Scenario 06: GA4 Measurement ID Format Mismatch
- **Symptoms**:
  - Zod environment validation error on server startup: `Invalid GA4 Measurement ID format`.
  - App displays status `GA4: Invalid`.
- **Causes**: `NEXT_PUBLIC_GA4_MEASUREMENT_ID` does not start with `G-` or contains invalid characters (violating `/^G-[A-Z0-9]{8,}$/`).
- **Diagnostics**:
  - Run typecheck and env test:
    ```bash
    npm run typecheck
    npm run test:unit
    ```
- **Fixes**:
  - Set valid test measurement ID in `demo/.env.local`:
    ```ini
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-GQBPF316M0
    ```

---

### Scenario 07: Consent Mode v2 Default Denial Blocking Analytics
- **Symptoms**:
  - GTM / GA4 tags do not execute in Tag Assistant even though the container loaded.
  - Console shows `consent: default` with `analytics_storage: 'denied'`.
- **Causes**: Consent Mode v2 default denial is active by design. The user has not clicked "Accept" on the Consent Banner.
- **Diagnostics**:
  - Inspect `window.dataLayer` in DevTools: look for `consent` command with denied storage permissions.
- **Fixes**:
  - Use the actual consent UI only if present and wired for the route under test. The legacy Test Conditions panel's consent flag is diagnostic only and does not change Google consent state.
  - Verify consent commands in the data layer or Tag Assistant before drawing conclusions; do not infer consent from a panel flag.

---

### Scenario 08: Missing Playwright Chromium Browser
- **Symptoms**:
  - Running `npm run test:e2e` outputs: `browserType.launch: Executable doesn't exist at C:\Users\...\AppData\Local\ms-playwright\chromium-...`.
- **Causes**: Playwright browsers were not downloaded during npm install.
- **Diagnostics**:
  - Verify Playwright browser cache directory.
- **Fixes**:
  - Install Chromium browser binary:
    ```powershell
    npx playwright install chromium
    ```

---

### Scenario 09: Vitest Test Runner Timeout
- **Symptoms**:
  - `npm run test:unit` hangs or fails with: `Error: Test timed out in 5000ms`.
- **Causes**: Unhandled promise resolution, unclosed timers in test fixtures, or mutex deadlock under simulated concurrency tests.
- **Diagnostics**:
  - Run specific test with verbose flag:
    ```bash
    npm run test:unit
    ```
- **Fixes**:
  - Ensure all mock timers (`vi.useFakeTimers()`) call `vi.useRealTimers()` in teardown.
  - Verify async mutex tasks always resolve or reject.

---

### Scenario 10: ESLint / Code Style Failure
- **Symptoms**:
  - `npm run lint` fails with error: `@typescript-eslint/no-explicit-any` or `react-hooks/exhaustive-deps`.
  - `npm run verify` halts at Stage 1.
- **Causes**: Non-compliant types, missing dependency in `useEffect`, or unused variables.
- **Diagnostics**:
  - Run linter directly:
    ```bash
    npm run lint
    ```
- **Fixes**:
  - Address the specific line reported in the linter output. Do not disable rules unless explicitly permitted by spec.

---

### Scenario 11: PII Scanner False Positives (`scan-pii.mjs`)
- **Symptoms**:
  - `npm run scan:pii` reports: `[PII_ERROR] Disallowed tracking literal "GTM-..."` or `Unapproved real-looking email`.
- **Causes**:
  - A real email domain or unapproved phone format was added to a source file.
  - Or tracking ID literals were included in a file not listed in `ALLOWED_ID_FILES` (e.g. `demo/README.md`).
- **Diagnostics**:
  - Inspect output of `npm run scan:pii` to see file path and line number.
- **Fixes**:
  - Use approved fictional domains (`@example.com`, `@example.org`) and NANPA fictional phone exchange (`555-0100`).
  - In non-doc source files, read IDs from `src/lib/env.ts` rather than hardcoding string literals.

---

### Scenario 12: Async Mutex Deadlock on `crm-records.jsonl`
- **Symptoms**:
  - Concurrent requests to `/api/leads` never return; requests hang indefinitely until client aborts.
- **Causes**: An async mutex lock was acquired within a function that threw an unhandled exception before releasing the lock, or a recursive lock was attempted.
- **Diagnostics**:
  - Check `src/lib/crm-store.ts` lock acquisition logic.
- **Fixes**:
  - Wrap critical sections in `try { ... } finally { release(); }`.
  - Use in-mutex deduplication without re-locking.

---

### Scenario 13: CORS or Security Headers Issue on `/api/leads`
- **Symptoms**:
  - Browser console shows: `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`.
- **Causes**: Client form submitted to an absolute URL or different port rather than relative path `/api/leads`.
- **Diagnostics**:
  - Check the `action` or `fetch()` call URL in the form component.
- **Fixes**:
  - Ensure all internal fetch calls use relative endpoints (`/api/leads`).

---

### Scenario 14: React 19 / Next.js Hydration Mismatch
- **Symptoms**:
  - Browser console warning: `Hydration failed because the initial UI does not match what was rendered on the server`.
  - UI flickers or resets form values on load.
- **Causes**: Client-side date rendering (`Date.now()` or `new Date().toISOString()`) rendered differently during SSR vs client mount, or browser extensions injecting DOM elements.
- **Diagnostics**:
  - Inspect console for specific differing text content or attributes.
- **Fixes**:
  - Defer client-only values until after mount using `useEffect` or render fixed server-side placeholders.

---

### Scenario 15: Next.js Build Trace Errors
- **Symptoms**:
  - `npm run build` fails during `.next/trace` or standalone output generation: `EPERM: operation not permitted` on Windows.
- **Causes**: Windows search indexing, antivirus scanner, or open handles locking files in `.next/`.
- **Diagnostics**:
  - Run build with clean output:
    ```bash
    npm run build
    ```
- **Fixes**:
  - Exclude the project root from Windows Defender real-time scanning or search indexing.
  - Delete `.next` folder and rebuild:
    ```powershell
    Remove-Item -Recurse -Force demo\.next
    npm run build
    ```

---

### Scenario 16: Honeypot False Trigger on Form Submission
- **Symptoms**:
  - User submits form with valid details, but receives `400 Bad Request` with `{ error: "Bot submission rejected" }`.
- **Causes**: A browser password manager or autofill extension populated the hidden honeypot field (`website` or `fax`).
- **Diagnostics**:
  - Inspect payload sent in DevTools Network tab: verify if `website` or `fax` property is non-empty.
- **Fixes**:
  - Honeypot input should include `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden="true"`, and CSS `display: none` to prevent autofill heuristics from populating it.

---

### Scenario 17: Idempotency Key Mismatch
- **Symptoms**:
  - POST to `/api/leads` fails with `400 Bad Request` and message: `Idempotency-Key header does not match payload submission_id`.
- **Causes**: The HTTP request header `Idempotency-Key` was generated separately from the JSON body's `submission_id`.
- **Diagnostics**:
  - Check request headers and body in Network tab.
- **Fixes**:
  - Ensure the client generates a single `submission_id` (UUID v4) and passes it to both the header and the payload.

---

### Scenario 18: Double GTM Script Injection in React Strict Mode
- **Symptoms**:
  - Network tab shows two requests to `gtm.js?id=GTM-...`.
  - Console warnings indicating duplicate container load.
- **Causes**: React 19 Strict Mode mounts and unmounts components twice in development mode.
- **Diagnostics**:
  - Check `<GtmScript />` implementation in `demo/src/components/GtmScript.tsx`.
- **Fixes**:
  - Use a module-scoped boolean guard (`let isGtmInjected = false;`) or `next/script` with `strategy="afterInteractive"`.

---

### Scenario 19: Deterministic Latency Timeout in Client Fetch
- **Symptoms**:
  - Form submission hangs for exactly 420ms and then aborts if client fetch timeout is set too short.
- **Causes**: Client configured with an aggressive abort signal (e.g. 300ms), which is shorter than the deterministic 420ms backend sleep.
- **Diagnostics**:
  - Check Network tab waterfall for `/api/leads` timing.
- **Fixes**:
  - Configure client fetch timeout to at least 5000ms to allow for the 420ms deterministic latency sleep.

---

### Scenario 20: Missing `.env.local` Configuration
- **Symptoms**:
  - Warning on dev server startup: `Environment variables not found, using default unconfigured state`.
  - GTM container status displays `absent`.
- **Causes**: `demo/.env.local` was not copied from `demo/.env.example`.
- **Diagnostics**:
  - Run: `Test-Path demo/.env.local`
- **Fixes**:
  - Copy template file:
    ```powershell
    Copy-Item demo\.env.example demo\.env.local
    ```

---

### Scenario 21: Corrupted `crm-records.jsonl` Line
- **Symptoms**:
  - `/crm` page crashes or returns `500 Internal Server Error`.
  - Server log: `SyntaxError: Unexpected token in JSON at position ...`.
- **Causes**: Incomplete write, manual editing, or non-atomic crash left a malformed JSON line in `crm-records.jsonl`.
- **Diagnostics**:
  - Inspect lines in `demo/data/crm-records.jsonl`.
- **Fixes**:
  - Reset the CRM store:
    ```powershell
    Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/dev/reset"
    ```
  - Or manually remove the corrupted line from `demo/data/crm-records.jsonl`.

---

### Scenario 22: Ad-Blocker Blocking GTM or Leads API
- **Symptoms**:
  - Red warning banner: `Ad blocker detected or GTM failed to load`.
  - `gtm.js` blocked in Network tab by `ERR_BLOCKED_BY_CLIENT`.
- **Causes**: Browser ad-blocking extension (uBlock Origin, AdBlock Plus, Brave Shields) blocked the Google Tag Manager domain.
- **Diagnostics**:
  - Look for red blocked requests in Chrome DevTools Network tab.
- **Fixes**:
  - Whitelist `localhost:3000` in your ad blocker.
  - The legacy Test Conditions panel can record an ad-blocker diagnostic flag, but it does not block GTM. A browser extension or browser privacy feature is required to reproduce this condition.

---

### Scenario 23: Client-Side Navigation Dropping Query Parameters (Defect 5)
- **Symptoms**:
  - After navigating from Step 1 to Step 2, URL query parameters (`?utm_source=...`) disappear.
  - CRM record shows attribution as `direct` instead of `google / cpc`.
- **Causes**: This is the **intentional mechanism of Defect 5**. The scenario demonstrates attribution loss across SPA route transitions when parameters are not stored in first-touch storage.
- **Diagnostics**:
  - Inspect Observability panel on `/scenario/defect-5`.
- **Fixes**:
  - For baseline and production code, use `src/lib/attribution.ts` to persist parameters in cookie / sessionStorage upon entry.

---

### Scenario 24: Dev-Guarded Reset API Returning 403 Forbidden
- **Symptoms**:
  - POST to `/api/dev/reset` responds with `403 Forbidden` and `{ error: "Dev reset endpoint is disabled in production" }`.
- **Causes**: The application is running in production mode (`NODE_ENV=production` or started with `npm run start`).
- **Diagnostics**:
  - Check process environment: `$env:NODE_ENV`.
- **Fixes**:
  - Switch to development mode:
    ```bash
    npm run dev
    ```
  - Dev reset is intentionally forbidden in production builds to prevent accidental data destruction.

---

### Scenario 25: Documentation Command Mismatch (`check-docs-commands.mjs`)
- **Symptoms**:
  - `npm run check:docs` fails with: `[DOCS_ERROR] docs/foo.md:42 references undefined script: "npm run bar"`.
  - `npm run verify` fails at Stage 7.
- **Causes**: A markdown file in `docs/` contains a shell code block referencing an npm script that does not exist in `demo/package.json`.
- **Diagnostics**:
  - Run the doc command checker:
    ```bash
    npm run check:docs
    ```
- **Fixes**:
  - Edit the offending markdown file so the script name matches an actual script in `demo/package.json` (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:unit`, `test:e2e`, `scan:pii`, `check:docs`, `emit:matrix`, `verify`).

---

### Scenario 26: PowerShell Execution Policy Restricting Script Execution
- **Symptoms**:
  - PowerShell error: `File C:\Users\...\AppData\Roaming\npm\npm.ps1 cannot be loaded because running scripts is disabled on this system`.
- **Causes**: Windows PowerShell `ExecutionPolicy` is set to `Restricted` by default.
- **Diagnostics**:
  - Run: `Get-ExecutionPolicy`
- **Fixes**:
  - Set execution policy for the current user:
    ```powershell
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    ```
  - Or bypass for the current session:
    ```powershell
    powershell -ExecutionPolicy Bypass
    ```

---

### Scenario 27: Axe-Core Accessibility Contrast or Label Violations
- **Symptoms**:
  - `npm run test:e2e` fails an accessibility assertion: `Found 1 accessibility violations: color-contrast` or `label: Form element does not have an associated label`.
- **Causes**: Text color does not meet WCAG AA 4.5:1 contrast ratio, or an `<input>` is missing a matching `<label htmlFor="...">`.
- **Diagnostics**:
  - Inspect Playwright test failure trace or run axe in browser DevTools.
- **Fixes**:
  - Reference CSS tokens in `src/styles/tokens.css` for approved high-contrast colors (`--color-text-primary: #0f172a` on `--color-bg-surface: #ffffff`).
  - Ensure every input has a unique `id` matching its `<label htmlFor="...">`.

---

### Scenario 28: Verification Matrix Generation Failure (`emit-matrix.mjs`)
- **Symptoms**:
  - `npm run emit:matrix` outputs: `[emit-matrix] No test results found at demo/test-results/playwright-results.json`.
- **Causes**: `npm run test:e2e` was not run prior to `emit:matrix`, so no Playwright JSON artifact exists.
- **Diagnostics**:
  - Check if file exists: `Test-Path demo/test-results/playwright-results.json`.
- **Fixes**:
  - Run E2E tests first to produce the results file:
    ```bash
    npm run test:e2e
    npm run emit:matrix
    ```
  - Or run the full pipeline which handles sequencing automatically:
    ```bash
    npm run verify
    ```
