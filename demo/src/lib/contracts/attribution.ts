/**
 * ResponseLock Attribution Interface Contract
 * Location: demo/src/lib/contracts/attribution.ts
 *
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

/**
 * Core query parameters tracked for marketing attribution.
 */
export interface AttributionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
}

/**
 * Persisted state including page context and touch timestamps.
 */
export interface AttributionState extends AttributionParams {
  landing_page?: string;
  referrer?: string;
  first_touch_timestamp?: number;
  last_touch_timestamp?: number;
}

/**
 * Status indicator reflecting the completeness and health of attribution.
 * - 'present': Full core parameters (or click ID) available
 * - 'partial': Incomplete parameters (e.g. utm_source without campaign/medium)
 * - 'missing': Direct or organic traffic without tracking parameters
 * - 'dropped': Attribution was captured at entry but lost during route navigation (Defect 5)
 */
export type AttributionStatus = 'present' | 'partial' | 'missing' | 'dropped';

/**
 * Browser storage keys for marketing persistence.
 */
export const ATTRIBUTION_STORAGE_KEYS = {
  FIRST_TOUCH_COOKIE: 'rl_first_touch', // ~90 day expiry
  LAST_TOUCH_SESSION: 'rl_last_touch',  // sessionStorage
} as const;

/**
 * Determines whether any attribution parameter is populated.
 */
export function hasAnyAttribution(
  state: AttributionParams | null | undefined
): boolean {
  if (!state) return false;
  return Boolean(
    state.utm_source ||
    state.utm_medium ||
    state.utm_campaign ||
    state.utm_term ||
    state.utm_content ||
    state.gclid ||
    state.gbraid ||
    state.wbraid
  );
}

/**
 * Derives the AttributionStatus based on the current submission state
 * and the initial entry state captured upon landing.
 */
export function deriveAttributionStatus(
  currentState: AttributionState | null | undefined,
  entryState?: AttributionState | null
): AttributionStatus {
  const hasCurrent = hasAnyAttribution(currentState);
  const hadEntry = hasAnyAttribution(entryState);

  // Defect 5 condition: entry link carried parameters, but current state has none
  if (!hasCurrent && hadEntry) {
    return 'dropped';
  }

  // If no parameters currently present
  if (!hasCurrent) {
    return 'missing';
  }

  const curr = currentState!;

  // Google Click ID or iOS Web Click IDs provide full paid-media attribution
  if (curr.gclid || curr.gbraid || curr.wbraid) {
    return 'present';
  }

  // Full UTM suite check
  if (curr.utm_source && curr.utm_medium && curr.utm_campaign) {
    return 'present';
  }

  // At least one parameter present, but incomplete suite
  return 'partial';
}
