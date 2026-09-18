import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect3Form } from '@/components/forms/Defect3Form';

export default function Defect3Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-3');

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Scenario Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm, 4px)',
              background: 'var(--color-warning-bg, rgba(245, 158, 11, 0.12))',
              color: 'var(--color-warning-text, #fbbf24)',
              border: '1px solid var(--color-warning-border, #f59e0b)',
            }}
          >
            Scenario: Defect 3
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
            Missing Conversion
          </span>
        </div>

        <h1
          style={{
            fontSize: 'var(--font-size-2xl, 1.875rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.75rem 0',
          }}
        >
          {route?.title ?? 'Defect 3: Missing Conversion Event'}
        </h1>

        <p
          style={{
            fontSize: 'var(--font-size-base, 1rem)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.25rem 0',
            lineHeight: 1.6,
          }}
        >
          {route?.description ??
            'Typo in event constant name prevents GTM custom event trigger from matching.'}
        </p>

        {/* 4 Authoritative Verification Layer Labels */}
        <div
          data-testid="verification-layer-labels"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {route?.verificationLayers.map((layer) => {
            const isLocal = layer === 'Confirmed locally';
            const isGtm = layer === 'Requires GTM Preview';
            const isGa4 = layer === 'Requires GA4 DebugView';
            const isAds = layer === 'Not tested in Google Ads';

            let bg = 'var(--color-bg-surface-raised)';
            let color = 'var(--color-text-secondary)';
            let borderColor = 'var(--color-border-default)';

            if (isLocal) {
              bg = 'var(--color-success-bg, rgba(16, 185, 129, 0.12))';
              color = 'var(--color-success-text, #34d399)';
              borderColor = 'var(--color-success-border, #10b981)';
            } else if (isGtm || isGa4) {
              bg = 'var(--color-info-bg, rgba(59, 130, 246, 0.12))';
              color = 'var(--color-primary-500, #3b82f6)';
              borderColor = 'var(--color-primary-500, #3b82f6)';
            } else if (isAds) {
              bg = 'var(--color-bg-surface)';
              color = 'var(--color-text-muted, #6b7280)';
              borderColor = 'var(--color-border-subtle, #1f2937)';
            }

            return (
              <span
                key={layer}
                data-testid={`verification-layer-${layer.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  background: bg,
                  color: color,
                  border: `1px solid ${borderColor}`,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  fontWeight: 600,
                }}
              >
                {layer}
              </span>
            );
          })}
        </div>
      </header>

      {/* Root Cause Explanation Panel */}
      <section
        data-testid="root-cause-explanation"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg, 1.25rem)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginTop: 0,
            marginBottom: '0.75rem',
          }}
        >
          Root Cause Analysis & Conversion Chain Impact
        </h2>

        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: 'var(--font-size-sm, 0.875rem)' }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            <strong>Real-World Analogue:</strong> A web development agency refactored the frontend lead form.
            During the update, the event name pushed to the <code>window.dataLayer</code> was inadvertently
            referenced from a legacy constants module that contained a typographical error:
            <code> LEGACY_MISSPELLED_EVENT = &apos;demo_lead_sucess&apos;</code> (note the single &quot;s&quot;).
          </p>

          <p style={{ margin: '0 0 1rem 0' }}>
            <strong>The Conversion Chain Breakdown:</strong>
          </p>
          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>Form &amp; API:</strong> The lead submits cleanly, passing client validation and server Zod schemas.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>CRM Storage:</strong> The server returns <strong>201 Created</strong> and records 1 valid row in the CRM.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>dataLayer Push:</strong> The client pushes <code>{`{ event: 'demo_lead_sucess', ... }`}</code>.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>GTM Trigger:</strong> Google Tag Manager has a Custom Event trigger configured for <code>demo_lead_success</code>.
              Because the string does not match, the trigger evaluates to <strong>false</strong>.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>GA4 &amp; Google Ads:</strong> No tag fires, no GA4 measurement hit is transmitted, and zero conversion credits are passed to Google Ads Smart Bidding.
            </li>
          </ul>

          <h3
            style={{
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginTop: '1.25rem',
              marginBottom: '0.5rem',
            }}
          >
            Verification Layer Diagnostic Matrix
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <div
              style={{
                background: 'var(--color-bg-canvas)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <strong style={{ color: 'var(--color-success-text, #34d399)', display: 'block', fontSize: 'var(--font-size-xs, 0.75rem)' }}>
                1. Confirmed locally
              </strong>
              <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                Inspect <code>window.dataLayer</code> in console: event is <code>&apos;demo_lead_sucess&apos;</code>.
              </p>
            </div>

            <div
              style={{
                background: 'var(--color-bg-canvas)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <strong style={{ color: 'var(--color-primary-500, #3b82f6)', display: 'block', fontSize: 'var(--font-size-xs, 0.75rem)' }}>
                2. Requires GTM Preview
              </strong>
              <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                GTM Tag Assistant displays event <code>demo_lead_sucess</code>, but GA4 conversion tag is listed under &quot;Tags Not Fired&quot;.
              </p>
            </div>

            <div
              style={{
                background: 'var(--color-bg-canvas)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <strong style={{ color: 'var(--color-primary-500, #3b82f6)', display: 'block', fontSize: 'var(--font-size-xs, 0.75rem)' }}>
                3. Requires GA4 DebugView
              </strong>
              <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                No key event or conversion icon appears in DebugView stream because GTM never sent the hit.
              </p>
            </div>

            <div
              style={{
                background: 'var(--color-bg-canvas)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <strong style={{ color: 'var(--color-text-muted, #6b7280)', display: 'block', fontSize: 'var(--font-size-xs, 0.75rem)' }}>
                4. Not tested in Google Ads
              </strong>
              <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                Campaign bidding optimization receives zero signals; Smart Bidding throttles impression delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Form Section */}
      <section>
        <h2
          style={{
            fontSize: 'var(--font-size-xl, 1.5rem)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '1rem',
          }}
        >
          Interactive Demonstration
        </h2>
        <Defect3Form />
      </section>
    </div>
  );
}
