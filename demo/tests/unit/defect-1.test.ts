import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { Defect1Form } from '@/components/forms/Defect1Form';
import {
  APPROVED_ANALYTICS_PAYLOAD_KEYS,
  UUID_REGEX,
  assertNoPiiInPayload,
  isApprovedAnalyticsPayload,
} from '@/lib/contracts/events';

describe('Defect 1 Unit Tests: Premature Conversion Click Trigger', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.dataLayer = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('contains the mandatory educational comment header in source code', () => {
    const filePath = path.resolve(
      __dirname,
      '../../src/components/forms/Defect1Form.tsx'
    );
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain(
      '// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: GTM Click-All Elements trigger bound to submit button before validation. Do not copy into production.'
    );
  });

  it('renders all required form controls and accessible attributes', () => {
    render(React.createElement(Defect1Form));

    expect(screen.getByLabelText(/full name/i)).toBeDefined();
    expect(screen.getByLabelText(/work email/i)).toBeDefined();
    expect(screen.getByLabelText(/company name/i)).toBeDefined();
    expect(screen.getByLabelText(/monthly ad spend/i)).toBeDefined();
    expect(screen.getByLabelText(/primary audit focus/i)).toBeDefined();
    expect(screen.getByLabelText(/phone number/i)).toBeDefined();
    expect(screen.getByLabelText(/audit context/i)).toBeDefined();

    const submitBtn = screen.getByRole('button', {
      name: /request conversion audit/i,
    });
    expect(submitBtn).toBeDefined();
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    // Honeypot field exists and is hidden
    const honeypot = screen.getByLabelText(/leave this field blank/i);
    expect(honeypot).toBeDefined();
    expect(honeypot.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('pushes demo_lead_success to window.dataLayer immediately on button click before validation', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    render(React.createElement(Defect1Form));

    const submitBtn = screen.getByRole('button', {
      name: /request conversion audit/i,
    });

    // Verify dataLayer is initially empty
    expect(window.dataLayer?.length).toBe(0);

    // User clicks submit button on completely blank/invalid form
    fireEvent.click(submitBtn);

    // DEFECT 1 INVARIANT: Conversion event is pushed to dataLayer on click!
    expect(window.dataLayer?.length).toBe(1);

    const pushed = window.dataLayer![0] as Record<string, unknown>;
    expect(pushed['event']).toBe('demo_lead_success');
    expect(pushed['scenario']).toBe('defect-1');
    expect(pushed['form_id']).toBe('lead_audit_demo');
    expect(pushed['lead_type']).toBe('agency_audit_inquiry');
    expect(pushed['debug_mode']).toBe(true);
    expect(typeof pushed['submission_id']).toBe('string');
    expect(UUID_REGEX.test(pushed['submission_id'] as string)).toBe(true);

    // Conforms strictly to contract whitelist and zero PII
    expect(isApprovedAnalyticsPayload(pushed)).toBe(true);
    expect(() => assertNoPiiInPayload(pushed)).not.toThrow();

    for (const key of Object.keys(pushed)) {
      expect(
        APPROVED_ANALYTICS_PAYLOAD_KEYS.includes(
          key as (typeof APPROVED_ANALYTICS_PAYLOAD_KEYS)[number]
        )
      ).toBe(true);
    }

    // Client validation fails -> Inline field errors are rendered
    await waitFor(() => {
      expect(
        screen.getByText(/full name must be at least 2 characters/i)
      ).toBeDefined();
      expect(screen.getByText(/work email is required/i)).toBeDefined();
      expect(screen.getByText(/company name is required/i)).toBeDefined();
    });

    // INVARIANT: Zero network requests are dispatched on invalid submission
    expect(fetchSpy).not.toHaveBeenCalled();

    // INVARIANT: No success UI is rendered
    expect(screen.queryByText(/audit request confirmed/i)).toBeNull();
  });

  it('wires accessible error messaging with aria-describedby and aria-invalid', async () => {
    render(React.createElement(Defect1Form));

    const submitBtn = screen.getByRole('button', {
      name: /request conversion audit/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(nameInput.getAttribute('aria-describedby')).toBe(
        'defect1-full_name-error'
      );

      const emailInput = screen.getByLabelText(/work email/i);
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput.getAttribute('aria-describedby')).toBe(
        'defect1-work_email-error'
      );
    });
  });

  it('submits successfully to /api/leads with Idempotency-Key when form is valid', async () => {
    const fakeSubmissionId = crypto.randomUUID();
    const mockSuccessResponse = {
      success: true,
      submission_id: fakeSubmissionId,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      scenario: 'defect-1',
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockSuccessResponse,
    });
    global.fetch = fetchSpy;

    render(React.createElement(Defect1Form));

    // Fill valid data
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Alex Morgan' },
    });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'alex.morgan@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Example Media Group' },
    });

    const submitBtn = screen.getByRole('button', {
      name: /request conversion audit/i,
    });
    fireEvent.click(submitBtn);

    // dataLayer gets 1 conversion event from click
    expect(window.dataLayer?.length).toBe(1);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const firstCall = fetchSpy.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [calledUrl, calledOptions] = firstCall!;
    expect(calledUrl).toBe('/api/leads');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers['Idempotency-Key']).toBeDefined();

    const parsedBody = JSON.parse(calledOptions.body);
    expect(parsedBody.scenario).toBe('defect-1');
    expect(parsedBody.full_name).toBe('Alex Morgan');
    expect(parsedBody.work_email).toBe('alex.morgan@example.com');
    expect(parsedBody.company_name).toBe('Example Media Group');

    // Verify Success UI renders from server response
    await waitFor(() => {
      expect(
        screen.getByText(/audit request confirmed \(server 201 created\)/i)
      ).toBeDefined();
      expect(screen.getByText(fakeSubmissionId)).toBeDefined();
    });

    // Invariant: No second conversion event is pushed post-201 in Defect 1
    expect(window.dataLayer?.length).toBe(1);
  });
});
