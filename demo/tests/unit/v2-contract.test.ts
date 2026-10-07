import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildV2LeadSuccessPayload,
  countV2CanonicalEvents,
  sanitizeV2Attribution,
  V2_CANONICAL_EVENT,
  V2_FORM_ID,
} from '@/lib/v2-events';
import {
  getV2PendingRequest,
  getV2RetrySubmissionId,
  markV2EventEmitted,
  setV2PendingRequest,
  setV2RetrySubmissionId,
  wasV2EventEmitted,
} from '@/lib/v2-dedupe';

describe('Alder V2 analytics contract', () => {
  it('keeps only approved, safe attribution tokens and permits opaque GCLIDs', () => {
    expect(
      sanitizeV2Attribution({
        utm_source: '  partner_site  ',
        utm_medium: 'paid-search',
        utm_campaign: 'fall_2026',
        utm_term: 'enterprise-tools',
        utm_content: 'sidebar.1',
        gclid: 'AbCdEf0123456789XYZ',
        email: 'person@example.com',
        utm_extra: 'not-allowlisted',
        utm_source_url: 'https://example.test/path',
        utm_campaign_phone: '555-010-1234',
        utm_term_digits: Array.from({ length: 10 }, (_, digit) => digit).join(''),
        utm_content_long: 'x'.repeat(81),
      })
    ).toEqual({
      utm_source: 'partner_site',
      utm_medium: 'paid-search',
      utm_campaign: 'fall_2026',
      utm_term: 'enterprise-tools',
      utm_content: 'sidebar.1',
      gclid: 'AbCdEf0123456789XYZ',
    });
  });

  it('builds the fixed Alder success payload with empty values for absent attribution', () => {
    const payload = buildV2LeadSuccessPayload({
      submissionId: 'c7a829e0-81f3-4d43-9821-2a62886f4a10',
      attributionStatus: 'missing',
      attribution: { utm_source: 'newsletter' },
      timestamp: '2026-10-08T00:00:00.000Z',
    });

    expect(payload).toEqual({
      event: 'demo_lead_success',
      form_id: 'alder_consultation',
      lead_type: 'consultation',
      scenario: 'baseline',
      submission_id: 'c7a829e0-81f3-4d43-9821-2a62886f4a10',
      attribution_status: 'missing',
      debug_mode: true,
      timestamp: '2026-10-08T00:00:00.000Z',
      utm_source: 'newsletter',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      gclid: '',
    });
    expect(Object.keys(payload)).toHaveLength(14);
    expect(JSON.stringify(payload)).not.toMatch(/email|phone|name|url/i);
  });

  it('counts only canonical Alder V2 success events', () => {
    expect(
      countV2CanonicalEvents([
        { event: V2_CANONICAL_EVENT, form_id: V2_FORM_ID },
        { event: V2_CANONICAL_EVENT, form_id: 'lead_audit_demo' },
        { event: 'other_event', form_id: V2_FORM_ID },
        null,
        'demo_lead_success',
      ])
    ).toBe(1);
    expect(countV2CanonicalEvents(undefined)).toBe(0);
  });
});

describe('Alder V2 retry and event deduplication storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('remembers emitted submission IDs and does not store duplicates', () => {
    expect(wasV2EventEmitted('submission-1')).toBe(false);
    markV2EventEmitted('submission-1');
    markV2EventEmitted('submission-1');
    expect(wasV2EventEmitted('submission-1')).toBe(true);
    expect(JSON.parse(sessionStorage.getItem('responselock_v2_emitted_submission_ids') ?? '[]')).toEqual(['submission-1']);
  });

  it('keeps an in-memory emitted-ID guard if session storage rejects a write', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable');
    });
    markV2EventEmitted('memory-only-id');
    expect(wasV2EventEmitted('memory-only-id')).toBe(true);
    write.mockRestore();
  });

  it('persists and clears the retry submission ID', () => {
    expect(getV2RetrySubmissionId()).toBeNull();
    setV2RetrySubmissionId('retry-id');
    expect(getV2RetrySubmissionId()).toBe('retry-id');
    setV2RetrySubmissionId(null);
    expect(getV2RetrySubmissionId()).toBeNull();
  });

  it('persists the full pending retry payload and clears it after completion or cancel', () => {
    const pending = { submission_id: 'pending-id', full_name: 'Jordan Lee', work_email: 'jordan.lee@example.com' };
    setV2PendingRequest(pending);
    expect(getV2PendingRequest()).toEqual(pending);
    setV2PendingRequest(null);
    expect(getV2PendingRequest()).toBeNull();
  });
});
