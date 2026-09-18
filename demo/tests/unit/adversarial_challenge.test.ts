import { describe, it, expect } from 'vitest';
import {
  buildAnalyticsPayload,
  isApprovedAnalyticsPayload,
  assertNoPiiInPayload,
  APPROVED_ANALYTICS_PAYLOAD_KEYS,
  ANALYTICS_EVENT_NAME,
  LEGACY_MISSPELLED_EVENT,
} from '@/lib/contracts/events';
import {
  deriveAttributionStatus,
  hasAnyAttribution,
} from '@/lib/contracts/attribution';

describe('Adversarial Challenge - Contract Pack Runtime Assertions', () => {
  describe('buildAnalyticsPayload() key stripping and purity', () => {
    it('strips disallowed extra keys from payload', () => {
      const dirtyInput = {
        scenario: 'baseline' as const,
        submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        attributionStatus: 'present' as const,
        foo: 'bar',
        secret_token: 'xyz987',
        is_admin: true,
        extra_nested: { dangerous: true },
      };

      const result = buildAnalyticsPayload(dirtyInput as any);

      // Verify disallowed keys are stripped
      expect((result as any).foo).toBeUndefined();
      expect((result as any).secret_token).toBeUndefined();
      expect((result as any).is_admin).toBeUndefined();
      expect((result as any).extra_nested).toBeUndefined();

      // Verify only approved keys exist in output
      const keys = Object.keys(result);
      expect(keys.sort()).toEqual([...APPROVED_ANALYTICS_PAYLOAD_KEYS].sort());
      expect(isApprovedAnalyticsPayload(result)).toBe(true);
    });

    it('retains approved keys and default values', () => {
      const result = buildAnalyticsPayload({
        scenario: 'defect-1',
        submissionId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        attributionStatus: 'missing',
      });

      expect(result.event).toBe(ANALYTICS_EVENT_NAME);
      expect(result.form_id).toBe('lead_audit_demo');
      expect(result.lead_type).toBe('agency_audit_inquiry');
      expect(result.scenario).toBe('defect-1');
      expect(result.submission_id).toBe('c9bf9e57-1685-4c89-bafb-ff5af830be8a');
      expect(result.attribution_status).toBe('missing');
      expect(result.debug_mode).toBe(true);
    });

    it('allows intentional overrides for defect testing (event, form_id, lead_type)', () => {
      const result = buildAnalyticsPayload({
        scenario: 'defect-3',
        submissionId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        attributionStatus: 'present',
        overrideEventName: LEGACY_MISSPELLED_EVENT,
        overrideFormId: 'custom_form',
        overrideLeadType: 'contact',
      });

      expect(result.event).toBe('demo_lead_sucess');
      expect(result.form_id).toBe('custom_form');
      expect(result.lead_type).toBe('contact');
    });
  });

  describe('buildAnalyticsPayload() & assertNoPiiInPayload() PII rejection', () => {
    it('throws PII security error when submissionId contains an email', () => {
      expect(() => {
        buildAnalyticsPayload({
          scenario: 'baseline',
          submissionId: 'user.name+tag@example.com',
          attributionStatus: 'present',
        });
      }).toThrow(/PII VIOLATION.*Email address pattern detected/);
    });

    it('throws PII security error when overrideLeadType contains an email', () => {
      expect(() => {
        buildAnalyticsPayload({
          scenario: 'baseline',
          submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          attributionStatus: 'present',
          overrideLeadType: 'contact: audit.lead@example.com',
        });
      }).toThrow(/PII VIOLATION.*Email address pattern detected/);
    });

    it('throws PII security error when submissionId contains a phone number', () => {
      const testPhones = [
        '555-0100',
        '+1-555-0100',
        '555-0199',
      ];

      for (const phone of testPhones) {
        expect(() => {
          buildAnalyticsPayload({
            scenario: 'baseline',
            submissionId: phone,
            attributionStatus: 'present',
          });
        }).toThrow(/PII VIOLATION.*Phone number pattern detected/);
      }
    });

    it('assertNoPiiInPayload throws when payload key contains forbidden terms', () => {
      const forbiddenKeys = [
        'user_email',
        'contact_phone',
        'customer_name',
        'lead_name',
        'message_body',
        'internal_notes',
        'landing_url',
        'referrer_url',
      ];

      for (const key of forbiddenKeys) {
        expect(() => {
          assertNoPiiInPayload({
            event: 'demo_lead_success',
            [key]: 'benign_value',
          });
        }).toThrow(/violates ResponseLock zero-PII policy/);
      }
    });
  });

  describe('deriveAttributionStatus() edge case analysis', () => {
    it('handles empty cases (null, undefined, empty object)', () => {
      expect(deriveAttributionStatus(null)).toBe('missing');
      expect(deriveAttributionStatus(undefined)).toBe('missing');
      expect(deriveAttributionStatus({})).toBe('missing');
      expect(deriveAttributionStatus({}, null)).toBe('missing');
      expect(deriveAttributionStatus(null, {})).toBe('missing');
      expect(deriveAttributionStatus(undefined, undefined)).toBe('missing');
    });

    it('handles partial cases (incomplete UTM suite without click ID)', () => {
      // Single UTM parameters
      expect(deriveAttributionStatus({ utm_source: 'google' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_medium: 'cpc' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_campaign: 'brand' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_term: 'agency audit' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_content: 'banner_a' })).toBe('partial');

      // Pair of UTM parameters without the third
      expect(deriveAttributionStatus({ utm_source: 'google', utm_medium: 'cpc' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_source: 'google', utm_campaign: 'brand' })).toBe('partial');
      expect(deriveAttributionStatus({ utm_medium: 'cpc', utm_campaign: 'brand' })).toBe('partial');
    });

    it('handles present cases (complete UTM suite or click IDs)', () => {
      // Complete UTM trio
      expect(
        deriveAttributionStatus({
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'demo',
        })
      ).toBe('present');

      // Click IDs provide full paid-media attribution even without full UTMs
      expect(deriveAttributionStatus({ gclid: 'CjwKCAjw...' })).toBe('present');
      expect(deriveAttributionStatus({ gbraid: 'demo_gbraid' })).toBe('present');
      expect(deriveAttributionStatus({ wbraid: 'demo_wbraid' })).toBe('present');
    });

    it('handles dropped cases (entry had params, current has none)', () => {
      const fullEntry = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'demo_campaign',
        gclid: 'DEMO-GCLID-001',
      };

      // Current state lost attribution (Defect 5)
      expect(deriveAttributionStatus({}, fullEntry)).toBe('dropped');
      expect(deriveAttributionStatus(null, fullEntry)).toBe('dropped');
      expect(deriveAttributionStatus(undefined, fullEntry)).toBe('dropped');

      // Entry with even a single param that was completely lost is considered dropped
      expect(deriveAttributionStatus({}, { utm_source: 'google' })).toBe('dropped');
      expect(deriveAttributionStatus({}, { gclid: '123' })).toBe('dropped');
    });

    it('returns partial if current still has some params even if entry had more', () => {
      const fullEntry = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'demo_campaign',
      };
      // If current retained source, it is partial (not dropped, since current is not empty)
      expect(deriveAttributionStatus({ utm_source: 'google' }, fullEntry)).toBe('partial');
    });
  });
});
