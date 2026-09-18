/**
 * ResponseLock Zod Schemas & Validation Contracts
 * Location: demo/src/lib/contracts/schema.ts
 *
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

import { z } from 'zod';

export const ScenarioIdSchema = z.enum([
  'baseline',
  'defect-1',
  'defect-2',
  'defect-3',
  'defect-4',
  'defect-5',
  'defect-6',
]);

export const AttributionStatusSchema = z.enum([
  'present',
  'partial',
  'missing',
  'dropped',
]);

export const AttributionParamsSchema = z.object({
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  gclid: z.string().optional(),
  gbraid: z.string().optional(),
  wbraid: z.string().optional(),
});

export const AttributionStateSchema = AttributionParamsSchema.extend({
  landing_page: z.string().optional(),
  referrer: z.string().optional(),
  first_touch_timestamp: z.number().optional(),
  last_touch_timestamp: z.number().optional(),
  attribution_status: AttributionStatusSchema.optional(),
});

/**
 * Server-side validation schema for POST /api/leads request body.
 */
export const LeadSubmissionPayloadSchema = z.object({
  submission_id: z.string().uuid({
    message: 'submission_id must be a valid UUID v4',
  }),
  scenario: ScenarioIdSchema,
  full_name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' }),
  work_email: z
    .string({ required_error: 'Work email is required' })
    .trim()
    .email({ message: 'A valid email address is required' })
    .max(100, { message: 'Work email must not exceed 100 characters' }),
  company_name: z
    .string({ required_error: 'Company name is required' })
    .trim()
    .min(2, { message: 'Company name is required' })
    .max(100, { message: 'Company name must not exceed 100 characters' }),
  monthly_ad_spend: z.string().optional().default(''),
  primary_challenge: z.string().optional().default(''),
  phone: z.string().trim().max(25).optional(),
  notes: z
    .string()
    .trim()
    .max(500, { message: 'Notes must not exceed 500 characters' })
    .optional(),
  website: z
    .string()
    .max(0, { message: 'Honeypot field must remain empty' })
    .optional()
    .or(z.literal('')),
  fax: z
    .string()
    .max(0, { message: 'Honeypot field must remain empty' })
    .optional()
    .or(z.literal('')),
  honeypot: z
    .string()
    .max(0, { message: 'Honeypot field must remain empty' })
    .optional()
    .or(z.literal('')),
  // Compatibility aliases
  fullName: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
  attribution: AttributionStateSchema.default({}),
  attribution_status: AttributionStatusSchema.default('missing'),
});

export const LeadSubmissionRequestSchema = LeadSubmissionPayloadSchema;

export type LeadSubmissionPayloadInput = z.infer<typeof LeadSubmissionPayloadSchema>;
export type LeadSubmissionRequest = LeadSubmissionPayloadInput;

/**
 * Field-level error record: { fieldName: ['Error 1', 'Error 2'] }.
 */
export type FieldErrors = Record<string, string[]>;

/**
 * Successful response schema from POST /api/leads (201 Created or 200 OK).
 */
export const LeadSubmissionResponseSuccessSchema = z.object({
  success: z.literal(true),
  submission_id: z.string().uuid(),
  status: z.literal('confirmed'),
  created_at: z.string(),
  scenario: ScenarioIdSchema.optional(),
  message: z.string().optional(),
  duplicate: z.boolean().optional(),
});

export type LeadSubmissionResponseSuccess = z.infer<
  typeof LeadSubmissionResponseSuccessSchema
>;

/**
 * Validation failure or error response schema from POST /api/leads (400 Bad Request).
 */
export const LeadSubmissionResponseErrorSchema = z.object({
  success: z.literal(false),
  errors: z.record(z.union([z.string(), z.array(z.string())])),
  message: z.string().optional(),
});

export type LeadSubmissionResponseError = z.infer<
  typeof LeadSubmissionResponseErrorSchema
>;
