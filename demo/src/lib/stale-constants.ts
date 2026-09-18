// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: Event name drift between developer rebuild and GTM trigger.

/**
 * Stale constants module representing legacy tracking definitions surviving an uncoordinated
 * frontend refactoring or rebuild.
 *
 * Real-world analogue: A frontend developer updated event naming conventions or introduced
 * a typo ('demo_lead_sucess' with a single 's') in the codebase, but the GTM container trigger
 * remains configured to listen for the canonical 'demo_lead_success' (with double 's').
 *
 * Result: The lead is successfully persisted in the database/CRM, but the custom event trigger
 * in GTM never matches. Zero conversion tags fire, resulting in complete conversion loss in GA4
 * and Google Ads.
 */
export const LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess' as const;
