// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: DataLayer payload schema drift after refactoring.

import { ANALYTICS_EVENT_NAME, ScenarioId } from '../contracts/events';
import { AttributionStatus } from '../contracts/attribution';

/**
 * Context input for Defect 4 dataLayer payload builders.
 * In a real application refactor, developers might change naming conventions
 * from snake_case (form_id) to camelCase (formId), or change default lead types.
 */
export interface Defect04PayloadContext {
  submissionId: string;
  attributionStatus: AttributionStatus;
  scenario?: ScenarioId;
  form_id?: string;
  formId?: string;
  lead_type?: string;
  leadType?: string;
}

/**
 * The canonical expected dataLayer payload structure.
 */
export interface ExpectedAnalyticsPayload {
  event: typeof ANALYTICS_EVENT_NAME;
  form_id: string;
  lead_type: string;
  scenario: ScenarioId;
  submission_id: string;
  attribution_status: AttributionStatus;
  debug_mode: true;
}

/**
 * The actual mutated dataLayer payload resulting from schema drift.
 * Notice form_id is dropped/absent and lead_type has a stale value.
 */
export interface Defect04ActualPayload {
  event: typeof ANALYTICS_EVENT_NAME;
  form_id?: string;
  lead_type: string;
  scenario: ScenarioId;
  submission_id: string;
  attribution_status: AttributionStatus;
  debug_mode: true;
}

/**
 * Builds the canonical expected payload for comparison in PayloadDiffViewer.
 */
export function buildExpectedDefect04Payload(
  context: Defect04PayloadContext
): ExpectedAnalyticsPayload {
  return {
    event: ANALYTICS_EVENT_NAME,
    form_id: 'lead_audit_demo',
    lead_type: 'agency_audit_inquiry',
    scenario: (context.scenario ?? 'defect-4') as ScenarioId,
    submission_id: context.submissionId,
    attribution_status: context.attributionStatus,
    debug_mode: true,
  };
}

/**
 * INTENTIONAL DEFECT MAPPER:
 * Payload builder reading from renamed keys (e.g. `formId` instead of `form_id`,
 * resolving `undefined` which gets dropped by JSON.stringify; setting `lead_type: 'contact'`
 * instead of 'agency_audit_inquiry'). `submission_id` is retained.
 */
export function buildDefect04AnalyticsPayload(
  context: Defect04PayloadContext
): Defect04ActualPayload {
  // Developer renamed internal parameter from form_id to formId, or this mapper reads from
  // context.formId which callers providing form_id do not supply, resolving to undefined.
  const resolvedFormId = context.formId; // undefined when caller supplies form_id

  // Schema drift sets stale/wrong lead_type 'contact' instead of canonical 'agency_audit_inquiry'
  const mutatedLeadType = 'contact';

  const rawObject: Record<string, unknown> = {
    event: ANALYTICS_EVENT_NAME,
    ...(resolvedFormId !== undefined ? { form_id: resolvedFormId } : {}),
    lead_type: mutatedLeadType,
    scenario: context.scenario ?? 'defect-4',
    submission_id: context.submissionId,
    attribution_status: context.attributionStatus,
    debug_mode: true,
  };

  // Simulating serialization through dataLayer: undefined fields are dropped completely
  return JSON.parse(JSON.stringify(rawObject)) as Defect04ActualPayload;
}
