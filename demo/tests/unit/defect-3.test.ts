import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LEGACY_MISSPELLED_EVENT } from '@/lib/stale-constants';
import { ANALYTICS_EVENT_NAME, assertNoPiiInPayload, UUID_REGEX } from '@/lib/contracts/events';
import { Defect3Form } from '@/components/forms/Defect3Form';

describe('Defect 3 Unit Test Suite', () => {
  beforeEach(() => {
    // Reset window.dataLayer
    window.dataLayer = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Stale Constants Module', () => {
    it('exports LEGACY_MISSPELLED_EVENT with the intentional single "s" spelling', () => {
      expect(LEGACY_MISSPELLED_EVENT).toBe('demo_lead_sucess');
    });

    it('diverges from canonical ANALYTICS_EVENT_NAME', () => {
      expect(LEGACY_MISSPELLED_EVENT).not.toBe(ANALYTICS_EVENT_NAME);
      expect(ANALYTICS_EVENT_NAME).toBe('demo_lead_success');
    });
  });

  describe('Defect3Form Client Validation & Invariants', () => {
    it('renders all required form controls with accessible labels', () => {
      render(React.createElement(Defect3Form));

      expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
      expect(screen.getByLabelText(/Work Email/i)).toBeDefined();
      expect(screen.getByLabelText(/Agency \/ Company Name/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Request Integrity Audit/i })).toBeDefined();
    });

    it('rejects invalid submissions without making any network calls or dataLayer pushes', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      render(React.createElement(Defect3Form));

      const submitBtn = screen.getByRole('button', { name: /Request Integrity Audit/i });
      fireEvent.click(submitBtn);

      // Verify inline validation errors
      await waitFor(() => {
        expect(screen.getByText(/Full name must be at least 2 characters/i)).toBeDefined();
        expect(screen.getByText(/A valid email address is required/i)).toBeDefined();
        expect(screen.getByText(/Company name is required/i)).toBeDefined();
      });

      // INVARIANT: Zero network requests on client validation failure
      expect(fetchSpy).not.toHaveBeenCalled();

      // INVARIANT: Zero dataLayer pushes on validation failure
      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer!).toHaveLength(0);
    });
  });

  describe('Defect 3 Successful Submission & Defect Manifestation', () => {
    it('submits valid form, sends Idempotency-Key header, and pushes LEGACY_MISSPELLED_EVENT', async () => {
      const mockSuccessResponse = {
        success: true,
        submission_id: '12345678-1234-4234-8234-1234567890ab',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        scenario: 'defect-3',
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (_url, options) => {
        const body = JSON.parse(options?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            ...mockSuccessResponse,
            submission_id: body.submission_id,
          }),
        } as unknown as Response;
      });

      render(React.createElement(Defect3Form));

      // Fill valid fictional lead data
      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'Alex Morgan' },
      });
      fireEvent.change(screen.getByLabelText(/Work Email/i), {
        target: { value: 'alex.morgan@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Agency \/ Company Name/i), {
        target: { value: 'Nexus Performance Marketing' },
      });

      const submitBtn = screen.getByRole('button', { name: /Request Integrity Audit/i });
      fireEvent.click(submitBtn);

      // Verify success UI
      await waitFor(() => {
        expect(screen.getByTestId('defect-3-success-container')).toBeDefined();
        expect(screen.getByText(/Lead Submitted Successfully/i)).toBeDefined();
      });

      // Verify fetch was called once with Idempotency-Key
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callArgs = fetchSpy.mock.calls[0];
      const callHeaders = callArgs?.[1]?.headers as Record<string, string>;
      const callBody = JSON.parse(callArgs?.[1]?.body as string);

      expect(callHeaders['Idempotency-Key']).toBe(callBody.submission_id);
      expect(UUID_REGEX.test(callBody.submission_id)).toBe(true);
      expect(callBody.scenario).toBe('defect-3');

      // VERIFY DEFECT 3 MECHANISM:
      // Exactly 1 event pushed to dataLayer, with event === LEGACY_MISSPELLED_EVENT ('demo_lead_sucess')
      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer!).toHaveLength(1);
      const pushedEvent = window.dataLayer![0] as Record<string, unknown>;

      expect(pushedEvent.event).toBe('demo_lead_sucess');
      expect(pushedEvent.event).not.toBe('demo_lead_success');
      expect(pushedEvent.scenario).toBe('defect-3');
      expect(pushedEvent.submission_id).toBe(callBody.submission_id);
      expect(pushedEvent.form_id).toBe('lead_audit_demo');
      expect(pushedEvent.lead_type).toBe('agency_audit_inquiry');
      expect(pushedEvent.debug_mode).toBe(true);

      // Verify zero PII in dataLayer
      expect(() => assertNoPiiInPayload(pushedEvent)).not.toThrow();
    });
  });
});
