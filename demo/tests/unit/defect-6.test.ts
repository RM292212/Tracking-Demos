import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Defect6Form } from '@/components/forms/Defect6Form';
import { mapDefect06LeadToCrm } from '@/lib/mappers/defect-06';
import type { LeadSubmissionPayload, CrmRecord } from '@/lib/contracts/crm';

describe('Defect 6 Unit Tests: CRM Mapper Misconfiguration Dropping Campaign & Source', () => {
  beforeEach(() => {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];

    // Mock global fetch for API calls
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/leads') {
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              submission_id: '660e8400-e29b-41d4-a716-446655440000',
              status: 'confirmed',
              created_at: new Date().toISOString(),
              scenario: 'defect-6',
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
                  submission_id: '660e8400-e29b-41d4-a716-446655440000',
                  scenario: 'defect-6',
                  full_name: 'Jane Doe',
                  work_email: 'demo.user@example.com',
                  company_name: 'Example Media Group',
                  lead_source: '', // Intentionally dropped
                  lead_source_detail: 'google', // Mismapped from source
                  campaign_name: '', // Intentionally dropped
                  gclid: 'DEMO-GCLID-001',
                  mapping_status: 'corrupted',
                  missing_fields: ['lead_source', 'campaign_name'],
                } as CrmRecord,
              ],
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies mapDefect06LeadToCrm reproduces the exact CRM misconfiguration', () => {
    const validClientPayload: LeadSubmissionPayload = {
      submission_id: '660e8400-e29b-41d4-a716-446655440000',
      scenario: 'defect-6',
      full_name: 'Jane Doe',
      work_email: 'demo.user@example.com',
      company_name: 'Example Media Group',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
      },
      attribution_status: 'present',
    };

    const crmResult = mapDefect06LeadToCrm(validClientPayload);

    // Assert the 3 specific corruption properties:
    // 1. lead_source is dropped (empty string)
    expect(crmResult.lead_source).toBe('');
    // 2. lead_source_detail gets utm_source ('google') instead of utm_medium ('cpc')
    expect(crmResult.lead_source_detail).toBe('google');
    // 3. campaign_name is dropped (empty string)
    expect(crmResult.campaign_name).toBe('');
    // 4. gclid is preserved
    expect(crmResult.gclid).toBe('DEMO-GCLID-001');
    // 5. mapping_status is marked 'corrupted' with missing_fields
    expect(crmResult.mapping_status).toBe('corrupted');
    expect(crmResult.missing_fields).toEqual(['lead_source', 'campaign_name']);
  });

  it('renders form with default valid attribution indicators', () => {
    render(React.createElement(Defect6Form));

    expect(screen.getByText(/Audit Request with Valid Campaign Attribution/i)).toBeDefined();
    expect(screen.getByText(/utm_source=google/i)).toBeDefined();
    expect(screen.getByText(/gclid=DEMO-GCLID-001/i)).toBeDefined();
  });

  it('validates required fields before allowing submission', async () => {
    render(React.createElement(Defect6Form));

    // Clear required name input
    const nameInput = screen.getByLabelText(/Full Name \*/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByTestId('defect6-submit-button');
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Full name must be at least 2 characters/i)).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits valid payload and pushes demo_lead_success with status: "present"', async () => {
    let capturedPayload: LeadSubmissionPayload | null = null;

    render(
      React.createElement(Defect6Form, {
        onSubmissionSuccess: ({ payload }: { payload: LeadSubmissionPayload }) => {
          capturedPayload = payload;
        },
      })
    );

    const submitBtn = screen.getByTestId('defect6-submit-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    // Verify client submitted intact attribution
    expect(capturedPayload!.scenario).toBe('defect-6');
    expect(capturedPayload!.attribution_status).toBe('present');
    expect(capturedPayload!.attribution?.utm_source).toBe('google');
    expect(capturedPayload!.attribution?.utm_medium).toBe('cpc');
    expect(capturedPayload!.attribution?.utm_campaign).toBe('responselock_demo');
    expect(capturedPayload!.attribution?.gclid).toBe('DEMO-GCLID-001');

    // Verify dataLayer push reflects 'present' conversion (marketing view is healthy)
    const dataLayer = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer || [];
    const successEvent = dataLayer.find((evt) => evt.event === 'demo_lead_success');
    expect(successEvent).toBeDefined();
    expect(successEvent?.scenario).toBe('defect-6');
    expect(successEvent?.attribution_status).toBe('present');
    expect(successEvent?.debug_mode).toBe(true);

    // Verify zero PII
    expect(successEvent?.full_name).toBeUndefined();
    expect(successEvent?.work_email).toBeUndefined();
  });

  it('renders comparison table highlighting corrupted CRM fields vs client payload', async () => {
    render(React.createElement(Defect6Form));

    const submitBtn = screen.getByTestId('defect6-submit-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('crm-comparison-table')).toBeDefined();
    });

    const table = screen.getByTestId('crm-comparison-table');
    // Confirm presence of discrepancy markers
    expect(table.textContent).toContain('DROPPED');
    expect(table.textContent).toContain('MISMAPPED');
    expect(table.textContent).toContain('CORRUPTED');
    expect(table.textContent).toContain('INTACT');
  });

  it('rejects submission when honeypot field is filled', async () => {
    render(React.createElement(Defect6Form));

    const honeypot = screen.getByLabelText(/Website/i);
    fireEvent.change(honeypot, { target: { value: 'https://spam-bot.example.com' } });

    const submitBtn = screen.getByTestId('defect6-submit-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Submission rejected by security verification/i)).toBeDefined();
    });

    expect(fetch).not.toHaveBeenCalledWith('/api/leads', expect.anything());
  });
});
