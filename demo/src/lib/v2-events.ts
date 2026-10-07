import type { AttributionStatus } from '@/lib/contracts/attribution';

export const V2_CANONICAL_EVENT = 'demo_lead_success' as const;
export const V2_FORM_ID = 'alder_consultation' as const;
export const V2_LEAD_TYPE = 'consultation' as const;
const V2_ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
] as const;

export type V2Attribution = Partial<Record<(typeof V2_ATTRIBUTION_KEYS)[number], string>>;

export interface V2LeadSuccessPayload {
  event: typeof V2_CANONICAL_EVENT;
  form_id: typeof V2_FORM_ID;
  lead_type: typeof V2_LEAD_TYPE;
  scenario: 'baseline';
  submission_id: string;
  attribution_status: AttributionStatus;
  debug_mode: true;
  timestamp: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
}

// Campaign parameters are free-form URL input. Keep only short, single-token
// values; reject email, phone, URL, and long numeric patterns before they can
// enter either CRM attribution or the dataLayer.
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/i;
const PHONE = /(?:\+?\d[\d().\s-]{6,}\d)/;
const LONG_DIGITS = /\d{7,}/;
const SAFE_TOKEN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/;

export function sanitizeV2Attribution(input: Record<string, unknown>): V2Attribution {
  const output: V2Attribution = {};
  for (const key of V2_ATTRIBUTION_KEYS) {
    const raw = input[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value || value.length > 80 || !SAFE_TOKEN.test(value)) continue;
    if (EMAIL.test(value)) continue;
    // Click IDs are opaque and can contain long digit runs. A wholly numeric
    // GCLID is rejected as likely contact data; alphanumeric IDs are retained.
    if (key === 'gclid') {
      if (PHONE.test(value) && /^\+?[\d().\s-]+$/.test(value)) continue;
    } else if (PHONE.test(value) || LONG_DIGITS.test(value)) continue;
    output[key] = value;
  }
  return output;
}

export function buildV2LeadSuccessPayload(args: {
  submissionId: string;
  attributionStatus: AttributionStatus;
  attribution: V2Attribution;
  timestamp?: string;
}): V2LeadSuccessPayload {
  return {
    event: V2_CANONICAL_EVENT,
    form_id: V2_FORM_ID,
    lead_type: V2_LEAD_TYPE,
    scenario: 'baseline',
    submission_id: args.submissionId,
    attribution_status: args.attributionStatus,
    debug_mode: true,
    timestamp: args.timestamp ?? new Date().toISOString(),
    utm_source: args.attribution.utm_source ?? '',
    utm_medium: args.attribution.utm_medium ?? '',
    utm_campaign: args.attribution.utm_campaign ?? '',
    utm_term: args.attribution.utm_term ?? '',
    utm_content: args.attribution.utm_content ?? '',
    gclid: args.attribution.gclid ?? '',
  };
}

export function countV2CanonicalEvents(dataLayer: unknown[] | undefined): number {
  if (!dataLayer) return 0;
  return dataLayer.filter(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      (item as Record<string, unknown>).event === V2_CANONICAL_EVENT &&
      (item as Record<string, unknown>).form_id === V2_FORM_ID
  ).length;
}
