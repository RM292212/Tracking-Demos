// INTENTIONAL DEFECT — EDUCATIONAL.
// Real-world analogue: Webhook field mapping misconfiguration where developer accidentally
// mapped UTM Source to Lead Source Detail and omitted Primary Source and Campaign.
// Do not copy into production.
import type { CrmFieldMapper, LeadSubmissionPayload, CrmFieldMapResult } from '../contracts/crm';

export const mapDefect06LeadToCrm: CrmFieldMapper = (payload: LeadSubmissionPayload): CrmFieldMapResult => {
  const attr = payload.attribution;
  return {
    lead_source: '', // Intentionally dropped
    lead_source_detail: attr?.utm_source || 'none', // Mismapped from source
    campaign_name: '', // Intentionally dropped
    gclid: attr?.gclid || '',
    mapping_status: 'corrupted',
    missing_fields: ['lead_source', 'campaign_name'],
  };
};
