import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Defect5Form, extractAttributionFromSearch } from '@/components/forms/Defect5Form';
import { deriveAttributionStatus } from '@/lib/contracts/attribution';
import { defaultCrmFieldMap } from '@/lib/contracts/crm';
import type { LeadSubmissionPayload } from '@/lib/contracts/crm';

describe('Defect 5 Unit Tests: SPA Step Navigation Dropping Attribution', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Clear dataLayer
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];

    // Set initial URL via native window.history.replaceState
    window.history.replaceState(
      null,
      '',
      '/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001'
    );

    // Mock global fetch
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/leads') {
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              submission_id: '550e8400-e29b-41d4-a716-446655440000',
              status: 'confirmed',
              created_at: new Date().toISOString(),
              scenario: 'defect-5',
            }),
          };
        }
        if (url === '/api/crm') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              records: [
                {
                  submission_id: '550e8400-e29b-41d4-a716-446655440000',
                  scenario: 'defect-5',
                  full_name: 'Jane Doe',
                  work_email: 'demo.user@example.com',
                  company_name: 'Example Media Group',
                  lead_source: 'direct',
                  lead_source_detail: 'none',
                  campaign_name: 'none',
                  gclid: '',
                  mapping_status: 'valid',
                  missing_fields: [],
                },
              ],
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      })
    );
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.restoreAllMocks();
  });

  it('correctly extracts query parameters from search string', () => {
    const search = '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001';
    const parsed = extractAttributionFromSearch(search);
    expect(parsed.utm_source).toBe('google');
    expect(parsed.utm_medium).toBe('cpc');
    expect(parsed.utm_campaign).toBe('responselock_demo');
    expect(parsed.gclid).toBe('DEMO-GCLID-001');
  });

  it('captures entry attribution from initial landing URL search string', () => {
    render(
      React.createElement(Defect5Form, {
        initialSearch:
          '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001',
      })
    );

    const entryPanel = screen.getByTestId('inspection-at-entry');
    expect(entryPanel.textContent).toContain('google');
    expect(entryPanel.textContent).toContain('cpc');
    expect(entryPanel.textContent).toContain('responselock_demo');
    expect(entryPanel.textContent).toContain('DEMO-GCLID-001');
  });

  it('enforces validation in Step 1 before proceeding to Step 2', async () => {
    render(
      React.createElement(Defect5Form, {
        initialSearch:
          '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001',
      })
    );

    // Clear required fields
    const nameInput = screen.getByLabelText(/Full Name \*/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const proceedBtn = screen.getByTestId('proceed-to-step-2');
    fireEvent.click(proceedBtn);

    // Step 2 should not render; error message shown
    expect(screen.getByText(/Full name must be at least 2 characters/i)).toBeDefined();
    expect(screen.queryByLabelText(/Monthly Ad Spend \*/i)).toBeNull();
  });

  it('strips query parameters from URL search when proceeding to Step 2', async () => {
    render(
      React.createElement(Defect5Form, {
        initialSearch:
          '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001',
      })
    );

    const proceedBtn = screen.getByTestId('proceed-to-step-2');
    fireEvent.click(proceedBtn);

    // Step 2 controls should now be visible
    expect(screen.getByLabelText(/Monthly Ad Spend \*/i)).toBeDefined();

    // After navigation panel should show that parameters were stripped
    const afterNavPanel = screen.getByTestId('inspection-after-navigation');
    expect(afterNavPanel.textContent).toContain('Query String Stripped');
  });

  it('derives attribution_status as "dropped" when entry had UTMs but current search is empty', () => {
    const entryState = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'responselock_demo',
      gclid: 'DEMO-GCLID-001',
    };
    const currentState = {}; // Empty attribution after navigation

    const status = deriveAttributionStatus(currentState, entryState);
    expect(status).toBe('dropped');
  });

  it('submits payload with dropped attribution and fires dataLayer event with attribution_status: "dropped"', async () => {
    let capturedPayload: LeadSubmissionPayload | null = null;

    render(
      React.createElement(Defect5Form, {
        initialSearch:
          '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001',
        onSubmissionSuccess: ({ payload }: { payload: LeadSubmissionPayload }) => {
          capturedPayload = payload;
        },
      })
    );

    // 1. Proceed to Step 2
    fireEvent.click(screen.getByTestId('proceed-to-step-2'));

    // 2. Submit form in Step 2
    const submitBtn = screen.getByTestId('defect5-submit-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    // Verify submitted payload has dropped attribution status and empty attribution object
    expect(capturedPayload!.scenario).toBe('defect-5');
    expect(capturedPayload!.attribution_status).toBe('dropped');
    expect(capturedPayload!.attribution).toEqual({});

    // Verify dataLayer push
    const dataLayer = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer || [];
    const successEvent = dataLayer.find((evt) => evt.event === 'demo_lead_success');
    expect(successEvent).toBeDefined();
    expect(successEvent?.scenario).toBe('defect-5');
    expect(successEvent?.attribution_status).toBe('dropped');
    expect(successEvent?.debug_mode).toBe(true);
    expect(successEvent?.form_id).toBe('lead_audit_demo');

    // Verify zero PII in dataLayer
    expect(successEvent?.full_name).toBeUndefined();
    expect(successEvent?.email).toBeUndefined();
    expect(successEvent?.work_email).toBeUndefined();
    expect(successEvent?.phone).toBeUndefined();
  });

  it('verifies defaultCrmFieldMap assigns blank attribution ("direct" / "none") when attribution is dropped', () => {
    const droppedPayload: LeadSubmissionPayload = {
      submission_id: '550e8400-e29b-41d4-a716-446655440000',
      scenario: 'defect-5',
      full_name: 'Jane Doe',
      work_email: 'demo.user@example.com',
      company_name: 'Example Media Group',
      monthly_ad_spend: '$10k-$50k',
      attribution: {}, // dropped by SPA navigation
      attribution_status: 'dropped',
    };

    const crmRecord = defaultCrmFieldMap(droppedPayload, '2026-09-18T18:00:00.000Z');
    expect(crmRecord.lead_source).toBe('direct');
    expect(crmRecord.lead_source_detail).toBe('none');
    expect(crmRecord.campaign_name).toBe('none');
    expect(crmRecord.gclid).toBe('');
    expect(crmRecord.mapping_status).toBe('valid');
  });

  it('rejects submission when honeypot field is populated', async () => {
    render(
      React.createElement(Defect5Form, {
        initialSearch:
          '?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001',
      })
    );

    // Proceed to Step 2
    fireEvent.click(screen.getByTestId('proceed-to-step-2'));

    // Populate honeypot input
    const honeypot = screen.getByLabelText(/Website/i);
    fireEvent.change(honeypot, { target: { value: 'https://spam-bot.example.com' } });

    // Submit
    fireEvent.click(screen.getByTestId('defect5-submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/Submission rejected by security verification/i)).toBeDefined();
    });

    // Verify no fetch was made to /api/leads
    expect(fetch).not.toHaveBeenCalledWith('/api/leads', expect.anything());
  });
});
