# Local tracking demo application

This Next.js application contains the preserved ResponseLock legacy defect lab and the Alder V2 lead form with `/audit` diagnostics. V2 uses the shared event name `demo_lead_success` with `form_id: alder_consultation` and `lead_type: consultation`. Its payload is emitted after a matching server-confirmed receipt and contains only allowlisted attribution fields and non-PII identifiers.

The local CRM is simulated. The known GTM container is empty and account access is pending. GA4 property access is pending, so no external receipt or Key Event is established. Google Ads tags in the repository's import template are paused and use replacement placeholders. Meta Pixel, Conversions API, and Enhanced Conversions are not implemented.

## Commands

Run scripts in this directory, or use the root workspace wrappers:

| Script | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint using the flat configuration |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright browser checks; these can reset the local CRM data |
| `npm run scan:pii` | Scan source and fixtures for PII patterns |
| `npm run check:docs` | Check documented npm commands |

Before running E2E tests, back up local CRM data and stop any server already using port 3000, especially a production server. Playwright reuses an existing server on that port; the production app rejects the test-only `/api/dev/reset` request with 403, while E2E expects Playwright to start its configured development server. See the root README and `docs/` for the project and external-service boundaries.
