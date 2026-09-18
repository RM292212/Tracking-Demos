import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect6Form } from '@/components/forms/Defect6Form';

export default function Defect6Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-6');

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      {/* Header & Scenario Context */}
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-bold)',
            textTransform: 'uppercase',
            color: 'var(--color-primary-500)',
            marginBottom: 'var(--space-1)',
            letterSpacing: '0.05em',
          }}
        >
          Educational Defect Scenario 06
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {route?.title ?? 'Defect 6: Incomplete & Mismapped CRM Record'}
        </h1>
        <p
          style={{
            marginTop: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-base)',
            maxWidth: '750px',
          }}
        >
          {route?.description ??
            'Server CRM mapper drops utm_campaign and assigns source to lead_source_detail.'}
        </p>

        {/* 4 Verification Layer Labels */}
        <div
          data-testid="verification-layer-labels"
          style={{
            marginTop: 'var(--space-4)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          {route?.verificationLayers.map((layer) => {
            const isConfirmed = layer === 'Confirmed locally';
            return (
              <span
                key={layer}
                data-testid={`layer-label-${layer.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  background: isConfirmed
                    ? 'var(--color-success-bg)'
                    : 'var(--color-bg-surface-raised)',
                  color: isConfirmed
                    ? 'var(--color-success-text)'
                    : 'var(--color-text-secondary)',
                  border: `1px solid ${
                    isConfirmed ? 'var(--color-success-border)' : 'var(--color-border-subtle)'
                  }`,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {layer}
              </span>
            );
          })}
        </div>
      </header>

      {/* Root Cause Analysis Banner */}
      <section
        data-testid="root-cause-analysis"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-warning-border)',
          borderLeft: '4px solid var(--color-warning-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-warning-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-1)',
          }}
        >
          Root Cause & Real-World Analogue
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          <strong>Root Cause:</strong> Webhook / CRM field mapping misconfiguration in backend
          integration layer (<code>mappers/defect-06.ts</code>). The client submitted full, valid
          attribution data (<code>utm_source: &apos;google&apos;</code>, <code>utm_medium: &apos;cpc&apos;</code>,{' '}
          <code>utm_campaign: &apos;responselock_demo&apos;</code>, <code>gclid: &apos;DEMO-GCLID-001&apos;</code>),
          and GA4 conversion tracking fired without error. However, the server mapper dropped{' '}
          <code>campaign_name</code> completely, mapped <code>utm_source</code> into{' '}
          <code>lead_source_detail</code>, and left primary <code>lead_source</code> empty. In the CRM,
          sales leaders cannot attribute leads back to campaigns.
        </p>
      </section>

      {/* Defect 6 Form & Integrity Comparison */}
      <main>
        <Defect6Form />
      </main>
    </div>
  );
}
