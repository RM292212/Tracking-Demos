/**
 * ResponseLock Analytics & dataLayer Interface Contract
 * Location: demo/src/lib/contracts/events.ts
 *
 * Authoritative constants and signatures for all dataLayer pushes.
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

import { AttributionStatus } from './attribution';

/**
 * Canonical conversion event name expected by production GTM triggers.
 */
export const ANALYTICS_EVENT_NAME = 'demo_lead_success' as const;

/**
 * INTENTIONAL DEFECT CONSTANT — EDUCATIONAL.
 * Real-world analogue: Event-name typo introduced during website rebuild or copy-paste
 * that causes the trigger in GTM to never match, silently dropping all conversions.
 * Used exclusively by Defect 3.
 */
export const LEGACY_MISSPELLED_EVENT = 'demo_lead_sucess' as const;

/**
 * Canonical union of all 7 scenarios in the ResponseLock demo.
 */
export type ScenarioId =
  | 'baseline'
  | 'defect-1'
  | 'defect-2'
  | 'defect-3'
  | 'defect-4'
  | 'defect-5'
  | 'defect-6';

/**
 * Strict whitelist of approved keys permitted in dataLayer conversion pushes.
 * Under no circumstances may PII (names, emails, phones, notes, URLs) be pushed.
 */
export const APPROVED_ANALYTICS_PAYLOAD_KEYS = [
  'event',
  'form_id',
  'lead_type',
  'scenario',
  'submission_id',
  'attribution_status',
  'debug_mode',
] as const;

export type ApprovedAnalyticsPayloadKey =
  typeof APPROVED_ANALYTICS_PAYLOAD_KEYS[number];

/**
 * Strongly typed interface for the canonical analytics conversion payload.
 */
export interface AnalyticsPayload {
  event: typeof ANALYTICS_EVENT_NAME | typeof LEGACY_MISSPELLED_EVENT | string;
  form_id: 'lead_audit_demo' | string;
  lead_type: 'agency_audit_inquiry' | string;
  scenario: ScenarioId;
  submission_id: string;
  attribution_status: AttributionStatus;
  debug_mode: true;
}

/**
 * Parameters accepted by buildAnalyticsPayload().
 */
export interface BuildAnalyticsPayloadParams {
  scenario: ScenarioId;
  submissionId: string;
  attributionStatus: AttributionStatus;
  overrideEventName?: string;
  overrideFormId?: string;
  overrideLeadType?: string;
}

/**
 * PII detection patterns for assertion guard.
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(?:\+?1[-.\s])?\d{3}[-.\s]\d{4}/;

/**
 * Asserts that a record contains zero PII in its keys or values.
 * Throws an Error if PII is detected.
 */
export function assertNoPiiInPayload(payload: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('email') ||
      lowerKey.includes('phone') ||
      lowerKey.includes('name') ||
      lowerKey.includes('message') ||
      lowerKey.includes('note') ||
      lowerKey.includes('url')
    ) {
      throw new Error(
        `[PII VIOLATION] Analytics payload key "${key}" violates ResponseLock zero-PII policy.`
      );
    }

    if (typeof value === 'string') {
      if (EMAIL_REGEX.test(value)) {
        throw new Error(
          `[PII VIOLATION] Email address pattern detected in analytics value for key "${key}".`
        );
      }
      if (PHONE_REGEX.test(value)) {
        throw new Error(
          `[PII VIOLATION] Phone number pattern detected in analytics value for key "${key}".`
        );
      }
    }
  }
}

/**
 * Builds the canonical dataLayer analytics payload for lead conversion.
 * Strictly enforces the approved keys whitelist and strips any unauthorized fields.
 */
export function buildAnalyticsPayload(
  params: BuildAnalyticsPayloadParams
): AnalyticsPayload {
  const event = params.overrideEventName ?? ANALYTICS_EVENT_NAME;
  const form_id = params.overrideFormId ?? 'lead_audit_demo';
  const lead_type = params.overrideLeadType ?? 'agency_audit_inquiry';

  const rawPayload: Record<string, unknown> = {
    event,
    form_id,
    lead_type,
    scenario: params.scenario,
    submission_id: params.submissionId,
    attribution_status: params.attributionStatus,
    debug_mode: true,
  };

  // Run zero-PII assertion
  assertNoPiiInPayload(rawPayload);

  // Filter strictly through approved keys whitelist
  const sanitized: Record<string, unknown> = {};
  for (const key of APPROVED_ANALYTICS_PAYLOAD_KEYS) {
    if (rawPayload[key] !== undefined) {
      sanitized[key] = rawPayload[key];
    }
  }

  return sanitized as unknown as AnalyticsPayload;
}

/**
 * Type guard validating whether an unknown object conforms to AnalyticsPayload.
 */
export function isApprovedAnalyticsPayload(
  obj: unknown
): obj is AnalyticsPayload {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;

  // Check required keys
  for (const key of APPROVED_ANALYTICS_PAYLOAD_KEYS) {
    if (!(key in record)) return false;
  }

  // Check no extra keys
  const keys = Object.keys(record);
  if (keys.length !== APPROVED_ANALYTICS_PAYLOAD_KEYS.length) return false;

  return record['debug_mode'] === true;
}
