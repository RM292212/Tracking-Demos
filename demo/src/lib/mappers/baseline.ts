import type { CrmFieldMapper, LeadSubmissionPayload, CrmFieldMapResult } from '../contracts/crm';

export const mapBaselineLeadToCrm: CrmFieldMapper = (payload: LeadSubmissionPayload): CrmFieldMapResult => {
  const attr = payload.attribution;
  return {
    lead_source: attr?.utm_source || (attr?.gclid ? 'google' : 'direct'),
    lead_source_detail: attr?.utm_medium || (attr?.gclid ? 'cpc' : 'none'),
    campaign_name: attr?.utm_campaign || 'none',
    gclid: attr?.gclid || '',
    mapping_status: 'valid',
    missing_fields: [],
  };
};
