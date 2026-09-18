/**
 * Unit Tests for Observability Panel, Telemetry Sanitization, and Evidence Generation
 * Location: demo/tests/unit/observability.test.ts
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  ObservabilityPanel,
  OBSERVABILITY_DISCLAIMER,
  sanitizeText,
  sanitizePayload,
  sanitizeTimelineEntry,
  computeSummary,
  generateSanitizedManifest,
  generateSanitizedMarkdown,
  emitTimelineEvent,
} from '@/components/ObservabilityPanel';
import { TimelineEntry } from '@/lib/contracts/timeline';

describe('Observability Telemetry & PII Sanitization Logic', () => {
  describe('sanitizeText()', () => {
    it('redacts email addresses from string content', () => {
      const input = 'Lead received from auditor.lead@example.com during test run';
      const output = sanitizeText(input);
      expect(output).toBe('Lead received from [REDACTED_EMAIL] during test run');
      expect(output).not.toContain('auditor.lead@example.com');
    });

    it('redacts phone numbers from string content', () => {
      const input = 'Contact reached at +1-555-0199 or 555-0144 for verification';
      const output = sanitizeText(input);
      expect(output).toContain('[REDACTED_PHONE]');
      expect(output).not.toContain('555-0199');
      expect(output).not.toContain('555-0144');
    });

    it('leaves non-PII technical text untouched', () => {
      const input = 'POST /api/leads returned 201 Created with latency 420ms';
      expect(sanitizeText(input)).toBe(input);
    });
  });

  describe('sanitizePayload()', () => {
    it('redacts sensitive PII keys and values in single-level object', () => {
      const rawPayload = {
        submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scenario: 'baseline',
        full_name: 'John Doe',
        work_email: 'john.doe@example.com',
        phone: '+1-555-0100',
        company_name: 'Example Media Group',
        attribution_status: 'present',
      };

      const sanitized = sanitizePayload(rawPayload) as Record<string, unknown>;

      expect(sanitized['full_name']).toBe('[REDACTED_NAME]');
      expect(sanitized['work_email']).toBe('[REDACTED_EMAIL]');
      expect(sanitized['phone']).toBe('[REDACTED_PHONE]');
      expect(sanitized['submission_id']).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(sanitized['scenario']).toBe('baseline');
      expect(sanitized['attribution_status']).toBe('present');
    });

    it('recursively redacts nested objects and arrays', () => {
      const nested = {
        meta: {
          client: {
            name: 'Jane Smith',
            email: 'jane@example.org',
          },
          tags: ['audit', 'lead', 'phone: 555-0123'],
        },
        debug_mode: true,
        count: 42,
      };

      const sanitized = sanitizePayload(nested) as Record<string, unknown>;
      const client = (sanitized['meta'] as Record<string, unknown>)['client'] as Record<string, unknown>;

      expect(client['name']).toBe('[REDACTED_NAME]');
      expect(client['email']).toBe('[REDACTED_EMAIL]');
      expect(sanitized['debug_mode']).toBe(true);
      expect(sanitized['count']).toBe(42);
    });

    it('returns primitives safely', () => {
      expect(sanitizePayload(null)).toBeNull();
      expect(sanitizePayload(undefined)).toBeUndefined();
      expect(sanitizePayload(123)).toBe(123);
      expect(sanitizePayload(true)).toBe(true);
    });
  });

  describe('sanitizeTimelineEntry()', () => {
    it('sanitizes both label and payload of a TimelineEntry', () => {
      const entry: TimelineEntry = {
        id: 'evt-101',
        timestamp: 120,
        category: 'network',
        label: 'POST /api/leads by test.user@example.com',
        payload: {
          work_email: 'test.user@example.com',
          status: 201,
        },
      };

      const sanitized = sanitizeTimelineEntry(entry);
      expect(sanitized.id).toBe('evt-101');
      expect(sanitized.timestamp).toBe(120);
      expect(sanitized.label).toBe('POST /api/leads by [REDACTED_EMAIL]');
      expect(sanitized.payload?.['work_email']).toBe('[REDACTED_EMAIL]');
      expect(sanitized.payload?.['status']).toBe(201);
    });
  });

  describe('computeSummary()', () => {
    it('correctly aggregates counts across categories', () => {
      const entries: TimelineEntry[] = [
        { id: '1', timestamp: 10, category: 'lifecycle', label: 'Init' },
        { id: '2', timestamp: 20, category: 'analytics', label: 'Push demo_lead_success' },
        { id: '3', timestamp: 30, category: 'analytics', label: 'Push consent update' },
        { id: '4', timestamp: 40, category: 'network', label: 'POST /api/leads' },
        { id: '5', timestamp: 50, category: 'validation', label: 'Validation failed on email' },
        { id: '6', timestamp: 60, category: 'crm', label: 'Stored lead' },
      ];

      const summary = computeSummary(entries);
      expect(summary.totalEvents).toBe(6);
      expect(summary.dataLayerPushes).toBe(2);
      expect(summary.crmRequests).toBe(2); // 1 network /api/leads + 1 crm
      expect(summary.validationFailures).toBe(1);
    });
  });

  describe('generateSanitizedManifest()', () => {
    it('produces a valid SanitizedEvidenceManifest matching frozen contracts', () => {
      const entries: TimelineEntry[] = [
        {
          id: 'e1',
          timestamp: 50,
          category: 'analytics',
          label: 'dataLayer push for user@example.com',
          payload: { full_name: 'Alice Cooper', scenario: 'baseline' },
        },
      ];

      const manifest = generateSanitizedManifest('baseline', entries);

      expect(manifest.scenario).toBe('baseline');
      expect(manifest.disclaimer).toBe(
        'This manifest is a local educational record and is NOT equivalent to GTM Preview or GA4 DebugView.'
      );
      expect(new Date(manifest.exportedAt).toISOString()).toBe(manifest.exportedAt);
      expect(manifest.summary.totalEvents).toBe(1);
      expect(manifest.summary.dataLayerPushes).toBe(1);

      // Verify payload is sanitized
      expect(manifest.entries[0]?.label).toContain('[REDACTED_EMAIL]');
      expect(manifest.entries[0]?.payload?.['full_name']).toBe('[REDACTED_NAME]');
    });
  });

  describe('generateSanitizedMarkdown()', () => {
    it('produces formatted markdown with header, metrics, and event list', () => {
      const entries: TimelineEntry[] = [
        {
          id: 'evt-1',
          timestamp: 100,
          category: 'lifecycle',
          label: 'Scenario Initialized',
        },
        {
          id: 'evt-2',
          timestamp: 250,
          category: 'network',
          label: 'POST /api/leads',
          payload: { status: 201 },
        },
      ];

      const md = generateSanitizedMarkdown('defect-1', entries);

      expect(md).toContain('# ResponseLock Sanitized Evidence Summary');
      expect(md).toContain('**Scenario:** defect-1');
      expect(md).toContain('Total Events:** 2');
      expect(md).toContain('[+100ms] [LIFECYCLE] Scenario Initialized');
      expect(md).toContain('[+250ms] [NETWORK] POST /api/leads');
      expect(md).toContain('"status": 201');
    });
  });
});

describe('ObservabilityPanel React Component', () => {
  const mockEntries: TimelineEntry[] = [
    {
      id: 'evt-1',
      timestamp: 10,
      category: 'lifecycle',
      label: 'Scenario Mounted',
    },
    {
      id: 'evt-2',
      timestamp: 150,
      category: 'validation',
      label: 'Client validation passed',
    },
    {
      id: 'evt-3',
      timestamp: 450,
      category: 'network',
      label: 'POST /api/leads',
      payload: { submission_id: '12345', work_email: 'auditor@example.com' },
    },
    {
      id: 'evt-4',
      timestamp: 500,
      category: 'analytics',
      label: 'dataLayer push: demo_lead_success',
      payload: { event: 'demo_lead_success', debug_mode: true },
    },
  ];

  it('renders the mandatory observability disclaimer note verbatim', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    const disclaimer = screen.getByTestId('observability-disclaimer');
    expect(disclaimer).toBeDefined();
    expect(disclaimer.textContent).toContain(OBSERVABILITY_DISCLAIMER);
  });

  it('renders summary metrics strip with correct counts', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    expect(screen.getByText('4')).toBeDefined(); // Total events
    expect(screen.getByText('dataLayer Pushes')).toBeDefined();
    expect(screen.getByText('CRM Requests')).toBeDefined();
  });

  it('renders timeline entries with sanitized labels', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    expect(screen.getByText('Scenario Mounted')).toBeDefined();
    expect(screen.getByText('Client validation passed')).toBeDefined();
    expect(screen.getByText('POST /api/leads')).toBeDefined();
    expect(screen.getByText('dataLayer push: demo_lead_success')).toBeDefined();
  });

  it('expands and collapses formatted JSON payloads on demand', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    // Initially payload is not visible
    expect(screen.queryByTestId('payload-evt-3')).toBeNull();

    // Click "View JSON" on evt-3
    const toggleBtn = screen.getByRole('button', { name: /toggle payload for evt-3/i });
    fireEvent.click(toggleBtn);

    // Payload should now be visible and sanitized
    const payloadEl = screen.getByTestId('payload-evt-3');
    expect(payloadEl).toBeDefined();
    expect(payloadEl.textContent).toContain('[REDACTED_EMAIL]');
    expect(payloadEl.textContent).not.toContain('auditor@example.com');

    // Click again to hide
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId('payload-evt-3')).toBeNull();
  });

  it('filters entries when a category button is clicked', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    // Click 'analytics' filter button
    const analyticsBtn = screen.getByRole('button', { name: /analytics \(1\)/i });
    fireEvent.click(analyticsBtn);

    // Only analytics entry should remain
    expect(screen.getByText('dataLayer push: demo_lead_success')).toBeDefined();
    expect(screen.queryByText('Scenario Mounted')).toBeNull();
    expect(screen.queryByText('POST /api/leads')).toBeNull();

    // Click 'All' to restore
    const allBtn = screen.getByRole('button', { name: /all \(4\)/i });
    fireEvent.click(allBtn);
    expect(screen.getByText('Scenario Mounted')).toBeDefined();
  });

  it('renders copy and download action buttons', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline', entries: mockEntries }));

    expect(
      screen.getByRole('button', { name: /copy sanitized evidence summary/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /download sanitized json manifest/i })
    ).toBeDefined();
  });

  it('responds to global custom events when in uncontrolled mode', () => {
    render(React.createElement(ObservabilityPanel, { scenario: 'baseline' }));

    expect(screen.getByText(/no events recorded yet/i)).toBeDefined();

    act(() => {
      emitTimelineEvent({
        id: 'dyn-1',
        timestamp: 42,
        category: 'storage',
        label: 'Attribution saved to cookie',
      });
    });

    expect(screen.getByText('Attribution saved to cookie')).toBeDefined();
    expect(screen.getByText('+42ms')).toBeDefined();
  });

  it('handles clearing the timeline cleanly', () => {
    render(
      React.createElement(ObservabilityPanel, { scenario: 'baseline', initialEntries: mockEntries })
    );

    expect(screen.getByText('Scenario Mounted')).toBeDefined();

    const clearBtn = screen.getByRole('button', { name: /clear timeline/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText(/no events recorded yet/i)).toBeDefined();
  });
});
