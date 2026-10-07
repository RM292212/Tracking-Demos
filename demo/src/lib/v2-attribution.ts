import { deriveAttributionStatus, type AttributionState } from '@/lib/contracts/attribution';
import { getFirstTouchAttribution, getLastTouchAttribution } from '@/lib/attribution';
import { sanitizeV2Attribution } from '@/lib/v2-events';

/** Use one intact touch so a newer partial campaign cannot inherit stale IDs. */
export function getV2AttributionForSubmission(): {
  attribution: AttributionState;
  safeAttribution: ReturnType<typeof sanitizeV2Attribution>;
  attribution_status: ReturnType<typeof deriveAttributionStatus>;
} {
  const firstTouch = getFirstTouchAttribution();
  const lastTouch = getLastTouchAttribution();
  const selected = lastTouch ?? firstTouch ?? {};
  const safeAttribution = sanitizeV2Attribution(selected as Record<string, unknown>);
  const attribution = { ...safeAttribution };
  return {
    attribution,
    safeAttribution,
    attribution_status: deriveAttributionStatus(attribution, firstTouch),
  };
}
