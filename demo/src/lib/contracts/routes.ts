/**
 * ResponseLock Route Registry & Verification Labels Contract
 * Location: demo/src/lib/contracts/routes.ts
 *
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

import { ScenarioId } from './events';

/**
 * The 4 authoritative verification layers specified in R2.
 */
export const VERIFICATION_LAYERS = [
  'Confirmed locally',
  'Requires GTM Preview',
  'Requires GA4 DebugView',
  'Not tested in Google Ads',
] as const;

export type VerificationLayer = typeof VERIFICATION_LAYERS[number];

/**
 * Route definition metadata.
 */
export interface RouteDefinition {
  path: string;
  title: string;
  scenarioId: ScenarioId | null;
  verificationLayers: VerificationLayer[];
  description: string;
  navigable: boolean;
}

/**
 * Canonical registry of all 10 application routes.
 */
export const ROUTE_REGISTRY: readonly RouteDefinition[] = [
  {
    path: '/',
    title: 'Overview & Audit Index',
    scenarioId: null,
    verificationLayers: ['Confirmed locally'],
    description: 'Workspace overview, architecture index, and scenario launchpad.',
    navigable: true,
  },
  {
    path: '/scenario/baseline',
    title: 'Baseline Valid Form',
    scenarioId: 'baseline',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Intact end-to-end conversion chain: form -> API -> CRM -> dataLayer.',
    navigable: true,
  },
  {
    path: '/scenario/defect-1',
    title: 'Defect 1: Conversion Fires on Invalid Submit',
    scenarioId: 'defect-1',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Submit button click pushes conversion event before client validation passes.',
    navigable: true,
  },
  {
    path: '/scenario/defect-2',
    title: 'Defect 2: Duplicate Conversion',
    scenarioId: 'defect-2',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Legacy click listener and new post-success listener push duplicate conversion events.',
    navigable: true,
  },
  {
    path: '/scenario/defect-3',
    title: 'Defect 3: Missing Conversion Event',
    scenarioId: 'defect-3',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Typo in event constant name prevents GTM custom event trigger from matching.',
    navigable: true,
  },
  {
    path: '/scenario/defect-4',
    title: 'Defect 4: Bad/Missing Event Parameters',
    scenarioId: 'defect-4',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Schema drift drops form_id and passes corrupt lead_type value to analytics.',
    navigable: true,
  },
  {
    path: '/scenario/defect-5',
    title: 'Defect 5: Attribution Loss Across Navigation',
    scenarioId: 'defect-5',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Client-side route navigation drops URL query parameters; form reads location.search.',
    navigable: true,
  },
  {
    path: '/scenario/defect-6',
    title: 'Defect 6: Incomplete & Mismapped CRM Record',
    scenarioId: 'defect-6',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    description: 'Server CRM mapper drops utm_campaign and assigns source to lead_source_detail.',
    navigable: true,
  },
  {
    path: '/crm',
    title: 'Simulated CRM Viewer',
    scenarioId: null,
    verificationLayers: ['Confirmed locally'],
    description: 'Local inspection table for stored JSONL CRM records and mapping health.',
    navigable: true,
  },
  {
    path: '/evidence',
    title: 'Audit Evidence Hub',
    scenarioId: null,
    verificationLayers: ['Confirmed locally'],
    description: 'Evidence artifacts, finding summaries, and verification matrix links.',
    navigable: true,
  },
] as const;

export function getRouteByPath(path: string): RouteDefinition | undefined {
  return ROUTE_REGISTRY.find((r) => r.path === path);
}

export function getRouteByScenario(scenarioId: ScenarioId): RouteDefinition | undefined {
  return ROUTE_REGISTRY.find((r) => r.scenarioId === scenarioId);
}
