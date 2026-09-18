import type { ScenarioId } from '../contracts/events';
import type { CrmFieldMapper } from '../contracts/crm';
import { mapBaselineLeadToCrm } from './baseline';
import { mapDefect06LeadToCrm } from './defect-06';

export { mapBaselineLeadToCrm, mapDefect06LeadToCrm };

export function getCrmMapper(scenario: ScenarioId): CrmFieldMapper {
  if (scenario === 'defect-6') {
    return mapDefect06LeadToCrm;
  }
  return mapBaselineLeadToCrm;
}
