/**
 * ResponseLock Observability & Timeline Contract
 * Location: demo/src/lib/contracts/timeline.ts
 *
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

import { ScenarioId } from './events';

/**
 * Chronological event categories in the observability stream.
 */
export const TIMELINE_CATEGORIES = [
  'lifecycle',
  'validation',
  'network',
  'analytics',
  'storage',
  'crm',
  'attribution',
  'consent',
  'defect',
] as const;

export type TimelineCategory = typeof TIMELINE_CATEGORIES[number];

/**
 * Single entry in the observability timeline.
 */
export interface TimelineEntry {
  id: string; // Unique entry identifier (e.g., 'evt-1', 'evt-2')
  timestamp: number; // Elapsed ms from scenario init or Unix epoch ms
  category: TimelineCategory;
  label: string; // Concise human-readable action description
  payload?: Record<string, unknown> | null; // Sanitized metadata (strictly zero PII)
}

/**
 * Standardized manifest structure for clipboard copy and JSON download.
 */
export interface SanitizedEvidenceManifest {
  scenario: ScenarioId | string;
  exportedAt: string; // ISO 8601 string
  entries: TimelineEntry[];
  summary: {
    totalEvents: number;
    dataLayerPushes: number;
    crmRequests: number;
    validationFailures: number;
  };
  disclaimer: 'This manifest is a local educational record and is NOT equivalent to GTM Preview or GA4 DebugView.';
}
