/**
 * ResponseLock CRM Models & Mapping Interface Contract
 * Location: demo/src/lib/contracts/crm.ts
 *
 * FROZEN CONTRACT - DO NOT MODIFY OUTSIDE WAVE 0 ARCHITECTURE REVIEW.
 */

import { ScenarioId } from './events';
import { AttributionState, AttributionStatus } from './attribution';

/**
 * Canonical field names expected in CRM record storage.
 */
export const CANONICAL_CRM_FIELDS = [
  'lead_source',
  'lead_source_detail',
  'campaign_name',
  'gclid',
] as const;

export type CanonicalCrmField = typeof CANONICAL_CRM_FIELDS[number];

/**
 * Status indicator for CRM mapping integrity.
 */
export type CrmMappingStatus = 'valid' | 'mismapped' | 'corrupted' | 'incomplete';

/**
 * Payload sent from client form to POST /api/leads.
 */
export interface LeadSubmissionPayload {
  submission_id: string; // UUID v4 generated on client
  scenario: ScenarioId;
  full_name: string;
  work_email: string;
  company_name: string;
  monthly_ad_spend?: string;
  primary_challenge?: string;
  phone?: string;
  fullName?: string;
  email?: string;
  companyName?: string;
  notes?: string;
  website?: string; // Honeypot field
  fax?: string; // Honeypot field
  honeypot?: string; // Generic honeypot field
  attribution?: AttributionState;
  attribution_status?: AttributionStatus;
}

/**
 * Persisted CRM Record structure saved to demo/data/crm-records.jsonl.
 */
export interface CrmRecord {
  submission_id: string;
  scenario: ScenarioId;
  full_name: string;
  work_email: string;
  company_name: string;
  monthly_ad_spend?: string;
  primary_challenge?: string;
  phone?: string;
  notes?: string;
  created_at: string; // ISO 8601 UTC timestamp
  lead_source: string; // E.g., 'google', 'linkedin', 'direct'
  lead_source_detail: string; // E.g., 'cpc', 'paid-social', 'organic'
  campaign_name: string; // E.g., 'responselock_demo'
  gclid: string; // Google click identifier or empty string
  mapping_status: CrmMappingStatus;
  missing_fields: string[]; // List of omitted/corrupted field keys
  intentionally_missing_fields?: string[];
}

/**
 * Result returned by scenario field mappers.
 */
export interface CrmFieldMapResult {
  lead_source: string;
  lead_source_detail: string;
  campaign_name: string;
  gclid: string;
  mapping_status: CrmMappingStatus;
  missing_fields: string[];
}

/**
 * Mapper function transforming client payload to CRM fields.
 */
export type CrmFieldMapper = (payload: LeadSubmissionPayload) => CrmFieldMapResult;

/**
 * Full record mapper signature.
 */
export type CrmFieldMap = (
  payload: LeadSubmissionPayload,
  receivedAt: string
) => CrmRecord;

/**
 * Default canonical CRM field mapper (used by Baseline and Defects 1-5).
 */
export const defaultCrmFieldMap: CrmFieldMap = (
  payload: LeadSubmissionPayload,
  receivedAt: string
): CrmRecord => {
  const attribution = payload.attribution || {};
  const leadSource = attribution.utm_source || (attribution.gclid ? 'google' : 'direct');
  const leadSourceDetail = attribution.utm_medium || (attribution.gclid ? 'cpc' : 'none');
  const campaignName = attribution.utm_campaign || 'none';
  const gclid = attribution.gclid || '';

  return {
    submission_id: payload.submission_id,
    scenario: payload.scenario,
    full_name: payload.full_name || payload.fullName || '',
    work_email: payload.work_email || payload.email || '',
    company_name: payload.company_name || payload.companyName || '',
    monthly_ad_spend: payload.monthly_ad_spend || '',
    primary_challenge: payload.primary_challenge || '',
    phone: payload.phone || '',
    notes: payload.notes || '',
    created_at: receivedAt,
    lead_source: leadSource,
    lead_source_detail: leadSourceDetail,
    campaign_name: campaignName,
    gclid: gclid,
    mapping_status: 'valid',
    missing_fields: [],
    intentionally_missing_fields: [],
  };
};
