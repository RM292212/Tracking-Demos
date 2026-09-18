import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTE_REGISTRY, type VerificationLayer } from '@/lib/contracts/routes';

export const metadata: Metadata = {
  title: 'ResponseLock | Lead & Conversion Integrity Demo Workspace',
  description:
    'Educational workspace proving the ResponseLock Lead & Conversion Integrity Audit ($350 fixed-scope service). Inspect, test, and break every step in the marketing conversion chain.',
};

function getBadgeStyle(layer: VerificationLayer): React.CSSProperties {
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

export default function HomePage(): React.ReactElement {
  const scenarioRoutes = ROUTE_REGISTRY.filter((r) => r.scenarioId !== null);
  const toolRoutes = ROUTE_REGISTRY.filter((r) => r.scenarioId === null && r.path !== '/');

  return (
    <section aria-labelledby="home-hero-title">
      {/* Hero Header */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-8)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-700)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Fixed-Scope Marketing Agency Training ($350 Audit Service)
        </div>
        <h1
          id="home-hero-title"
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          ResponseLock Lead &amp; Conversion Integrity Audit Demo
        </h1>
        <p
          style={{
            marginTop: 'var(--space-3)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-lg)',
            maxWidth: '840px',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          A local training and demonstration workspace that makes the entire marketing conversion chain
          visible, inspectable, and breakable: from ad click with UTM/GCLID parameters, through form validation,
          <code>dataLayer</code> pushes, and Google Tag Manager triggers, to CRM record mapping.
        </p>

        {/* Core Teaching Thesis Callout */}
        <div
          role="note"
          aria-label="Core Educational Thesis"
          style={{
            marginTop: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-surface)',
            borderLeft: '4px solid var(--color-primary-500)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-6)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Core Principle: A form that works does NOT mean conversion data is trustworthy.
          </p>
          <p
            style={{
              marginTop: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            Tracking can report phantom conversions on broken forms, drop real conversions from event-name typos,
            count duplicates on reload, strip UTM attribution across route changes, or misplace ad spend in the CRM.
          </p>
        </div>
      </div>

      {/* Primary Conversion Chain Overview */}
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Conversion Chain Scenarios
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-6)',
          }}
        >
          Compare the intact baseline standard against six production-shaped tracking defects encountered in client audits.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {scenarioRoutes.map((route) => {
            const isBaseline = route.scenarioId === 'baseline';
            return (
              <article
                key={route.path}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: `1px solid ${isBaseline ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: isBaseline ? 'var(--color-primary-500)' : 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {isBaseline ? 'Reference Standard' : `Defect Scenario`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                    <Link
                      href={route.path}
                      style={{
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                      }}
                    >
                      {route.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      marginTop: 'var(--space-2)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 'var(--line-height-normal)',
                    }}
                  >
                    {route.description}
                  </p>
                </div>

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-1)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {route.verificationLayers.map((layer) => {
                      const style = getBadgeStyle(layer);
                      return (
                        <span
                          key={layer}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid transparent',
                            ...style,
                          }}
                        >
                          {layer}
                        </span>
                      );
                    })}
                  </div>

                  <Link
                    href={route.path}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: 'var(--color-primary-500)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      textDecoration: 'none',
                    }}
                  >
                    Open Scenario &rarr;
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Tools & Observability Section */}
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Observability &amp; CRM Tools
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {toolRoutes.map((tool) => (
            <article
              key={tool.path}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                <Link
                  href={tool.path}
                  style={{
                    color: 'var(--color-accent-500)',
                    textDecoration: 'none',
                  }}
                >
                  {tool.title}
                </Link>
              </h3>
              <p
                style={{
                  marginTop: 'var(--space-2)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {tool.description}
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Link
                  href={tool.path}
                  style={{
                    color: 'var(--color-accent-500)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textDecoration: 'none',
                  }}
                >
                  Launch Tool &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Documentation & Audit Assets Reference */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Audit Runbooks &amp; Operational Documentation
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          The workspace includes a complete professional agency service pack supporting the $350 fixed-scope audit:
        </p>

        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-2)',
            listStyle: 'none',
            padding: 0,
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>docs/demo-runbook.md</code> &mdash; Step-by-step audit execution
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>docs/troubleshooting.md</code> &mdash; 25+ diagnosed tracking errors
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>docs/defect-catalog.md</code> &mdash; Real-world root cause analysis
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>docs/google-ads-boundary.md</code> &mdash; Epistemic boundaries &amp; ads rules
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>scope/audit-scope-source.md</code> &mdash; Canonical $350 service scope
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            &bull; <code>audit-template/sample-audit-report.md</code> &mdash; Client-ready deliverable
          </li>
        </ul>
      </div>
    </section>
  );
}
