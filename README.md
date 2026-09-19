# ResponseLock Week-1: Conversion-Integrity Demo Workspace

A local training and demonstration workspace that teaches and proves the ResponseLock Lead & Conversion Integrity Audit ($350 fixed-scope service for small paid-media agencies).

Single most important teaching outcome: **a form that works does not mean conversion data is trustworthy.**

## Workspace Structure
- `demo/`: Next.js App Router application with intentional tracking defects, simulated CRM, and observability.
- `docs/`: Comprehensive documentation and runbooks.
- `evidence/`: Finding packages and audit evidence.
- `gtm/`: Dedicated non-production GTM container export and import notes.

## Commands
Run all commands from the repository root:

```bash
# Start development server
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run security and PII scan
npm run scan:pii

# Check documentation command validity
npm run check:docs

# Local automated verification pipeline (Layer 1: lint, typecheck, unit, build, e2e, scan, docs)
# Note: GTM Preview, GA4 DebugView, and screenshots are verified manually. Google Ads was not tested.
npm run verify
```
