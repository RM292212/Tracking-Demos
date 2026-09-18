/**
 * ResponseLock Environment Validation Module
 * Location: demo/src/lib/env.ts
 *
 * Validates public GTM and GA4 configuration variables via Zod.
 * Exposes strictly typed status indicators without throwing unhandled
 * exceptions during build when tracking IDs are omitted.
 */

import { z } from 'zod';

export type TrackingStatus = 'configured' | 'absent' | 'invalid';

/**
 * GTM Container ID format: GTM- followed by at least 7 alphanumeric characters.
 */
export const GTM_ID_REGEX = /^GTM-[A-Z0-9]{7,}$/;

/**
 * GA4 Measurement ID format: G- followed by at least 8 alphanumeric characters.
 */
export const GA4_ID_REGEX = /^G-[A-Z0-9]{8,}$/;

const EnvSchema = z.object({
  NEXT_PUBLIC_GTM_CONTAINER_ID: z.string().optional(),
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const rawEnv = {
  NEXT_PUBLIC_GTM_CONTAINER_ID: process.env['NEXT_PUBLIC_GTM_CONTAINER_ID'],
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: process.env['NEXT_PUBLIC_GA4_MEASUREMENT_ID'],
  NODE_ENV: process.env['NODE_ENV'] || 'development',
};

const parsedEnv = EnvSchema.safeParse(rawEnv);

const data = parsedEnv.success
  ? parsedEnv.data
  : {
      NEXT_PUBLIC_GTM_CONTAINER_ID: undefined,
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: undefined,
      NODE_ENV: 'development' as const,
    };

function evaluateGtmStatus(id: string | undefined): TrackingStatus {
  if (!id || id.trim() === '') {
    return 'absent';
  }
  return GTM_ID_REGEX.test(id.trim()) ? 'configured' : 'invalid';
}

function evaluateGa4Status(id: string | undefined): TrackingStatus {
  if (!id || id.trim() === '') {
    return 'absent';
  }
  return GA4_ID_REGEX.test(id.trim()) ? 'configured' : 'invalid';
}

export const gtmStatus: TrackingStatus = evaluateGtmStatus(
  data.NEXT_PUBLIC_GTM_CONTAINER_ID
);

export const ga4Status: TrackingStatus = evaluateGa4Status(
  data.NEXT_PUBLIC_GA4_MEASUREMENT_ID
);

export const env = {
  gtmContainerId:
    gtmStatus === 'configured'
      ? data.NEXT_PUBLIC_GTM_CONTAINER_ID!.trim()
      : undefined,
  ga4MeasurementId:
    ga4Status === 'configured'
      ? data.NEXT_PUBLIC_GA4_MEASUREMENT_ID!.trim()
      : undefined,
  gtmStatus,
  ga4Status,
  nodeEnv: data.NODE_ENV,
  isDev: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  isProd: data.NODE_ENV === 'production',
} as const;
