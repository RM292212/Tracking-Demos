'use client';

/**
 * ResponseLock Simulated CRM Viewer Page
 * Location: demo/src/app/crm/page.tsx
 *
 * Implements:
 * 1. Permanent warning disclaimer banner.
 * 2. Fetches stored CRM records from GET /api/crm.
 * 3. Renders 10-column CrmTable component.
 * 4. Dev-guarded "Reset CRM Store" button calling POST /api/dev/reset.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CrmRecord } from '@/lib/contracts/crm';
import { getRouteByPath } from '@/lib/contracts/routes';
import { CrmTable } from '@/components/CrmTable';

const CRM_DISCLAIMER_TEXT =
  'This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records.' as const;

export default function CrmPage(): React.ReactElement {
  const route = getRouteByPath('/crm');
  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fetch records from GET /api/crm
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crm', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch CRM records: HTTP ${res.status}`);
      }
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading CRM records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Dev-guarded reset action calling POST /api/dev/reset
  const handleResetCrm = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch('/api/dev/reset', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Reset failed: HTTP ${res.status}`);
      }
      setRecords([]);
      setFeedbackMessage('CRM records successfully cleared.');
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      setFeedbackMessage(
        err instanceof Error ? `Error: ${err.message}` : 'Failed to reset CRM store'
      );
    } finally {
      setIsResetting(false);
    }
  }, [isResetting]);

  // Compute stats
  const validCount = records.filter((r) => r.mapping_status === 'valid').length;
  const issueCount = records.filter((r) => r.mapping_status !== 'valid').length;

  return (
    <section
      className="crm-page"
      data-testid="crm-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* 1. Permanent Warning Banner Mandated by Spec */}
      <aside
        role="alert"
        aria-label="Simulated CRM Notice"
        data-testid="crm-warning-banner"
        style={{
          backgroundColor: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)',
          borderLeft: '5px solid var(--color-warning-border)',
          color: 'var(--color-warning-text)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        <strong>Notice:</strong> {CRM_DISCLAIMER_TEXT}
      </aside>

      {/* Page Header and Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {route?.title ?? 'Simulated CRM Viewer'}
          </h1>
          <p
            style={{
              marginTop: 'var(--space-1)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {route?.description ??
              'Local inspection table for stored JSONL CRM records and mapping integrity.'}
          </p>
        </div>

        {/* Actions: Refresh & Reset Store */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={fetchRecords}
            disabled={isLoading}
            aria-label="Refresh CRM Records"
            data-testid="crm-refresh-button"
            style={{
              backgroundColor: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={handleResetCrm}
            disabled={isResetting}
            aria-label="Reset CRM Store"
            data-testid="crm-reset-button"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              color: 'var(--color-error-text)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: isResetting ? 'not-allowed' : 'pointer',
            }}
          >
            {isResetting ? 'Resetting Store...' : 'Reset CRM Store'}
          </button>
        </div>
      </div>

      {/* Feedback Message Toast / Alert */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          data-testid="crm-feedback-message"
          style={{
            backgroundColor: feedbackMessage.startsWith('Error')
              ? 'var(--color-error-bg)'
              : 'var(--color-success-bg)',
            border: `1px solid ${
              feedbackMessage.startsWith('Error')
                ? 'var(--color-error-border)'
                : 'var(--color-success-border)'
            }`,
            color: feedbackMessage.startsWith('Error')
              ? 'var(--color-error-text)'
              : 'var(--color-success-text)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Total Ingested Leads
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginTop: '4px',
            }}
            data-testid="crm-stat-total"
          >
            {records.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Valid Mappings
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-success-text)',
              marginTop: '4px',
            }}
            data-testid="crm-stat-valid"
          >
            {validCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Mapping Defects / Incomplete
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: issueCount > 0 ? 'var(--color-warning-text)' : 'var(--color-text-muted)',
              marginTop: '4px',
            }}
            data-testid="crm-stat-issues"
          >
            {issueCount}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error-text)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Failed to load CRM data: {error}
        </div>
      )}

      {/* 10-Column Table */}
      <CrmTable records={records} isLoading={isLoading} />
    </section>
  );
}
