import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_EVENT_NAME,
  LEGACY_MISSPELLED_EVENT,
  APPROVED_ANALYTICS_PAYLOAD_KEYS,
  buildAnalyticsPayload,
  isApprovedAnalyticsPayload,
  assertNoPiiInPayload,
} from '@/lib/contracts/events';
import {
  deriveAttributionStatus,
  hasAnyAttribution,
} from '@/lib/contracts/attribution';
import {
  ROUTE_REGISTRY,
  getRouteByPath,
  getRouteByScenario,
} from '@/lib/contracts/routes';

describe('Contracts Pack Unit Tests', () => {
  describe('events.ts & dataLayer contract', () => {
    it('has canonical and legacy event constants', () => {
      expect(ANALYTICS_EVENT_NAME).toBe('demo_lead_success');
      expect(LEGACY_MISSPELLED_EVENT).toBe('demo_lead_sucess');
    });

    it('buildAnalyticsPayload outputs exactly the 7 approved keys', () => {
      const payload = buildAnalyticsPayload({
        scenario: 'baseline',
        submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        attributionStatus: 'present',
      });

      const keys = Object.keys(payload);
      expect(keys.sort()).toEqual([...APPROVED_ANALYTICS_PAYLOAD_KEYS].sort());
      expect(payload.event).toBe('demo_lead_success');
      expect(payload.form_id).toBe('lead_audit_demo');
      expect(payload.lead_type).toBe('agency_audit_inquiry');
      expect(payload.scenario).toBe('baseline');
      expect(payload.submission_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(payload.attribution_status).toBe('present');
      expect(payload.debug_mode).toBe(true);
    });

    it('assertNoPiiInPayload rejects email or phone patterns in payload values', () => {
      expect(() => {
        assertNoPiiInPayload({
          event: 'demo_lead_success',
          user_email: 'test@example.com',
        });
      }).toThrow(/PII VIOLATION/);

      expect(() => {
        assertNoPiiInPayload({
          event: 'demo_lead_success',
          custom_val: 'demo.user@example.com',
        });
      }).toThrow(/PII VIOLATION/);

      expect(() => {
        assertNoPiiInPayload({
          event: 'demo_lead_success',
          custom_val: '555-0100',
        });
      }).toThrow(/PII VIOLATION/);
    });

    it('isApprovedAnalyticsPayload correctly validates payload shape', () => {
      const valid = buildAnalyticsPayload({
        scenario: 'baseline',
        submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        attributionStatus: 'present',
      });
      expect(isApprovedAnalyticsPayload(valid)).toBe(true);

      expect(isApprovedAnalyticsPayload({ ...valid, extra_key: 'not_allowed' })).toBe(false);
      expect(isApprovedAnalyticsPayload(null)).toBe(false);
      expect(isApprovedAnalyticsPayload({})).toBe(false);
    });
  });

  describe('attribution.ts contract', () => {
    it('detects present attribution with full UTM or click ID', () => {
      expect(
        deriveAttributionStatus({
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'demo',
        })
      ).toBe('present');

      expect(
        deriveAttributionStatus({
          gclid: 'DEMO-GCLID',
        })
      ).toBe('present');
    });

    it('detects partial attribution when UTM suite is incomplete', () => {
      expect(
        deriveAttributionStatus({
          utm_source: 'google',
        })
      ).toBe('partial');
    });

    it('detects missing attribution when empty', () => {
      expect(deriveAttributionStatus(null)).toBe('missing');
      expect(deriveAttributionStatus({})).toBe('missing');
    });

    it('detects dropped attribution when entry had params but current has none (Defect 5)', () => {
      const entryState = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'demo',
      };
      const currentState = {};

      expect(deriveAttributionStatus(currentState, entryState)).toBe('dropped');
    });

    it('hasAnyAttribution returns false on empty/null and true on any parameter', () => {
      expect(hasAnyAttribution(undefined)).toBe(false);
      expect(hasAnyAttribution({})).toBe(false);
      expect(hasAnyAttribution({ utm_source: 'google' })).toBe(true);
    });
  });

  describe('routes.ts contract', () => {
    it('defines exactly 10 routes in the registry', () => {
      expect(ROUTE_REGISTRY).toHaveLength(10);
    });

    it('getRouteByPath and getRouteByScenario locate route definitions', () => {
      const baseline = getRouteByPath('/scenario/baseline');
      expect(baseline?.scenarioId).toBe('baseline');

      const defect1 = getRouteByScenario('defect-1');
      expect(defect1?.path).toBe('/scenario/defect-1');
    });
  });
});
