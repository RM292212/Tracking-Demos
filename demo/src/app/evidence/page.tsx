'use client';

/**
 * ResponseLock Audit Evidence Hub Page
 * Location: demo/src/app/evidence/page.tsx
 *
 * Implements:
 * 1. Evidence dashboard displaying all 7 finding packages (baseline, defect-01 through defect-06).
 * 2. Finding IDs, titles, status badges, severity badges, and verification layer badges.
 * 3. Quick links to reproduction scenarios and finding documentation.
 * 4. Interactive telemetry tools: Observability Panel, Test Conditions Simulator, and Consent Mode v2 Banner.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { getRouteByPath, VerificationLayer } from '@/lib/contracts/routes';
import { ObservabilityPanel } from '@/components/ObservabilityPanel';
import { TestConditionsPanel } from '@/components/TestConditionsPanel';
import { ConsentBanner } from '@/components/ConsentBanner';

interface FindingPackage {
  id: string;
  title: string;
  scenario: string;
  severity: 'Baseline' | 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Verified Intact' | 'Defect Confirmed' | 'Local Simulation';
  summary: string;
  scenarioPath: string;
  docPath: string;
  verificationLayers: VerificationLayer[];
  expectedBehavior: string;
  observedDefect: string;
}

const FINDING_PACKAGES: FindingPackage[] = [
  {
    id: 'FINDING-BASELINE-001',
    title: 'Baseline Valid Conversion Flow',
    scenario: 'baseline',
    severity: 'Baseline',
    status: 'Verified Intact',
    summary:
      'Complete end-to-end conversion chain intact: form validation passes, server writes 1 CRM row, and exactly 1 demo_lead_success event is pushed to dataLayer with approved keys only.',
    scenarioPath: '/scenario/baseline',
    docPath: 'evidence/baseline/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: '1 Success UI, 1 CRM Record, 1 dataLayer Conversion Event',
    observedDefect: 'None (reference baseline)',
  },
  {
    id: 'FINDING-DEFECT-01',
    title: 'Conversion Fires on Invalid Submission',
    scenario: 'defect-1',
    severity: 'Critical',
    status: 'Defect Confirmed',
    summary:
      'A generic click listener on the submit button fires before client-side validation executes. An invalid submit triggers 0 API requests and 0 CRM rows, but emits a false conversion into dataLayer.',
    scenarioPath: '/scenario/defect-1',
    docPath: 'evidence/defect-01-invalid-submit-fire/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: '0 Success UI, 0 CRM Records, 0 dataLayer Conversion Events on invalid submit',
    observedDefect: '1 dataLayer conversion event fired despite client validation rejection',
  },
  {
    id: 'FINDING-DEFECT-02',
    title: 'Duplicate Conversion on Single Submission',
    scenario: 'defect-2',
    severity: 'High',
    status: 'Defect Confirmed',
    summary:
      'An unremoved legacy conversion listener fires on click alongside the modern post-success callback. Both push the same submission_id, inflating conversion counts by 100%.',
    scenarioPath: '/scenario/defect-2',
    docPath: 'evidence/defect-02-duplicate-conversion/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: '1 Success UI, 1 CRM Record, 1 dataLayer Conversion Event',
    observedDefect: '2 dataLayer conversion events pushed with identical submission_id',
  },
  {
    id: 'FINDING-DEFECT-03',
    title: 'Missing Conversion from Event Name Drift',
    scenario: 'defect-3',
    severity: 'Critical',
    status: 'Defect Confirmed',
    summary:
      'Post-success handler imports event constant from a legacy constants file containing a typo (demo_lead_sucess). The expected GTM trigger fails to match, creating a 100% tracking blackout.',
    scenarioPath: '/scenario/defect-3',
    docPath: 'evidence/defect-03-missing-conversion/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: '1 Success UI, 1 CRM Record, 1 demo_lead_success dataLayer event',
    observedDefect: '0 demo_lead_success events pushed (misspelled demo_lead_sucess pushed)',
  },
  {
    id: 'FINDING-DEFECT-04',
    title: 'Missing & Corrupted Event Parameters',
    scenario: 'defect-4',
    severity: 'Medium',
    status: 'Defect Confirmed',
    summary:
      'Analytics payload mapper reads renamed keys. As a result, form_id resolves to undefined (dropped by JSON.stringify) and lead_type receives a legacy placeholder ("contact").',
    scenarioPath: '/scenario/defect-4',
    docPath: 'evidence/defect-04-bad-event-parameters/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: 'All 7 approved keys populated with canonical schema values',
    observedDefect: 'form_id missing from payload; lead_type contains invalid value',
  },
  {
    id: 'FINDING-DEFECT-05',
    title: 'Attribution Loss Across Client-Side Navigation',
    scenario: 'defect-5',
    severity: 'High',
    status: 'Defect Confirmed',
    summary:
      'Landing URL contains UTMs and GCLID, but an SPA navigation to step 2 drops the query string. The scenario reads location.search at submit time rather than persisted storage, wiping attribution.',
    scenarioPath: '/scenario/defect-5',
    docPath: 'evidence/defect-05-attribution-loss/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: 'First-touch/last-touch UTM parameters and GCLID preserved into CRM record',
    observedDefect: 'CRM record created with blank UTMs and attribution_status: dropped',
  },
  {
    id: 'FINDING-DEFECT-06',
    title: 'Incomplete & Mismapped CRM Lead Record',
    scenario: 'defect-6',
    severity: 'High',
    status: 'Defect Confirmed',
    summary:
      'Server-side field mapper (mappers/defect-06.ts) drops utm_campaign entirely and writes utm_source into lead_source_detail while leaving lead_source blank.',
    scenarioPath: '/scenario/defect-6',
    docPath: 'evidence/defect-06-incomplete-crm-record/finding.md',
    verificationLayers: [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ],
    expectedBehavior: 'lead_source=google, lead_source_detail=cpc, campaign_name=responselock_demo',
    observedDefect: 'lead_source=[EMPTY], lead_source_detail=google, campaign_name=[EMPTY]',
  },
];

const SEVERITY_COLORS: Record<FindingPackage['severity'], { bg: string; text: string; border: string }> = {
  Baseline: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', border: 'var(--color-info-border)' },
  Critical: { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)', border: 'var(--color-error-border)' },
  High: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: '#f97316' },
  Medium: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', border: 'var(--color-warning-border)' },
  Low: { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-secondary)', border: 'var(--color-border-subtle)' },
};

export default function EvidencePage(): React.ReactElement {
  const route = getRouteByPath('/evidence');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'packages' | 'tools'>('packages');

  const filteredPackages = FINDING_PACKAGES.filter((pkg) => {
    if (selectedSeverity === 'all') return true;
    return pkg.severity.toLowerCase() === selectedSeverity.toLowerCase();
  });

  return (
    <section
      className="evidence-page"
      data-testid="evidence-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {route?.title ?? 'Audit Evidence Hub'}
          </h1>
          <p
            style={{
              marginTop: 'var(--space-1)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {route?.description ??
              'Evidence artifacts, finding summaries, and verification matrix links.'}
          </p>
          <p
            role="note"
            data-testid="evidence-catalog-disclaimer"
            style={{
              marginTop: 'var(--space-2)',
              color: 'var(--color-warning-text)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Scenario reference catalog: badges describe expected examples, not a live platform health check.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            style={{
              backgroundColor: activeTab === 'packages' ? 'var(--color-primary-600)' : 'var(--color-bg-surface-raised)',
              color: activeTab === 'packages' ? 'var(--color-primary-contrast)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-default)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
            }}
          >
            Finding Packages (7)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            style={{
              backgroundColor: activeTab === 'tools' ? 'var(--color-primary-600)' : 'var(--color-bg-surface-raised)',
              color: activeTab === 'tools' ? 'var(--color-primary-contrast)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-default)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
            }}
          >
            Telemetry &amp; Simulators
          </button>
        </div>
      </div>

      {/* Primary Tab: Finding Packages Dashboard */}
      {activeTab === 'packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Summary Metric Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Total Findings
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                7
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Baseline
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-info-text)' }}>
                1
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Critical Defects
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-error-text)' }}>
                2
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                High Severity
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: '#fb923c' }}>
                3
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Medium Severity
              </div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-warning-text)' }}>
                1
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Filter by Severity:
            </span>
            {['all', 'baseline', 'critical', 'high', 'medium'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                style={{
                  backgroundColor:
                    selectedSeverity === sev ? 'var(--color-primary-600)' : 'var(--color-bg-surface-raised)',
                  color: selectedSeverity === sev ? 'var(--color-primary-contrast)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Findings Cards Grid */}
          <div
            data-testid="evidence-packages-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {filteredPackages.map((pkg) => {
              const sev = SEVERITY_COLORS[pkg.severity];

              return (
                <div
                  key={pkg.id}
                  data-testid={`finding-card-${pkg.scenario}`}
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    {/* Header Row: ID + Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: 'var(--color-accent-500)',
                        }}
                      >
                        {pkg.id}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span
                          style={{
                            backgroundColor: sev.bg,
                            color: sev.text,
                            border: `1px solid ${sev.border}`,
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {pkg.severity}
                        </span>

                        <span
                          style={{
                            backgroundColor: 'var(--color-bg-subtle)',
                            color: 'var(--color-text-secondary)',
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                          }}
                        >
                          {pkg.status}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {pkg.title}
                    </h2>

                    {/* Summary */}
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        marginTop: 'var(--space-2)',
                        lineHeight: 'var(--line-height-normal)',
                      }}
                    >
                      {pkg.summary}
                    </p>

                    {/* Behavior Comparison */}
                    <div
                      style={{
                        marginTop: 'var(--space-3)',
                        backgroundColor: 'var(--color-bg-canvas)',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Expected:</strong>{' '}
                        <span style={{ color: 'var(--color-success-text)' }}>{pkg.expectedBehavior}</span>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Observed:</strong>{' '}
                        <span style={{ color: pkg.severity === 'Baseline' ? 'var(--color-info-text)' : 'var(--color-error-text)' }}>
                          {pkg.observedDefect}
                        </span>
                      </div>
                    </div>

                    {/* 4 Verification Layers Badges */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginTop: 'var(--space-3)',
                      }}
                    >
                      {pkg.verificationLayers.map((layer) => (
                        <span
                          key={layer}
                          style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-family-mono)',
                            backgroundColor: 'var(--color-bg-surface-raised)',
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border-subtle)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {layer}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Links */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--color-border-subtle)',
                      paddingTop: 'var(--space-3)',
                      marginTop: 'var(--space-2)',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Link
                      href={pkg.scenarioPath}
                      data-testid={`link-scenario-${pkg.scenario}`}
                      style={{
                        backgroundColor: 'var(--color-primary-600)',
                        color: 'var(--color-primary-contrast)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        textDecoration: 'none',
                      }}
                    >
                      Launch Scenario →
                    </Link>

                    <Link
                      href="/crm"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-xs)',
                        textDecoration: 'none',
                      }}
                    >
                      View in CRM
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary Tab: Live Telemetry & Realism Tools */}
      {activeTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Consent Banner Manager */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              Consent Mode v2 Simulation
            </h3>
            <ConsentBanner forceOpen={true} />
          </div>

          {/* Environment Simulator Controls */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              Environment &amp; Fault Simulator Controls
            </h3>
            <TestConditionsPanel />
          </div>

          {/* Observability Timeline Panel */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              Observability Timeline &amp; Evidence Exporter
            </h3>
            <ObservabilityPanel scenario="evidence-hub" />
          </div>
        </div>
      )}
    </section>
  );
}
