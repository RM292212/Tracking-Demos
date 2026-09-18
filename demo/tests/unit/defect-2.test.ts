import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { Defect2Form } from '@/components/forms/Defect2Form';
import {
  attachLegacyConversionListener,
  pushLegacyConversion,
} from '@/lib/legacy-conversion-listener';
import {
  APPROVED_ANALYTICS_PAYLOAD_KEYS,
  UUID_REGEX,
  assertNoPiiInPayload,
  isApprovedAnalyticsPayload,
} from '@/lib/contracts/events';

describe('Defect 2 Unit Tests: Duplicate Conversion Tracking Snippet', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.dataLayer = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('contains the mandatory educational comment header in both source files', () => {
    const listenerPath = path.resolve(
      __dirname,
      '../../src/lib/legacy-conversion-listener.ts'
    );
    const formPath = path.resolve(
      __dirname,
      '../../src/components/forms/Defect2Form.tsx'
    );

    const listenerContent = fs.readFileSync(listenerPath, 'utf8');
    const formContent = fs.readFileSync(formPath, 'utf8');

    const expectedHeader =
      '// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: Legacy analytics tracking snippet left behind during tag migration. Do not copy into production.';

    expect(listenerContent).toContain(expectedHeader);
    expect(formContent).toContain(expectedHeader);
  });

  describe('Legacy Conversion Listener module unit behavior', () => {
    it('pushes demo_lead_success with scenario defect-2 when invoked', () => {
      const testId = crypto.randomUUID();
      const payload = pushLegacyConversion(testId, 'present');

      expect(payload.scenario).toBe('defect-2');
      expect(payload.submission_id).toBe(testId);
      expect(payload.attribution_status).toBe('present');
      expect(window.dataLayer?.length).toBe(1);
      expect(window.dataLayer![0]).toEqual(payload);
    });

    it('attaches to click event and unbinds cleanly', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const fixedId = crypto.randomUUID();
      const unbind = attachLegacyConversionListener(button, {
        getSubmissionId: () => fixedId,
      });

      // Click button -> triggers legacy push
      button.click();
      expect(window.dataLayer?.length).toBe(1);

      const event = window.dataLayer![0] as Record<string, unknown>;
      expect(event['scenario']).toBe('defect-2');
      expect(event['submission_id']).toBe(fixedId);

      // Unbind listener
      unbind();

      // Click again -> no further pushes
      button.click();
      expect(window.dataLayer?.length).toBe(1);

      document.body.removeChild(button);
    });
  });

  describe('Defect2Form Component Behavior', () => {
    it('renders all required controls and shows defect warning banner', () => {
      render(React.createElement(Defect2Form));

      expect(screen.getByLabelText(/full name/i)).toBeDefined();
      expect(screen.getByLabelText(/work email/i)).toBeDefined();
      expect(screen.getByLabelText(/company name/i)).toBeDefined();

      const submitBtn = screen.getByRole('button', {
        name: /request conversion audit/i,
      });
      expect(submitBtn).toBeDefined();

      // Verify educational defect banner exists
      expect(
        screen.getByText(/legacy conversion tracking snippet/i)
      ).toBeDefined();
    });

    it('DEFECT 2 INVARIANT: Submit button does NOT disable during flight', async () => {
      let resolveFetch!: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(delayedPromise);

      render(React.createElement(Defect2Form));

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Sam Rivera' },
      });
      fireEvent.change(screen.getByLabelText(/work email/i), {
        target: { value: 'sam.rivera@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/company name/i), {
        target: { value: 'Rivera Growth Agency' },
      });

      const submitBtn = screen.getByRole('button', {
        name: /request conversion audit/i,
      });

      // Click submit
      fireEvent.click(submitBtn);

      // Verify that WHILE request is in-flight, button remains NOT disabled!
      expect(submitBtn.hasAttribute('disabled')).toBe(false);
      expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
      expect(
        screen.getByText(/submitting lead \(flight in-progress\)/i)
      ).toBeDefined();

      // Resolve the delayed fetch to clean up
      await act(async () => {
        resolveFetch({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            submission_id: crypto.randomUUID(),
            status: 'confirmed',
            created_at: new Date().toISOString(),
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/1 crm record saved/i)).toBeDefined();
      });
    });

    it('DEFECT 2 INVARIANT: Produces exactly 2 dataLayer events with IDENTICAL submission_id on valid submission', async () => {
      let capturedSubmissionId = '';

      const fetchSpy = vi.fn().mockImplementation(async (_url, options) => {
        const body = JSON.parse(options.body);
        capturedSubmissionId = body.submission_id;

        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            submission_id: capturedSubmissionId,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            scenario: 'defect-2',
          }),
        };
      });
      global.fetch = fetchSpy;

      render(React.createElement(Defect2Form));

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Taylor Jordan' },
      });
      fireEvent.change(screen.getByLabelText(/work email/i), {
        target: { value: 'taylor.jordan@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/company name/i), {
        target: { value: 'Jordan & Partners' },
      });

      const submitBtn = screen.getByRole('button', {
        name: /request conversion audit/i,
      });

      // 1. User clicks submit button
      fireEvent.click(submitBtn);

      // At this point, the legacy listener has fired upon click!
      expect(window.dataLayer?.length).toBe(1);
      const firstEvent = window.dataLayer![0] as Record<string, unknown>;
      expect(firstEvent['event']).toBe('demo_lead_success');
      expect(firstEvent['scenario']).toBe('defect-2');

      // Wait for the API promise to resolve and the modern listener to fire post-201
      await waitFor(() => {
        expect(screen.getByText(/1 crm record saved/i)).toBeDefined();
      });

      // 2. Modern listener has fired upon 201 Created confirmation
      // Total dataLayer events MUST BE EXACTLY 2!
      expect(window.dataLayer?.length).toBe(2);

      const secondEvent = window.dataLayer![1] as Record<string, unknown>;
      expect(secondEvent['event']).toBe('demo_lead_success');
      expect(secondEvent['scenario']).toBe('defect-2');

      // CRUCIAL INVARIANT: Both events share the EXACT SAME submission_id!
      expect(firstEvent['submission_id']).toBe(secondEvent['submission_id']);
      expect(firstEvent['submission_id']).toBe(capturedSubmissionId);
      expect(UUID_REGEX.test(firstEvent['submission_id'] as string)).toBe(true);

      // Verify contract compliance and zero PII
      expect(isApprovedAnalyticsPayload(firstEvent)).toBe(true);
      expect(isApprovedAnalyticsPayload(secondEvent)).toBe(true);
      expect(() => assertNoPiiInPayload(firstEvent)).not.toThrow();
      expect(() => assertNoPiiInPayload(secondEvent)).not.toThrow();

      for (const key of Object.keys(firstEvent)) {
        expect(
          APPROVED_ANALYTICS_PAYLOAD_KEYS.includes(
            key as (typeof APPROVED_ANALYTICS_PAYLOAD_KEYS)[number]
          )
        ).toBe(true);
      }
      for (const key of Object.keys(secondEvent)) {
        expect(
          APPROVED_ANALYTICS_PAYLOAD_KEYS.includes(
            key as (typeof APPROVED_ANALYTICS_PAYLOAD_KEYS)[number]
          )
        ).toBe(true);
      }

      // Verify fetch was called with matching Idempotency-Key
      const firstCall = fetchSpy.mock.calls[0];
      expect(firstCall).toBeDefined();
      const callHeaders = (firstCall![1] as RequestInit).headers as Record<string, string>;
      expect(callHeaders['Idempotency-Key']).toBe(firstEvent['submission_id']);
    });
  });
});
