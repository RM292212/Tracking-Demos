# ResponseLock Environment & Host Specification

**Status**: Local environment reference; service access is pending
**Host Target**: Windows 11 with PowerShell 5.1
**Runtime**: Node.js v24.18.0 (LTS) & npm 11.16.0
**Workspace Root**: `C:\Users\Ranji\code-base\RL-Demo`  
**Commercial Context**: ResponseLock $350 Fixed-Scope Lead & Conversion Integrity Audit  

---

## 1. Environment Baseline & Detected System Specs

The local workspace uses the host/runtime values below. This reference does not establish external GTM or GA4 access, event receipt, or publication status.

| Component | Authoritative Specification | Detection / Verification Command |
|---|---|---|
| **Operating System** | Windows 11 (x64) | `[System.Environment]::OSVersion.Version` |
| **Shell** | Windows PowerShell 5.1 | `$PSVersionTable.PSVersion` |
| **Node.js** | v24.18.0 (Current LTS) | `node -v` |
| **Package Manager** | npm 11.16.0 (Single authoritative package manager) | `npm -v` |
| **Version Control** | Git 2.55.0 (Local repository only; no remote push) | `git --version` |
| **Default Port** | TCP Port 3000 (IPv4 binding: `127.0.0.1`) | `Get-NetTCPConnection -LocalPort 3000` |
| **GTM Container ID** | `GTM-KRH5W5MX` (known empty container; account access pending) | Read via `src/lib/env.ts` from `.env.local` |
| **GA4 Measurement ID** | `G-GQBPF316M0` (configured ID; property access pending) | Read via `src/lib/env.ts` from `.env.local` |

---

## 2. Windows & PowerShell 5.1 Operating Conventions

Developing and running automated testing on Windows 11 requires strict adherence to specific platform conventions:

### 2.1 PowerShell Execution Policy
By default, Windows may restrict the execution of PowerShell script wrappers (such as `npm.ps1` or `npx.ps1`). To ensure uninterrupted command execution:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Alternatively, invoke commands bypassing the policy:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run test:e2e"
```

### 2.2 Path Separators & Normalization
- **File System**: Windows uses backslashes (`\`) for filesystem paths (`C:\Users\Ranji\code-base\RL-Demo`).
- **Node & Tooling**: Node.js, Next.js, and Vitest accept forward slashes (`/`).
- **Normalizing Scripts**: In all guard scripts (`scan-pii.mjs`, `check-docs-commands.mjs`, `emit-matrix.mjs`), relative paths are explicitly normalized using `.replace(/\\/g, '/')` to ensure cross-platform reproducibility and consistent regex evaluations.

### 2.3 Environment Variable Setting in PowerShell
In PowerShell 5.1, environment variables are set using the `$env:` prefix rather than Unix `export`:

```powershell
# Set environment variable for current session
$env:NODE_ENV = "development"

# Unset environment variable
Remove-Item Env:\NODE_ENV
```

### 2.4 Line Endings (CRLF vs. LF)
- Git is configured to preserve line endings or convert safely:
  - Source code files (`.ts`, `.tsx`, `.css`, `.json`) can use either LF or CRLF.
  - JSONL storage files (`demo/data/crm-records.jsonl`) are written with standard `\n` line delimiters to ensure deterministic line counts across operating systems.

---

## 3. Technology Stack & Dependency Discipline

The project follows a strict zero-bloat, named-dependency policy. No unapproved third-party packages may be introduced.

### 3.1 Core Framework & Runtime
- **Next.js 15.2.0 (App Router)**: Route Handlers (`src/app/api/`), Server Components, Client Components, and standalone layout architecture.
- **React 19.0.0**: Leveraging React 19 hooks and DOM rendering.
- **TypeScript 5.7.3**: Configured with ultra-strict compiler options:
  - `"strict": true`
  - `"noUncheckedIndexedAccess": true`
  - `"target": "ES2022"`
  - `"moduleResolution": "bundler"`
- **Zod 3.24.2**: Single source of truth for runtime validation of request payloads, response structures, environment variables, and CRM models.
- **CSS Modules + `tokens.css`**: Zero runtime CSS-in-JS. Plain CSS Modules combined with design tokens for colors, spacing, typography, and accessibility focus rings.

### 3.2 Testing & Quality Harness
- **Vitest 3.0.5**: Blazing-fast unit and integration testing running in `jsdom 26.0.0`.
- **Testing Library**: `@testing-library/react 16.2.0` and `@testing-library/dom 10.4.0` for DOM and contract testing.
- **Playwright 1.50.1**: Chromium-only end-to-end automation. Configured to explicitly bind to IPv4 (`127.0.0.1:3000`) to avoid Windows IPv6 localhost resolution delays.
- **@axe-core/playwright 4.10.1**: Automated WCAG AA accessibility audit on every route.
- **ESLint 9.20.0 with `eslint-config-next`**: Enforcing code quality and React best practices.

---

## 4. Storage Architecture: Async Mutex JSONL Model

The application uses an embedded, local JSONL file storage architecture rather than an external database daemon:
- **Storage Location**: `demo/data/crm-records.jsonl`
- **Concurrency Guard**: In-process Async Mutex implemented in `demo/src/lib/crm-store.ts`.
- **Deduplication**: In-mutex deduplication ensures idempotency keys (`submission_id`) are checked and deduplicated atomically before any file append occurs.
- **Latency Emulation**: Deterministic 420ms delay injected via a constant `sleep(420)` to simulate real-world CRM API network latency without non-deterministic `Math.random()`.
- **Dev-Guarded Reset**: `POST /api/dev/reset` truncates the file under mutex lock, restricted to `NODE_ENV !== 'production'`.

---

## 5. Directory Layout

```
C:\Users\Ranji\code-base\RL-Demo
├── README.md                              # Workspace overview
├── STATUS.md                              # Current status and wave progression
├── CHANGELOG.md                           # Version log
├── package.json                           # Root workspace manifest
├── .gitignore                             # Comprehensive ignore rules
├── docs/                                  # Authoritative documentation suite
│   ├── CONTRACTS.md                       # Frozen interfaces and types
│   ├── environment.md                     # This environment specification
│   ├── architecture.md                    # System architecture and data flow
│   ├── demo-runbook.md                    # Operator walkthrough guide
│   ├── troubleshooting.md                 # 28 error scenarios and solutions
│   ├── demo-safety-rules.md               # 15 binding safety rules
│   ├── week-1-checklist.md                # Wave 0 - Wave 3 milestone tracking
│   ├── manual-verification-checklist.md   # Step-by-step QA checklist
│   ├── gtm-setup.md                       # Non-prod GTM container instructions
│   ├── gtm-manual-steps.md                # Manual tag/trigger fallback steps
│   ├── ga4-debugview-setup.md             # GA4 DebugView test property guide
│   ├── google-ads-boundary.md             # Conceptual boundary explanation
│   ├── defect-catalog.md                  # Detailed 6-defect catalog
│   ├── client-explanation-scripts.md      # Plain language scripts (≤60 words)
│   └── evidence-capture-guide.md          # Screenshot and artifact capture guide
├── gtm/                                   # Dedicated GTM container exports
│   ├── responselock-demo-container.json
│   └── IMPORT-NOTES.md
├── demo/                                  # Next.js App Router application
│   ├── package.json                       # Application scripts and dependencies
│   ├── tsconfig.json                      # Strict TypeScript configuration
│   ├── next.config.ts                     # Next.js configuration
│   ├── vitest.config.ts                   # Vitest unit test configuration
│   ├── playwright.config.ts               # Playwright E2E configuration
│   ├── .env.example                       # Example environment file
│   ├── .env.local                         # Local test environment (gitignored)
│   ├── README.md                          # Application README
│   ├── src/
│   │   ├── app/                           # App Router routes and API handlers
│   │   ├── components/                    # UI components, panels, forms
│   │   ├── lib/                           # Store, env, attribution, contracts
│   │   └── styles/                        # CSS modules and tokens.css
│   ├── scripts/                           # Guard scripts
│   │   ├── scan-pii.mjs
│   │   ├── check-docs-commands.mjs
│   │   └── emit-matrix.mjs
│   ├── tests/                             # Vitest and Playwright test suites
│   ├── data/                              # Local JSONL storage
│   └── test-results/                      # Playwright test outputs
├── evidence/                              # Audit evidence finding packages
├── audit-template/                        # Sample audit report template
├── scope/                                 # Fixed $350 audit scope definition
├── access/                                # Read-only authorization checklist
├── proposals/                             # Agency proposal template
├── invoices/                              # $350 audit invoice template
└── business-tracker/                      # Lead pipeline and tracking
```

---

## 6. Execution Commands & Verification

Every developer and auditor can verify the entire environment using these standard npm scripts:

```bash
# Start local development server
npm run dev

# Run TypeScript compiler check
npm run typecheck

# Run unit and contract tests
npm run test:unit

# Run end-to-end browser tests
npm run test:e2e

# Run security & PII scanner
npm run scan:pii

# Run documentation command validator
npm run check:docs

# Generate canonical verification matrix
npm run emit:matrix

# Run complete 7-stage verification pipeline
npm run verify
```
