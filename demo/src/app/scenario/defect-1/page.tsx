import React from 'react';
import type { Metadata } from 'next';
import { getRouteByPath } from '@/lib/contracts/routes';
import { Defect1Form } from '@/components/forms/Defect1Form';

export const metadata: Metadata = {
  title: 'Defect 1: Conversion Fires on Invalid Submit | ResponseLock',
};

export default function Defect1Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-1');

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
            background: 'var(--color-error-bg)',
            color: 'var(--color-error-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Tracking Defect 01
        </div>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {route?.title ?? 'Defect 1: Conversion Fires on Invalid Submit'}
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          {route?.description ??
            'Submit button click pushes conversion event before client validation passes.'}
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
          <strong>Real-World Analogue:</strong> A Google Tag Manager container
          was configured using a standard &ldquo;Click &ndash; All Elements&rdquo; or
          &ldquo;Click &ndash; Just Links&rdquo; trigger listening on the form&rsquo;s submit
          button selector (e.g.{' '}
          <code>button[type=&quot;submit&quot;]</code> or{' '}
          <code>.btn-submit</code>).
        </p>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-3)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Because the trigger is attached to the user&rsquo;s physical click event rather
          than the form&rsquo;s confirmed validation or server 201 response, clicking
          the button pushes a <code>demo_lead_success</code> conversion event into{' '}
          <code>window.dataLayer</code> immediately.
        </p>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          When the client validation subsequently runs and detects empty or invalid
          inputs (such as a missing email or blank company name), the submission is
          promptly rejected. Zero network requests are dispatched and zero CRM rows
          are written &mdash; yet analytics reports a 100% successful conversion!
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
            <strong>Intent Tracking vs. Outcome Tracking:</strong> The conversion tag
            is wired to the user&rsquo;s <em>intent</em> to submit rather than the{' '}
            <em>verified outcome</em> of lead capture.
          </li>
          <li>
            <strong>Pre-validation Execution:</strong> The browser DOM{' '}
            <code>click</code> event executes prior to the form&rsquo;s{' '}
            <code>submit</code> event handler, making it impossible for client-side
            validation rules to guard the tag.
          </li>
          <li>
            <strong>Ad Platform Distortion:</strong> In Google Ads or Meta Ads,
            every accidental click or incomplete attempt by a confused user is
            recorded as a high-intent conversion, training bidding algorithms on
            unqualified bounces.
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
                <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-default)' }}>Healthy Baseline (Invalid Form)</th>
                <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-default)' }}>Defect 1 (Invalid Form)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>Success UI Rendered</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0 (Blocked)</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0 (Blocked)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>API Network Requests</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>CRM Records Written</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>0</td>
              </tr>
              <tr style={{ background: 'var(--color-error-bg)' }}>
                <td style={{ padding: '10px 14px', color: 'var(--color-error-text)', fontWeight: 'bold' }}>dataLayer Events Pushed</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>0</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-error-text)', fontWeight: 'bold' }}>1 (False Conversion!)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Form Section */}
      <section aria-labelledby="defect1-form-heading">
        <h2
          id="defect1-form-heading"
          style={{
            fontSize: 'var(--font-size-xl)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Interactive Defect 1 Form
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Test this form by clicking the submit button immediately without filling
          in any fields. Open your browser console or dataLayer inspector to observe
          the conversion event being fired while the form displays validation errors!
        </p>

        <Defect1Form />
      </section>
    </article>
  );
}
