import React from 'react';
import type { Metadata } from 'next';
import { getRouteByPath, type VerificationLayer } from '@/lib/contracts/routes';
import { BaselineForm } from '@/components/forms/BaselineForm';

export const metadata: Metadata = {
  title: 'Baseline Valid Form | ResponseLock Audit Demo',
  description:
    'Demonstration of an intact marketing conversion chain: form validation -> API -> CRM row -> dataLayer push with approved keys.',
};

function getVerificationBadgeStyle(layer: VerificationLayer): React.CSSProperties {
  switch (layer) {
    case 'Confirmed locally':
      return {
        backgroundColor: 'var(--color-success-bg)',
        borderColor: 'var(--color-success-border)',
        color: 'var(--color-success-text)',
      };
    case 'Requires GTM Preview':
      return {
        backgroundColor: 'var(--color-info-bg)',
        borderColor: 'var(--color-info-border)',
        color: 'var(--color-info-text)',
      };
    case 'Requires GA4 DebugView':
      return {
        backgroundColor: 'var(--color-warning-bg)',
        borderColor: 'var(--color-warning-border)',
        color: 'var(--color-warning-text)',
      };
    case 'Not tested in Google Ads':
      return {
        backgroundColor: 'var(--color-bg-surface-raised)',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-muted)',
      };
    default:
      return {
        backgroundColor: 'var(--color-bg-surface-raised)',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-secondary)',
      };
  }
}

export default function BaselinePage(): React.ReactElement {
  const route = getRouteByPath('/scenario/baseline');
  const verificationLayers = route?.verificationLayers ?? [
    'Confirmed locally',
    'Requires GTM Preview',
    'Requires GA4 DebugView',
    'Not tested in Google Ads',
  ];

  return (
    <section aria-labelledby="scenario-heading">
      {/* Scenario Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-primary-500)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Scenario 0: Intact Reference Standard
        </div>
        <h1
          id="scenario-heading"
          data-testid="scenario-title"
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {route?.title ?? 'Baseline Valid Form'}
        </h1>
        <p
          data-testid="scenario-description"
          style={{
            marginTop: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-base)',
            maxWidth: '800px',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {route?.description ??
            'Intact end-to-end conversion chain: form -> API -> CRM -> dataLayer.'}
        </p>

        {/* 4 Verification Layer Labels */}
        <div
          data-testid="verification-layers"
          aria-label="Verification Layers"
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          {verificationLayers.map((layer) => {
            const style = getVerificationBadgeStyle(layer);
            return (
              <span
                key={layer}
                data-testid={`verification-layer-${layer.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  border: '1px solid transparent',
                  ...style,
                }}
              >
                {layer}
              </span>
            );
          })}
        </div>
      </div>

      {/* Educational Walkthrough Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Expected Baseline Behavior (Enforced Chain Order)
        </h2>
        <ol
          style={{
            paddingLeft: 'var(--space-4)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            display: 'grid',
            gap: 'var(--space-1)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          <li>
            <strong>Valid Submission:</strong> User submits valid details &rarr; Client validation passes &rarr;
            UUID v4 generated &rarr; Attribution retrieved &rarr; POST <code>/api/leads</code> with Idempotency-Key &rarr;
            Server returns 201 &rarr; Exactly 1 CRM row created &rarr; Success UI renders &rarr; Exactly 1 <code>demo_lead_success</code> event pushed to <code>window.dataLayer</code> (7 approved keys, zero PII).
          </li>
          <li>
            <strong>Invalid Submission:</strong> Client validation fails &rarr; Inline field errors display &rarr;
            <strong> Zero network calls made</strong> &rarr; <strong>Zero CRM rows written</strong> &rarr; <strong>Zero dataLayer events pushed</strong>.
          </li>
        </ol>
      </div>

      {/* Main Interactive Baseline Form Component */}
      <BaselineForm />
    </section>
  );
}
