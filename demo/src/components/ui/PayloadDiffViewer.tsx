'use client';

import React from 'react';

export interface PayloadDiffViewerProps {
  expectedPayload: Record<string, unknown>;
  actualPayload: Record<string, unknown>;
}

export function PayloadDiffViewer({
  expectedPayload,
  actualPayload,
}: PayloadDiffViewerProps): React.ReactElement {
  const isFormIdMissing = !('form_id' in actualPayload) || actualPayload['form_id'] === undefined;
  const isLeadTypeMutated = actualPayload['lead_type'] !== expectedPayload['lead_type'];

  return (
    <div
      data-testid="payload-diff-viewer"
      style={{
        background: 'var(--color-bg-surface-raised, #1f2937)',
        border: '1px solid var(--color-border-default, #374151)',
        borderRadius: 'var(--radius-lg, 8px)',
        padding: '1.5rem',
        marginTop: '1.5rem',
      }}
    >
      {/* Alert Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-error-bg, rgba(239, 68, 68, 0.14))',
            color: 'var(--color-error-text, #f87171)',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          !
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base, 1rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary, #f9fafb)',
          }}
        >
          DataLayer Payload Comparison (Schema Drift Active)
        </h3>
      </div>

      <p
        style={{
          color: 'var(--color-text-secondary, #9ca3af)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          margin: '0 0 1rem 0',
          lineHeight: 1.5,
        }}
      >
        A side-by-side diff comparing the canonical analytics contract against the actual payload pushed
        by <code>buildDefect04AnalyticsPayload()</code>.
      </p>

      {/* Discrepancy Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Missing form_id Alert */}
        <div
          data-testid="diff-form-id"
          style={{
            background: isFormIdMissing
              ? 'var(--color-error-bg, rgba(239, 68, 68, 0.14))'
              : 'var(--color-success-bg, rgba(16, 185, 129, 0.12))',
            border: `1px solid ${
              isFormIdMissing
                ? 'var(--color-error-border, #ef4444)'
                : 'var(--color-success-border, #10b981)'
            }`,
            borderRadius: 'var(--radius-md, 6px)',
            padding: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-primary)' }}>
              Key: form_id
            </strong>
            <span
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                fontWeight: 700,
                color: isFormIdMissing ? 'var(--color-error-text, #f87171)' : 'var(--color-success-text, #34d399)',
              }}
            >
              {isFormIdMissing ? 'MISSING (DROPPED)' : 'MATCH'}
            </span>
          </div>
          <div style={{ marginTop: '0.375rem', fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
            Expected: <code>&apos;{String(expectedPayload['form_id'])}&apos;</code>
            <br />
            Actual: <span style={{ color: 'var(--color-error-text, #f87171)' }}>undefined (omitted from JSON)</span>
          </div>
        </div>

        {/* Mutated lead_type Alert */}
        <div
          data-testid="diff-lead-type"
          style={{
            background: isLeadTypeMutated
              ? 'var(--color-error-bg, rgba(239, 68, 68, 0.14))'
              : 'var(--color-success-bg, rgba(16, 185, 129, 0.12))',
            border: `1px solid ${
              isLeadTypeMutated
                ? 'var(--color-error-border, #ef4444)'
                : 'var(--color-success-border, #10b981)'
            }`,
            borderRadius: 'var(--radius-md, 6px)',
            padding: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-primary)' }}>
              Key: lead_type
            </strong>
            <span
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                fontWeight: 700,
                color: isLeadTypeMutated ? 'var(--color-error-text, #f87171)' : 'var(--color-success-text, #34d399)',
              }}
            >
              {isLeadTypeMutated ? 'MUTATED (VALUE MISMATCH)' : 'MATCH'}
            </span>
          </div>
          <div style={{ marginTop: '0.375rem', fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
            Expected: <code>&apos;{String(expectedPayload['lead_type'])}&apos;</code>
            <br />
            Actual: <span style={{ color: 'var(--color-error-text, #f87171)' }}>&apos;{String(actualPayload['lead_type'])}&apos;</span>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Expected Payload Panel */}
        <div
          style={{
            background: 'var(--color-bg-canvas, #090d16)',
            border: '1px solid var(--color-border-subtle, #1f2937)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '1rem',
          }}
        >
          <h4
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-success-text, #34d399)',
              fontWeight: 700,
            }}
          >
            Expected Canonical Payload
          </h4>
          <pre
            data-testid="expected-payload-json"
            style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-primary, #f9fafb)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(expectedPayload, null, 2)}
          </pre>
        </div>

        {/* Actual Pushed Payload Panel */}
        <div
          style={{
            background: 'var(--color-bg-canvas, #090d16)',
            border: '1px solid var(--color-error-border, #ef4444)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '1rem',
          }}
        >
          <h4
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-error-text, #f87171)',
              fontWeight: 700,
            }}
          >
            Actual Pushed Payload (window.dataLayer)
          </h4>
          <pre
            data-testid="actual-payload-json"
            style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-primary, #f9fafb)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(actualPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
