// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: Legacy analytics tracking snippet left behind during tag migration. Do not copy into production.

/**
 * ResponseLock Legacy Conversion Listener
 * Location: demo/src/lib/legacy-conversion-listener.ts
 *
 * Simulates an orphaned tracking snippet surviving from a previous vendor
 * or legacy tag implementation. Attaches directly to submit button click events
 * and pushes demo_lead_success to window.dataLayer regardless of modern handlers.
 */

import {
  buildAnalyticsPayload,
  type AnalyticsPayload,
} from './contracts/events';
import type { AttributionStatus } from './contracts/attribution';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export interface LegacyListenerOptions {
  getSubmissionId: () => string;
  getAttributionStatus?: () => AttributionStatus;
  onPushed?: (payload: AnalyticsPayload) => void;
}

/**
 * Directly pushes a legacy conversion event to window.dataLayer.
 */
export function pushLegacyConversion(
  submissionId: string,
  attributionStatus: AttributionStatus = 'missing',
  onPushed?: (payload: AnalyticsPayload) => void
): AnalyticsPayload {
  const payload = buildAnalyticsPayload({
    scenario: 'defect-2',
    submissionId,
    attributionStatus,
  });

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  if (onPushed) {
    onPushed(payload);
  }

  return payload;
}

/**
 * Attaches the legacy click listener to a specified submit button element.
 * Returns a cleanup function to unbind the listener.
 */
export function attachLegacyConversionListener(
  target: HTMLElement | null,
  options: LegacyListenerOptions
): () => void {
  if (!target) {
    return () => {};
  }

  const handleClick = (_event: MouseEvent): void => {
    // INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: Legacy analytics tracking snippet left behind during tag migration. Do not copy into production.
    const submissionId = options.getSubmissionId();
    const attributionStatus = options.getAttributionStatus
      ? options.getAttributionStatus()
      : 'missing';

    pushLegacyConversion(submissionId, attributionStatus, options.onPushed);
  };

  target.addEventListener('click', handleClick);

  return () => {
    target.removeEventListener('click', handleClick);
  };
}
