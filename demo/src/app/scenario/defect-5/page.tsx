import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect5Form } from '@/components/forms/Defect5Form';

export default function Defect5Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-5');

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
          Educational Defect Scenario 05
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {route?.title ?? 'Defect 5: Attribution Loss Across Navigation'}
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
            'Client-side route navigation drops URL query parameters; form reads location.search.'}
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
          <strong>Root Cause:</strong> During SPA multi-step transitions or client-side routing,
          the router replaced the URL path without preserving query parameters, and the application
          failed to persist first-touch attribution into local storage or cookies upon landing. On
          form submission, the handler read directly from <code>window.location.search</code>, which
          was already stripped. Consequently, the conversion event was tagged with{' '}
          <code>attribution_status: &apos;dropped&apos;</code> and the CRM recorded blank source
          attribution.
        </p>
        <div
          style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <strong>Simulate Paid Traffic Landing:</strong>{' '}
          <a
            href="/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001"
            style={{
              color: 'var(--color-primary-500)',
              textDecoration: 'underline',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Click here to reload with Google Ads UTM parameters &amp; GCLID
          </a>
        </div>
      </section>

      {/* Multi-Step Defect 5 Form & Live Inspection Panel */}
      <main>
        <Defect5Form />
      </main>
    </div>
  );
}
