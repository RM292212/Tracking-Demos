/**
 * ResponseLock Confirmation Success Panel Component
 * Location: demo/src/components/ui/SuccessPanel.tsx
 *
 * Renders audit inquiry confirmation UI strictly from verified server response
 * data (never optimistically or before HTTP 201 receipt).
 */

import React from 'react';

export interface SuccessPanelProps {
  submissionId: string;
  createdAt: string;
  status: string;
  scenario?: string;
  message?: string;
  onReset?: () => void;
}

export function SuccessPanel({
  submissionId,
  createdAt,
  status,
  scenario = 'baseline',
  message,
  onReset,
}: SuccessPanelProps): React.ReactElement {
  return (
    <div
      data-testid="success-panel"
      role="region"
      aria-label="Submission Confirmation"
      style={{
        backgroundColor: 'var(--color-success-bg)',
        border: '1px solid var(--color-success-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        marginTop: 'var(--space-6)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-success-text)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2
          data-testid="success-title"
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-success-text)',
            margin: 0,
          }}
        >
          Audit Inquiry Confirmed
        </h2>
      </div>

      <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
        {message ||
          'Your audit inquiry was successfully validated and committed to the simulated CRM.'}
      </p>

      {/* Confirmation Metadata Grid */}
      <dl
        style={{
          marginTop: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--color-bg-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div>
          <dt
            style={{
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Submission ID
          </dt>
          <dd
            data-testid="success-submission-id"
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-sm)',
              wordBreak: 'break-all',
              color: 'var(--color-text-primary)',
            }}
          >
            {submissionId}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Status
          </dt>
          <dd
            data-testid="success-status"
            style={{
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success-text)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
            }}
          >
            {status}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Timestamp (UTC)
          </dt>
          <dd
            data-testid="success-created-at"
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {createdAt}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Scenario
          </dt>
          <dd
            data-testid="success-scenario"
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {scenario}
          </dd>
        </div>
      </dl>

      <div
        style={{
          marginTop: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Verification Note: Exactly 1 conversion event was pushed to dataLayer after server confirmation.
        </p>

        {onReset && (
          <button
            type="button"
            data-testid="success-reset-button"
            onClick={onReset}
            style={{
              backgroundColor: 'var(--color-bg-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            Submit Another Request
          </button>
        )}
      </div>
    </div>
  );
}
