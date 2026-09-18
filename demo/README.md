# ResponseLock Demo Application

The Next.js 15 App Router training and demonstration application for the ResponseLock Lead & Conversion Integrity Audit ($350 fixed-scope service).

This application demonstrates the complete marketing conversion pipeline and showcases six intentional, authentic, production-shaped tracking defects alongside an intact baseline conversion chain, a simulated local CRM, and real-time observability tooling.

---

## 1. Directory Structure

```
demo/
├── package.json               # Scripts and dependency definitions
├── tsconfig.json              # Strict TypeScript configuration
├── next.config.ts             # Next.js build configuration
├── vitest.config.ts           # Vitest unit test runner config
├── playwright.config.ts       # Playwright E2E configuration (IPv4 127.0.0.1)
├── .env.example               # Template environment configuration
├── .env.local                 # Local environment variables (gitignored)
├── src/
│   ├── app/                   # Next.js App Router routes & layouts
│   │   ├── layout.tsx         # Root layout with GtmScript & Consent Mode v2
│   │   ├── page.tsx           # Home / Scenario navigation index
│   │   ├── crm/page.tsx       # Simulated CRM lead viewer table
│   │   ├── evidence/page.tsx  # Evidence packages and finding index
│   │   ├── scenario/          # Scenario pages
│   │   │   ├── baseline/      # Intact baseline conversion chain
│   │   │   ├── defect-1/      # False conversion on invalid submission
│   │   │   ├── defect-2/      # Duplicate conversion push
│   │   │   ├── defect-3/      # Missing conversion (event name typo)
│   │   │   ├── defect-4/      # Bad event parameters schema drift
│   │   │   ├── defect-5/      # Attribution loss across SPA navigation
│   │   │   └── defect-6/      # Incomplete / mismapped CRM record
│   │   └── api/               # Next.js Route Handlers
│   │       ├── leads/route.ts # Leads submission endpoint (Zod, latency, mutex)
│   │       ├── crm/route.ts   # Lead retrieval endpoint
│   │       └── dev/reset/     # Dev-guarded reset endpoint
│   ├── components/            # Reusable UI & diagnostic components
│   │   ├── GtmScript.tsx      # GTM snippet with StrictMode injection guard
│   │   ├── ConsentBanner.tsx  # Consent Mode v2 banner & toggle
│   │   ├── ObservabilityPanel.tsx # Chronological event timeline
│   │   ├── CrmTable.tsx       # 10-column simulated CRM table
│   │   ├── TestConditionsPanel.tsx # Ad blocker & error simulator
│   │   └── forms/             # Baseline and defect form implementations
│   ├── lib/                   # Core business logic and storage
│   │   ├── env.ts             # Validated environment configuration
│   │   ├── crm-store.ts       # JSONL storage engine with async mutex
│   │   ├── attribution.ts     # First-touch & last-touch attribution engine
│   │   ├── mappers/           # Scenario-specific CRM mappers
│   │   └── contracts/         # Frozen contract pack (events, crm, schema)
│   └── styles/
│       ├── tokens.css         # CSS design tokens (colors, spacing, focus)
│       └── globals.css        # Base stylesheet
├── scripts/                   # Automated repository verification scripts
│   ├── scan-pii.mjs           # Security & PII leak scanner
│   ├── check-docs-commands.mjs# Shell command accuracy validator
│   └── emit-matrix.mjs        # Dynamic verification matrix generator
├── tests/                     # Automated test suites
│   ├── unit/                  # Vitest unit & contract tests
│   └── e2e/                   # Playwright browser end-to-end tests
├── data/                      # Local JSONL store directory (.gitkeep)
└── test-results/              # Test run artifacts & verification matrix
```

---

## 2. Environment & Configuration

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

The application validates configuration using Zod in `src/lib/env.ts`. If environment variables are omitted, the application runs safely in an unconfigured test state.

---

## 3. Available npm Scripts

All scripts must be run from the `demo/` directory (or via root workspace delegation):

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Starts the local development server at `http://localhost:3000` |
| `npm run build` | `next build` | Builds the optimized production application |
| `npm run start` | `next start` | Serves the production build locally |
| `npm run lint` | `next lint` | Executes ESLint across all TypeScript and React files |
| `npm run typecheck` | `tsc --noEmit` | Runs strict TypeScript type-checking without emitting files |
| `npm run test` | `vitest run` | Runs unit and integration test suite |
| `npm run test:unit` | `vitest run` | Runs Vitest unit tests |
| `npm run test:e2e` | `playwright test` | Runs Playwright Chromium end-to-end tests |
| `npm run scan:pii` | `node scripts/scan-pii.mjs` | Scans codebase for real PII or forbidden tracking literals |
| `npm run check:docs` | `node scripts/check-docs-commands.mjs` | Validates documentation shell commands against scripts |
| `npm run emit:matrix` | `node scripts/emit-matrix.mjs` | Generates verification matrix from test results |
| `npm run verify` | Complete pipeline | Runs all 7 quality stages in sequence |

---

## 4. Development & Testing Workflow

### 4.1 Running the App Locally
```bash
# Start dev server
npm run dev
```
Visit `http://localhost:3000` in Google Chrome or Microsoft Edge.

### 4.2 Running Quality Checks
Before submitting changes or staging commits:
```bash
# Run linting
npm run lint

# Run typecheck
npm run typecheck

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run security and documentation checks
npm run scan:pii
npm run check:docs

# Run full pipeline
npm run verify
```

---

## 5. Safety & Integrity Principles

1. **Fictional Data Only**: Always use fictional demo identities (`demo.user@example.com`, `+1-555-0100`, `Example Media Group`).
2. **Zero External Egress**: The simulated CRM writes strictly to `data/crm-records.jsonl`. No data leaves the local machine.
3. **Zero PII in Analytics**: Only the 7 approved non-PII keys are pushed to `window.dataLayer`.
4. **$350 Fixed Scope**: Commercial representations must strictly honor the ResponseLock $350 service scope.
