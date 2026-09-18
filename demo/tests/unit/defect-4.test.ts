import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  buildDefect04AnalyticsPayload,
  buildExpectedDefect04Payload,
} from '@/lib/mappers/defect-04';
import { ANALYTICS_EVENT_NAME, assertNoPiiInPayload, UUID_REGEX } from '@/lib/contracts/events';
import { PayloadDiffViewer } from '@/components/ui/PayloadDiffViewer';
import { Defect4Form } from '@/components/forms/Defect4Form';

describe('Defect 4 Unit Test Suite', () => {
  beforeEach(() => {
    window.dataLayer = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Defect 04 Mapper Logic', () => {
    it('produces payload with missing form_id and mutated lead_type due to schema drift', () => {
      const mockUuid = '11111111-2222-4333-8444-555555555555';
      const actual = buildDefect04AnalyticsPayload({
        submissionId: mockUuid,
        attributionStatus: 'present',
        scenario: 'defect-4',
        form_id: 'lead_audit_demo', // Passed as snake_case, but mapper looks for camelCase formId!
      });

      // 1. form_id must be omitted/undefined
      expect('form_id' in actual).toBe(false);
      expect(actual.form_id).toBeUndefined();

      // 2. lead_type must be mutated to stale 'contact' value
      expect(actual.lead_type).toBe('contact');
      expect(actual.lead_type).not.toBe('agency_audit_inquiry');

      // 3. submission_id and event must remain intact
      expect(actual.submission_id).toBe(mockUuid);
      expect(actual.event).toBe(ANALYTICS_EVENT_NAME);
      expect(actual.scenario).toBe('defect-4');
      expect(actual.attribution_status).toBe('present');
      expect(actual.debug_mode).toBe(true);

      // 4. Zero PII in payload
      expect(() => assertNoPiiInPayload(actual as unknown as Record<string, unknown>)).not.toThrow();
    });

    it('buildExpectedDefect04Payload returns canonical payload with form_id and lead_type', () => {
      const mockUuid = '22222222-3333-4444-8555-666666666666';
      const expected = buildExpectedDefect04Payload({
        submissionId: mockUuid,
        attributionStatus: 'missing',
        scenario: 'defect-4',
      });

      expect(expected.form_id).toBe('lead_audit_demo');
      expect(expected.lead_type).toBe('agency_audit_inquiry');
      expect(expected.event).toBe(ANALYTICS_EVENT_NAME);
      expect(expected.submission_id).toBe(mockUuid);
    });
  });

  describe('PayloadDiffViewer UI Component', () => {
    it('renders side-by-side diff highlighting missing form_id and mutated lead_type', () => {
      const mockUuid = '33333333-4444-4555-8666-777777777777';
      const expected = buildExpectedDefect04Payload({
        submissionId: mockUuid,
        attributionStatus: 'present',
      });
      const actual = buildDefect04AnalyticsPayload({
        submissionId: mockUuid,
        attributionStatus: 'present',
        form_id: 'lead_audit_demo',
      });

      render(
        React.createElement(PayloadDiffViewer, {
          expectedPayload: expected as unknown as Record<string, unknown>,
          actualPayload: actual as unknown as Record<string, unknown>,
        })
      );

      // Check for component container
      expect(screen.getByTestId('payload-diff-viewer')).toBeDefined();

      // Check diff items
      const formIdDiff = screen.getByTestId('diff-form-id');
      expect(formIdDiff.textContent).toContain('MISSING (DROPPED)');

      const leadTypeDiff = screen.getByTestId('diff-lead-type');
      expect(leadTypeDiff.textContent).toContain('MUTATED (VALUE MISMATCH)');
      expect(leadTypeDiff.textContent).toContain('contact');

      // Check JSON representations
      expect(screen.getByTestId('expected-payload-json')).toBeDefined();
      expect(screen.getByTestId('actual-payload-json')).toBeDefined();
    });
  });

  describe('Defect4Form Client Validation & Invariants', () => {
    it('blocks submission and prevents network/analytics activity on invalid inputs', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      render(React.createElement(Defect4Form));

      const submitBtn = screen.getByRole('button', { name: /Request Integrity Audit/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Full name must be at least 2 characters/i)).toBeDefined();
        expect(screen.getByText(/A valid email address is required/i)).toBeDefined();
        expect(screen.getByText(/Company name is required/i)).toBeDefined();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer!).toHaveLength(0);
    });

    it('submits valid form, creates CRM lead, pushes mutated payload, and renders diff viewer', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (_url, options) => {
        const body = JSON.parse(options?.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            submission_id: body.submission_id,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            scenario: 'defect-4',
          }),
        } as unknown as Response;
      });

      render(React.createElement(Defect4Form));

      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'Jordan Hayes' },
      });
      fireEvent.change(screen.getByLabelText(/Work Email/i), {
        target: { value: 'jordan.hayes@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Agency \/ Company Name/i), {
        target: { value: 'Horizon Media Partners' },
      });

      const submitBtn = screen.getByRole('button', { name: /Request Integrity Audit/i });
      fireEvent.click(submitBtn);

      // Verify success container and PayloadDiffViewer render
      await waitFor(() => {
        expect(screen.getByTestId('defect-4-success-container')).toBeDefined();
        expect(screen.getByTestId('payload-diff-viewer')).toBeDefined();
      });

      // Verify network request
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callArgs = fetchSpy.mock.calls[0];
      const callHeaders = callArgs?.[1]?.headers as Record<string, string>;
      const callBody = JSON.parse(callArgs?.[1]?.body as string);

      expect(callHeaders['Idempotency-Key']).toBe(callBody.submission_id);
      expect(UUID_REGEX.test(callBody.submission_id)).toBe(true);
      expect(callBody.scenario).toBe('defect-4');

      // Verify mutated dataLayer push
      expect(window.dataLayer).toBeDefined();
      expect(window.dataLayer!).toHaveLength(1);
      const pushed = window.dataLayer![0] as Record<string, unknown>;

      expect(pushed.event).toBe('demo_lead_success');
      expect('form_id' in pushed).toBe(false);
      expect(pushed.lead_type).toBe('contact');
      expect(pushed.submission_id).toBe(callBody.submission_id);
      expect(pushed.debug_mode).toBe(true);

      // Zero PII
      expect(() => assertNoPiiInPayload(pushed)).not.toThrow();
    });
  });
});
