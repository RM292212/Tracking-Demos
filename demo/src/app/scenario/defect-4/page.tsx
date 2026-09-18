import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect4Form } from '@/components/forms/Defect4Form';

export default function Defect4Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-4');

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
              background: 'var(--color-error-bg, rgba(239, 68, 68, 0.14))',
              color: 'var(--color-error-text, #f87171)',
              border: '1px solid var(--color-error-border, #ef4444)',
            }}
          >
            Scenario: Defect 4
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
            Schema Drift
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
          {route?.title ?? 'Defect 4: Bad/Missing Event Parameters'}
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
            'Schema drift drops form_id and passes corrupt lead_type value to analytics.'}
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
            <strong>Real-World Analogue:</strong> Following a frontend codebase cleanup, a mapper function
            (<code>mappers/defect-04.ts</code>) was updated with camelCase field expectations (looking for <code>context.formId</code>)
            while the form component continued to supply <code>form_id</code>. Consequently, <code>form_id</code> resolves
            to <code>undefined</code> and is dropped during JSON serialization. Additionally, an outdated default reverted
            <code>lead_type</code> from <code>&apos;agency_audit_inquiry&apos;</code> to generic <code>&apos;contact&apos;</code>.
          </p>

          <p style={{ margin: '0 0 1rem 0' }}>
            <strong>The Conversion Chain Breakdown:</strong>
          </p>
          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>Form &amp; API:</strong> The lead submits cleanly; <strong>201 Created</strong> response; exactly 1 CRM record is created.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>GTM Trigger Match:</strong> Unlike Defect 3, the event name is <code>demo_lead_success</code>, so GTM triggers DO fire!
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>Corrupted Parameters:</strong> GTM tags looking for <code>form_id</code> receive <code>undefined</code>.
              The <code>lead_type</code> parameter sends <code>&apos;contact&apos;</code> instead of <code>&apos;agency_audit_inquiry&apos;</code>.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>GA4 Dimension Breakdown:</strong> Reports segmented by form fail. High-intent audit inquiries are miscategorized as generic inquiries.
            </li>
            <li style={{ marginBottom: '0.375rem' }}>
              <strong>Google Ads Impact:</strong> Smart Bidding rules configured on high-value lead types fail to bid aggressively because the parameter is mislabeled.
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
                Inspect <code>window.dataLayer</code>: <code>form_id</code> is missing and <code>lead_type: &apos;contact&apos;</code>.
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
                GTM Tag Assistant shows Data Layer Variables <code>dlv - form_id</code> as undefined and <code>dlv - lead_type</code> as &apos;contact&apos;.
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
                DebugView receives <code>demo_lead_success</code>, but parameter card shows <code>lead_type = contact</code> and no <code>form_id</code>.
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
                Downstream conversion value adjustment and lead qualification audiences in Google Ads fail to group this lead.
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
        <Defect4Form />
      </section>
    </div>
  );
}
