/**
 * Unit Tests for Simulated CRM Table and CRM Inspection Page
 * Location: demo/tests/unit/crm-ui.test.ts
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CrmTable } from '@/components/CrmTable';
import CrmPage from '@/app/crm/page';
import { CrmRecord } from '@/lib/contracts/crm';

const MOCK_RECORDS: CrmRecord[] = [
  {
    submission_id: '11111111-1111-4111-8111-111111111111',
    scenario: 'baseline',
    full_name: 'Alice Auditor',
    work_email: 'alice.auditor@example.com',
    company_name: 'Media Growth LLC',
    created_at: '2026-09-18T12:00:00.000Z',
    lead_source: 'google',
    lead_source_detail: 'cpc',
    campaign_name: 'responselock_demo',
    gclid: 'DEMO-GCLID-001',
    mapping_status: 'valid',
    missing_fields: [],
    intentionally_missing_fields: [],
  },
  {
    submission_id: '22222222-2222-4222-8222-222222222222',
    scenario: 'defect-6',
    full_name: 'Bob Broken',
    work_email: 'bob.broken@example.com',
    company_name: 'Corrupted CRM Inc',
    created_at: '2026-09-18T12:05:00.000Z',
    lead_source: '',
    lead_source_detail: 'google',
    campaign_name: '',
    gclid: '',
    mapping_status: 'mismapped',
    missing_fields: ['utm_campaign', 'lead_source'],
    intentionally_missing_fields: ['utm_campaign', 'lead_source'],
  },
  {
    submission_id: '33333333-3333-4333-8333-333333333333',
    scenario: 'defect-5',
    full_name: 'Charlie Ghost',
    work_email: 'charlie.ghost@example.com',
    company_name: 'Direct Traffic Co',
    created_at: '2026-09-18T12:10:00.000Z',
    lead_source: 'direct',
    lead_source_detail: 'none',
    campaign_name: 'none',
    gclid: '',
    mapping_status: 'incomplete',
    missing_fields: ['gclid'],
    intentionally_missing_fields: ['gclid'],
  },
];

describe('CrmTable Component', () => {
  it('renders all 10 mandated table column headers', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    const expectedHeaders = [
      '1. Submission ID',
      '2. Scenario',
      '3. Contact Values',
      '4. Created At',
      '5. lead_source',
      '6. lead_source_detail',
      '7. campaign_name',
      '8. gclid',
      '9. Mapping Status',
      '10. Intentionally Missing Fields',
    ];

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeDefined();
    });
  });

  it('renders record rows with proper values and contact details', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    // Alice
    expect(screen.getByText('Alice Auditor')).toBeDefined();
    expect(screen.getByText('alice.auditor@example.com')).toBeDefined();
    expect(screen.getByText('Media Growth LLC')).toBeDefined();
    expect(screen.getByText('responselock_demo')).toBeDefined();

    // Bob
    expect(screen.getByText('Bob Broken')).toBeDefined();
    expect(screen.getByText('bob.broken@example.com')).toBeDefined();
  });

  it('renders mapping status badges correctly', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    const validBadge = screen.getByTestId('mapping-badge-11111111-1111-4111-8111-111111111111');
    expect(validBadge.textContent).toBe('Valid');

    const mismappedBadge = screen.getByTestId('mapping-badge-22222222-2222-4222-8222-222222222222');
    expect(mismappedBadge.textContent).toBe('Mismapped');

    const incompleteBadge = screen.getByTestId('mapping-badge-33333333-3333-4333-8333-333333333333');
    expect(incompleteBadge.textContent).toBe('Incomplete');
  });

  it('displays intentionally missing fields chips or None (intact)', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    // Baseline record has no missing fields
    expect(screen.getByText('None (intact)')).toBeDefined();

    // Bob has missing fields
    expect(screen.getByText('utm_campaign')).toBeDefined();
    expect(screen.getByText('lead_source')).toBeDefined();
  });

  it('renders empty state message when records array is empty', () => {
    render(React.createElement(CrmTable, { records: [] }));

    const emptyState = screen.getByTestId('crm-empty-state');
    expect(emptyState).toBeDefined();
    expect(emptyState.textContent).toContain('No CRM records stored yet');
  });

  it('filters rows by scenario selection', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    const filterSelect = screen.getByTestId('crm-scenario-filter');
    fireEvent.change(filterSelect, { target: { value: 'defect-6' } });

    // Bob should be visible, Alice and Charlie should not
    expect(screen.getByText('Bob Broken')).toBeDefined();
    expect(screen.queryByText('Alice Auditor')).toBeNull();
    expect(screen.queryByText('Charlie Ghost')).toBeNull();
  });

  it('filters rows by search input', () => {
    render(React.createElement(CrmTable, { records: MOCK_RECORDS }));

    const searchInput = screen.getByTestId('crm-search-input');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice Auditor')).toBeDefined();
    expect(screen.queryByText('Bob Broken')).toBeNull();
  });
});

describe('CrmPage Component', () => {
  beforeEach(() => {
    // Mock global fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === '/api/crm') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              count: MOCK_RECORDS.length,
              records: MOCK_RECORDS,
            }),
          });
        }
        if (url === '/api/dev/reset' && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, message: 'CRM store reset' }),
          });
        }
        return Promise.reject(new Error(`Unhandled mock url: ${url}`));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the permanent simulated CRM warning banner verbatim', async () => {
    await act(async () => {
      render(React.createElement(CrmPage));
    });

    const banner = screen.getByTestId('crm-warning-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain(
      'This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records.'
    );
  });

  it('fetches records from /api/crm on mount and populates the table and summary stats', async () => {
    await act(async () => {
      render(React.createElement(CrmPage));
    });

    await waitFor(() => {
      expect(screen.getByTestId('crm-stat-total').textContent).toBe('3');
    });

    expect(screen.getByTestId('crm-stat-valid').textContent).toBe('1');
    expect(screen.getByTestId('crm-stat-issues').textContent).toBe('2');
    expect(screen.getByText('Alice Auditor')).toBeDefined();
  });

  it('calls /api/dev/reset when Reset CRM Store button is clicked and clears table', async () => {
    await act(async () => {
      render(React.createElement(CrmPage));
    });

    await waitFor(() => {
      expect(screen.getByTestId('crm-stat-total').textContent).toBe('3');
    });

    const resetBtn = screen.getByTestId('crm-reset-button');
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('crm-stat-total').textContent).toBe('0');
    });

    expect(screen.getByTestId('crm-empty-state')).toBeDefined();
    expect(screen.getByTestId('crm-feedback-message').textContent).toContain('cleared');
  });

  it('re-fetches /api/crm when Refresh button is clicked', async () => {
    await act(async () => {
      render(React.createElement(CrmPage));
    });

    await waitFor(() => {
      expect(screen.getByTestId('crm-stat-total').textContent).toBe('3');
    });

    const refreshBtn = screen.getByTestId('crm-refresh-button');
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    expect(fetch).toHaveBeenCalledWith('/api/crm', { cache: 'no-store' });
  });
});
