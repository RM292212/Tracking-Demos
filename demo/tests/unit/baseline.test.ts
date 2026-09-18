/**
 * ResponseLock Unit Test Suite: Validation & Attribution Persistence
 * Location: demo/tests/unit/baseline.test.ts
 *
 * Tests the client-side validation engine and attribution persistence mechanics
 * supporting the Baseline Valid Form scenario.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateLeadFormFields,
  validateLeadSubmissionPayload,
  validateField,
} from '@/lib/validation';
import {
  parseAttributionFromQuery,
  captureAttribution,
  getPersistedAttribution,
  getAttributionForSubmission,
  getFirstTouchAttribution,
  getLastTouchAttribution,
  clearAllAttribution,
  setCookie,
  getCookie,
  deleteCookie,
  deriveAttributionStatus,
  hasAnyAttribution,
  ATTRIBUTION_STORAGE_KEYS,
} from '@/lib/attribution';
import type { LeadSubmissionRequest } from '@/lib/contracts/schema';

describe('Baseline Validation Engine', () => {
  const validFormInput = {
    full_name: 'Alex Morgan',
    work_email: 'demo.user@example.com',
    company_name: 'Apex Digital Marketing',
    monthly_ad_spend: '$20k-$50k',
    primary_challenge: 'Conversion Discrepancies',
    phone: '+1-555-0100',
    notes: 'Testing baseline form validation behavior.',
  };

  it('validates a complete, compliant form input successfully', () => {
    const result = validateLeadFormFields(validFormInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data).toBeDefined();
    expect(result.data?.full_name).toBe('Alex Morgan');
    expect(result.data?.work_email).toBe('demo.user@example.com');
    expect(result.data?.company_name).toBe('Apex Digital Marketing');
  });

  it('rejects form when full_name is missing or shorter than 2 characters', () => {
    const emptyResult = validateLeadFormFields({
      ...validFormInput,
      full_name: '',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.full_name).toBe('Full name is required');

    const shortResult = validateLeadFormFields({
      ...validFormInput,
      full_name: 'A',
    });
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors.full_name).toBe(
      'Full name must be at least 2 characters'
    );
  });

  it('rejects form when work_email is missing or invalid', () => {
    const emptyResult = validateLeadFormFields({
      ...validFormInput,
      work_email: '',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.work_email).toBe('Work email is required');

    const invalidEmails = [
      'not-an-email',
      'user@',
      '@example.com',
      'user@example',
      'user space@example.com',
    ];

    for (const badEmail of invalidEmails) {
      const res = validateLeadFormFields({
        ...validFormInput,
        work_email: badEmail,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.work_email).toBe('A valid email address is required');
    }
  });

  it('rejects form when company_name is missing or too short', () => {
    const emptyResult = validateLeadFormFields({
      ...validFormInput,
      company_name: '   ',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.company_name).toBe('Company name is required');

    const shortResult = validateLeadFormFields({
      ...validFormInput,
      company_name: 'C',
    });
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors.company_name).toBe('Company name is required');
  });

  it('enforces maximum character length constraints', () => {
    const longName = 'A'.repeat(101);
    const res = validateLeadFormFields({
      ...validFormInput,
      full_name: longName,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.full_name).toBe('Full name must not exceed 100 characters');

    const longNotes = 'X'.repeat(501);
    const resNotes = validateLeadFormFields({
      ...validFormInput,
      notes: longNotes,
    });
    expect(resNotes.isValid).toBe(false);
    expect(resNotes.errors.notes).toBe('Notes must not exceed 500 characters');
  });

  it('rejects submission immediately if honeypot fields are populated', () => {
    const botSubmissionWithWebsite = {
      ...validFormInput,
      website: 'https://spam-bot.example.org',
    };
    const res1 = validateLeadFormFields(botSubmissionWithWebsite);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.form).toContain('honeypot');

    const botSubmissionWithFax = {
      ...validFormInput,
      fax: '+1-555-0199',
    };
    const res2 = validateLeadFormFields(botSubmissionWithFax);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.form).toContain('honeypot');
  });

  it('allows single-field validation via validateField', () => {
    expect(validateField('full_name', 'Alex Morgan')).toBeNull();
    expect(validateField('full_name', '')).toBe('Full name is required');
    expect(validateField('work_email', 'demo.user@example.com')).toBeNull();
    expect(validateField('work_email', 'bademail')).toBe(
      'A valid email address is required'
    );
  });

  it('validates complete API payload via validateLeadSubmissionPayload', () => {
    const fullPayload: LeadSubmissionRequest = {
      submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      scenario: 'baseline',
      full_name: 'Jordan Lee',
      work_email: 'demo.user@example.com',
      company_name: 'Alpha Analytics',
      monthly_ad_spend: '$50k-$100k',
      primary_challenge: 'Attribution Loss',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
      },
      attribution_status: 'present',
    };

    const res = validateLeadSubmissionPayload(fullPayload);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});

    // Invalid UUID
    const badIdPayload = {
      ...fullPayload,
      submission_id: 'not-a-valid-uuid',
    };
    const badRes = validateLeadSubmissionPayload(badIdPayload);
    expect(badRes.isValid).toBe(false);
    expect(badRes.errors.submission_id).toBeDefined();
  });
});

describe('Baseline Attribution Persistence Engine', () => {
  beforeEach(() => {
    clearAllAttribution();
  });

  it('parses marketing query parameters accurately', () => {
    const query =
      '?utm_source=google&utm_medium=cpc&utm_campaign=audit_spring&utm_term=ga4_audit&utm_content=header_cta&gclid=TEST-GCLID-123';

    const params = parseAttributionFromQuery(query);
    expect(params.utm_source).toBe('google');
    expect(params.utm_medium).toBe('cpc');
    expect(params.utm_campaign).toBe('audit_spring');
    expect(params.utm_term).toBe('ga4_audit');
    expect(params.utm_content).toBe('header_cta');
    expect(params.gclid).toBe('TEST-GCLID-123');
  });

  it('handles empty or malformed query strings gracefully', () => {
    expect(parseAttributionFromQuery('')).toEqual({});
    expect(parseAttributionFromQuery('?other_param=123')).toEqual({});
    expect(parseAttributionFromQuery(null)).toEqual({});
  });

  it('stores and retrieves cookies with proper encoding', () => {
    setCookie('test_cookie', 'test value with spaces & symbols!');
    const retrieved = getCookie('test_cookie');
    expect(retrieved).toBe('test value with spaces & symbols!');

    deleteCookie('test_cookie');
    expect(getCookie('test_cookie')).toBeNull();
  });

  it('captures first-touch in cookie and last-touch in sessionStorage', () => {
    const initialQuery =
      '?utm_source=linkedin&utm_medium=paid-social&utm_campaign=brand_q1';

    const captured = captureAttribution(initialQuery);
    expect(captured).not.toBeNull();
    expect(captured?.utm_source).toBe('linkedin');
    expect(captured?.utm_medium).toBe('paid-social');

    // Verify first-touch cookie
    const firstTouch = getFirstTouchAttribution();
    expect(firstTouch).not.toBeNull();
    expect(firstTouch?.utm_source).toBe('linkedin');
    expect(firstTouch?.first_touch_timestamp).toBeDefined();

    // Verify last-touch sessionStorage
    const lastTouch = getLastTouchAttribution();
    expect(lastTouch).not.toBeNull();
    expect(lastTouch?.utm_source).toBe('linkedin');
  });

  it('preserves first-touch cookie on subsequent touches while updating last-touch', () => {
    // Touch 1: LinkedIn
    captureAttribution(
      '?utm_source=linkedin&utm_medium=paid-social&utm_campaign=spring'
    );
    const initialFirst = getFirstTouchAttribution();
    expect(initialFirst?.utm_source).toBe('linkedin');

    // Touch 2: Google Search with GCLID
    captureAttribution(
      '?utm_source=google&utm_medium=cpc&utm_campaign=retargeting&gclid=GCLID-999'
    );

    // First touch must NOT be overwritten
    const preservedFirst = getFirstTouchAttribution();
    expect(preservedFirst?.utm_source).toBe('linkedin');
    expect(preservedFirst?.first_touch_timestamp).toBe(
      initialFirst?.first_touch_timestamp
    );

    // Last touch must reflect the latest touch
    const updatedLast = getLastTouchAttribution();
    expect(updatedLast?.utm_source).toBe('google');
    expect(updatedLast?.gclid).toBe('GCLID-999');
  });

  it('derives correct attribution_status based on parameters', () => {
    // 1. Full UTM suite -> present
    expect(
      deriveAttributionStatus({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'demo',
      })
    ).toBe('present');

    // 2. Click ID provided (even without full UTMs) -> present
    expect(deriveAttributionStatus({ gclid: 'CLICK-123' })).toBe('present');
    expect(deriveAttributionStatus({ gbraid: 'GBRAID-123' })).toBe('present');
    expect(deriveAttributionStatus({ wbraid: 'WBRAID-123' })).toBe('present');

    // 3. Incomplete UTM parameters -> partial
    expect(deriveAttributionStatus({ utm_source: 'google' })).toBe('partial');
    expect(
      deriveAttributionStatus({ utm_source: 'google', utm_medium: 'cpc' })
    ).toBe('partial');

    // 4. No parameters -> missing
    expect(deriveAttributionStatus({})).toBe('missing');
    expect(deriveAttributionStatus(null)).toBe('missing');

    // 5. Defect 5 Condition: entry had attribution, but current has none -> dropped
    const entryState = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'demo',
      gclid: 'DEMO-GCLID',
    };
    expect(deriveAttributionStatus({}, entryState)).toBe('dropped');
    expect(deriveAttributionStatus(null, entryState)).toBe('dropped');
  });

  it('provides complete submission attribution payload via getAttributionForSubmission', () => {
    captureAttribution(
      '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001'
    );

    const submissionAttr = getAttributionForSubmission();
    expect(submissionAttr.attribution_status).toBe('present');
    expect(submissionAttr.attribution.utm_source).toBe('google');
    expect(submissionAttr.attribution.gclid).toBe('DEMO-GCLID-001');
  });
});
