import React from 'react';
import type { Metadata } from 'next';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect2Form } from '@/components/forms/Defect2Form';

export const metadata: Metadata = {
  title: 'Defect 2: Duplicate Conversion | ResponseLock',
};

export default function Defect2Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-2');

  return (
    <article
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        paddingBottom: 'var(--space-8)',
      }}
    >
      {/* Page Header */}
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Tracking Defect 02
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {route?.title ?? 'Defect 2: Duplicate Conversion'}
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {route?.description ??
            'Legacy click listener and new post-success listener push duplicate conversion events.'}
        </p>

        {/* The 4 Authoritative Verification Layer Labels */}
        <div
          style={{
            marginTop: 'var(--space-4)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
          aria-label="Verification Layers"
        >
          {route?.verificationLayers.map((layer) => {
            const isLocal = layer === 'Confirmed locally';
            const isAds = layer === 'Not tested in Google Ads';
            return (
              <span
                key={layer}
                style={{
                  background: isLocal
                    ? 'var(--color-success-bg)'
                    : isAds
                    ? 'var(--color-bg-surface-raised)'
                    : 'var(--color-info-bg)',
                  border: `1px solid ${
                    isLocal
                      ? 'var(--color-success-border)'
                      : isAds
                      ? 'var(--color-border-default)'
                      : 'var(--color-accent-600)'
                  }`,
                  color: isLocal
                    ? 'var(--color-success-text)'
                    : isAds
                    ? '#ffffff'
                    : 'var(--color-accent-500)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
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

      {/* Scenario Overview & Real-World Analogue */}
      <section
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Scenario Description &amp; Real-World Analogue
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-3)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          <strong>Real-World Analogue:</strong> Legacy analytics tracking snippet
          left behind during tag migration. When an agency or in-house team
          implements modern server-side or post-success event listeners, they
          frequently fail to remove older on-click snippets in hardcoded theme files
          or obsolete GTM workspaces.
        </p>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-3)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          In this scenario, the legacy listener (<code>legacy-conversion-listener.ts</code>)
          fires upon button click, pushing <code>demo_lead_success</code>. Simultaneously,
          the application&rsquo;s modern handler waits for the server&rsquo;s 201 Created
          response and pushes a second <code>demo_lead_success</code> event with the
          exact same <code>submission_id</code>.
        </p>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          To exacerbate the problem, the submit button does not disable while the
          request is in flight. The server&rsquo;s atomic idempotency check ensures only
          1 CRM row is saved. The result in analytics: 2 recorded conversions for 1
          actual lead!
        </p>
      </section>

      {/* Root Cause Analysis */}
      <section
        style={{
          background: 'var(--color-bg-surface-raised)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Root Cause Analysis
        </h2>
        <ul
          style={{
            paddingLeft: 'var(--space-5)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          <li>
            <strong>Partial Tag Migration:</strong> Two competing analytics
            architectures run concurrently on the same DOM element.
          </li>
          <li>
            <strong>Identical Identifier Collision:</strong> Both the legacy snippet
            and the modern listener read the active submission ID, pushing twin
            events with the exact same payload into <code>window.dataLayer</code>.
          </li>
          <li>
            <strong>Absence of Button Debouncing:</strong> The submit button remains
            clickable throughout network latency, increasing vulnerability to double
            submits.
          </li>
          <li>
            <strong>False ROI &amp; ROAS Inflation:</strong> Google Ads or Meta Ads
            reports double the conversions, halving the perceived Cost Per Lead and
            giving marketing teams false confidence in campaign efficiency.
          </li>
        </ul>
      </section>

      {/* Forensic Verification Table */}
      <section
        style={{
          marginBottom: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Audit Comparison: Expected vs. Observed Behavior
        </h2>
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--color-bg-surface-raised)' }}>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-default)' }}>State Component</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-default)' }}>Healthy Baseline (Valid Form)</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-default)' }}>Defect 2 (Valid Form)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>Success UI Rendered</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>1</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>1</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>Button Disabled in Flight</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>Yes (Disabled)</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-warning-text)' }}>No (Active)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>CRM Records Written</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>1</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>1 (Idempotent)</td>
              </tr>
              <tr style={{ background: 'var(--color-warning-bg)' }}>
                <td style={{ padding: '10px 14px', color: 'var(--color-warning-text)', fontWeight: 'bold' }}>dataLayer Events Pushed</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>1</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-warning-text)', fontWeight: 'bold' }}>2 (Duplicate Conversion!)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Form Section */}
      <section aria-labelledby="defect2-form-heading">
        <h2
          id="defect2-form-heading"
          style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Interactive Defect 2 Form
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Complete the form below and click submit. Notice that the button does not
          disable during flight, and check <code>window.dataLayer</code> after the
          server confirmation renders to observe two distinct conversion events
          sharing the exact same submission ID!
        </p>

        <Defect2Form />
      </section>
    </article>
  );
}
