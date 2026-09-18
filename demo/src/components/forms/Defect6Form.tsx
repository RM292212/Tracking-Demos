// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: Webhook field mapping misconfiguration leaving lead_source empty and dropping campaign.
// Do not copy into production.

'use client';

import React, { useState, useEffect } from 'react';
import { buildAnalyticsPayload } from '@/lib/contracts/events';
import type { AttributionParams, AttributionState } from '@/lib/contracts/attribution';
import type { LeadSubmissionPayload, CrmRecord } from '@/lib/contracts/crm';

export interface Defect6FormProps {
  initialAttribution?: AttributionParams;
  onSubmissionSuccess?: (result: {
    payload: LeadSubmissionPayload;
    crmRecord: CrmRecord | null;
  }) => void;
}

export function Defect6Form({
  initialAttribution,
  onSubmissionSuccess,
}: Defect6FormProps): React.ReactElement {
  // Complete, valid paid media campaign attribution
  const [attribution, setAttribution] = useState<AttributionState>({
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'responselock_demo',
    gclid: 'DEMO-GCLID-001',
  });

  // Client form field state (fictional defaults)
  const [formData, setFormData] = useState({
    full_name: 'Jane Doe',
    work_email: 'demo.user@example.com',
    company_name: 'Example Media Group',
    monthly_ad_spend: '$10k-$50k',
    primary_challenge: 'CRM Webhook Discrepancies & Attribution Integrity',
    phone: '+1-555-0199',
    website: '', // Honeypot field
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<LeadSubmissionPayload | null>(null);
  const [storedCrmRecord, setStoredCrmRecord] = useState<CrmRecord | null>(null);

  useEffect(() => {
    if (initialAttribution) {
      setAttribution((prev) => ({ ...prev, ...initialAttribution }));
      return;
    }

    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const parsed: AttributionParams = {};
      if (params.get('utm_source')) parsed.utm_source = params.get('utm_source')!;
      if (params.get('utm_medium')) parsed.utm_medium = params.get('utm_medium')!;
      if (params.get('utm_campaign')) parsed.utm_campaign = params.get('utm_campaign')!;
      if (params.get('gclid')) parsed.gclid = params.get('gclid')!;
      if (params.get('gbraid')) parsed.gbraid = params.get('gbraid')!;
      if (params.get('wbraid')) parsed.wbraid = params.get('wbraid')!;

      if (Object.keys(parsed).length > 0) {
        setAttribution((prev) => ({ ...prev, ...parsed }));
      }
    }
  }, [initialAttribution]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }
    if (
      !formData.work_email ||
      !formData.work_email.includes('@') ||
      !formData.work_email.includes('.')
    ) {
      errors.work_email = 'A valid work email is required';
    }
    if (!formData.company_name || formData.company_name.trim().length < 2) {
      errors.company_name = 'Company name is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot check
    if (formData.website) {
      setSubmitError('Submission rejected by security verification.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : '660e8400-e29b-41d4-a716-446655440000';

      // 1. Defect 6 sends fully intact, valid attribution data from the client
      const payload: LeadSubmissionPayload = {
        submission_id: submissionId,
        scenario: 'defect-6',
        full_name: formData.full_name,
        work_email: formData.work_email,
        company_name: formData.company_name,
        monthly_ad_spend: formData.monthly_ad_spend,
        primary_challenge: formData.primary_challenge,
        phone: formData.phone || '',
        website: formData.website || '',
        attribution: { ...attribution },
        attribution_status: 'present',
      };

      setSubmittedPayload(payload);

      // 2. POST to /api/leads with Idempotency-Key
      // The API route succeeds (201 Created), but internally applies mappers/defect-06.ts
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.errors
            ? Object.values(errJson.errors).join(', ')
            : `Server returned HTTP ${response.status}`
        );
      }

      // 3. Client push: analytics conversion event fires with status 'present'
      // GTM and GA4 observe a successful conversion with valid parameters
      const analyticsPayload = buildAnalyticsPayload({
        scenario: 'defect-6',
        submissionId,
        attributionStatus: 'present',
      });

      if (typeof window !== 'undefined') {
        const win = window as unknown as { dataLayer?: unknown[] };
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push(analyticsPayload);
      }

      // 4. Retrieve stored CRM record from simulated CRM API
      let crmRecord: CrmRecord | null = null;
      try {
        const crmRes = await fetch('/api/crm');
        if (crmRes.ok) {
          const crmJson = await crmRes.json();
          if (Array.isArray(crmJson.records)) {
            const found = crmJson.records.find(
              (r: CrmRecord) => r.submission_id === submissionId
            );
            if (found) {
              crmRecord = found;
              setStoredCrmRecord(found);
            }
          }
        }
      } catch (crmFetchErr) {
        console.warn('Unable to query CRM API:', crmFetchErr);
      }

      if (onSubmissionSuccess) {
        onSubmissionSuccess({ payload, crmRecord });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown submission error';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '860px',
        margin: '0 auto',
      }}
    >
      {/* Live status announcements for assistive technology */}
      <div
        role="status"
        aria-live="polite"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {isSubmitting
          ? 'Submitting form...'
          : submittedPayload
          ? 'Form submission completed. CRM record contains corrupted mapping.'
          : ''}
      </div>

      {/* Form Container */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-text-primary)',
              }}
            >
              Audit Request with Valid Campaign Attribution
            </h2>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                border: '1px solid var(--color-success-border)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Attribution: Full Campaign Suite
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-1)',
            }}
          >
            Client submits: <code>utm_source=google</code>, <code>utm_medium=cpc</code>,{' '}
            <code>utm_campaign=responselock_demo</code>, <code>gclid=DEMO-GCLID-001</code>.
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {/* Honeypot field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="defect6-website">Website</label>
            <input
              id="defect6-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <label
                  htmlFor="defect6-fullname"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Full Name *
                </label>
                <input
                  id="defect6-fullname"
                  name="full_name"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.full_name)}
                  aria-describedby={fieldErrors.full_name ? 'defect6-fullname-error' : undefined}
                  value={formData.full_name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-canvas)',
                    border: `1px solid ${
                      fieldErrors.full_name ? 'var(--color-error-border)' : 'var(--color-border-default)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                {fieldErrors.full_name && (
                  <p
                    id="defect6-fullname-error"
                    style={{
                      color: 'var(--color-error-text)',
                      fontSize: 'var(--font-size-xs)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="defect6-email"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Work Email *
                </label>
                <input
                  id="defect6-email"
                  name="work_email"
                  type="email"
                  required
                  aria-invalid={Boolean(fieldErrors.work_email)}
                  aria-describedby={fieldErrors.work_email ? 'defect6-email-error' : undefined}
                  value={formData.work_email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-canvas)',
                    border: `1px solid ${
                      fieldErrors.work_email ? 'var(--color-error-border)' : 'var(--color-border-default)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                {fieldErrors.work_email && (
                  <p
                    id="defect6-email-error"
                    style={{
                      color: 'var(--color-error-text)',
                      fontSize: 'var(--font-size-xs)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {fieldErrors.work_email}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <label
                  htmlFor="defect6-company"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Company Name *
                </label>
                <input
                  id="defect6-company"
                  name="company_name"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.company_name)}
                  aria-describedby={fieldErrors.company_name ? 'defect6-company-error' : undefined}
                  value={formData.company_name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-canvas)',
                    border: `1px solid ${
                      fieldErrors.company_name ? 'var(--color-error-border)' : 'var(--color-border-default)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)',
                  }}
                />
                {fieldErrors.company_name && (
                  <p
                    id="defect6-company-error"
                    style={{
                      color: 'var(--color-error-text)',
                      fontSize: 'var(--font-size-xs)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {fieldErrors.company_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="defect6-spend"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Monthly Ad Spend
                </label>
                <select
                  id="defect6-spend"
                  name="monthly_ad_spend"
                  value={formData.monthly_ad_spend}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-canvas)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  <option value="<$10k">&lt; $10,000 / mo</option>
                  <option value="$10k-$50k">$10,000 - $50,000 / mo</option>
                  <option value="$50k-$100k">$50,000 - $100,000 / mo</option>
                  <option value="$100k+">$100,000+ / mo</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="defect6-challenge"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--space-1)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Primary Challenge
              </label>
              <input
                id="defect6-challenge"
                name="primary_challenge"
                type="text"
                value={formData.primary_challenge}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-bg-canvas)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-base)',
                }}
              />
            </div>

            {submitError && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--color-error-bg)',
                  border: '1px solid var(--color-error-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error-text)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {submitError}
              </div>
            )}

            <div style={{ marginTop: 'var(--space-2)' }}>
              <button
                type="submit"
                data-testid="defect6-submit-button"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? 'var(--color-border-strong)' : 'var(--color-primary-600)',
                  color: 'var(--color-primary-contrast)',
                  padding: 'var(--space-2) var(--space-5)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Submitting & Mapping...' : 'Submit Lead (Trigger Defect 6 Mapper)'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comparison Panel: Submitted Client Payload vs Stored CRM Record */}
      <div
        data-testid="defect6-comparison-panel"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-text-primary)',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              Payload vs. Stored CRM Integrity Comparison
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              Demonstrating the breakdown between valid marketing conversion tracking and corrupted CRM storage.
            </p>
          </div>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              background: storedCrmRecord ? 'var(--color-error-bg)' : 'var(--color-bg-surface-raised)',
              color: storedCrmRecord ? 'var(--color-error-text)' : 'var(--color-text-muted)',
              border: `1px solid ${storedCrmRecord ? 'var(--color-error-border)' : 'transparent'}`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {storedCrmRecord ? 'Mapping: CORRUPTED' : 'Awaiting Submission'}
          </span>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            data-testid="crm-comparison-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--color-border-default)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>
                  Attribution Field
                </th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-success-text)' }}>
                  Client Submitted Payload (Intact)
                </th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-error-text)' }}>
                  Server CRM Store (Mappers/Defect-06)
                </th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-warning-text)' }}>
                  Integrity Status
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Lead Source */}
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  <code>lead_source</code> (Primary Source)
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code>{submittedPayload ? submittedPayload.attribution?.utm_source || 'google' : 'google'}</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code style={{ color: 'var(--color-error-text)', fontWeight: 'bold' }}>
                    {storedCrmRecord ? storedCrmRecord.lead_source || '"" (EMPTY)' : '(pending submit)'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span
                    style={{
                      background: 'var(--color-error-bg)',
                      color: 'var(--color-error-text)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    DROPPED
                  </span>
                </td>
              </tr>

              {/* Row 2: Lead Source Detail */}
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  <code>lead_source_detail</code> (Medium / Type)
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code>{submittedPayload ? submittedPayload.attribution?.utm_medium || 'cpc' : 'cpc'}</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code style={{ color: 'var(--color-warning-text)', fontWeight: 'bold' }}>
                    {storedCrmRecord ? storedCrmRecord.lead_source_detail : '(pending submit)'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span
                    style={{
                      background: 'var(--color-warning-bg)',
                      color: 'var(--color-warning-text)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    MISMAPPED (Source copied here)
                  </span>
                </td>
              </tr>

              {/* Row 3: Campaign Name */}
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  <code>campaign_name</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code>
                    {submittedPayload
                      ? submittedPayload.attribution?.utm_campaign || 'responselock_demo'
                      : 'responselock_demo'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code style={{ color: 'var(--color-error-text)', fontWeight: 'bold' }}>
                    {storedCrmRecord ? storedCrmRecord.campaign_name || '"" (EMPTY)' : '(pending submit)'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span
                    style={{
                      background: 'var(--color-error-bg)',
                      color: 'var(--color-error-text)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    DROPPED
                  </span>
                </td>
              </tr>

              {/* Row 4: GCLID */}
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  <code>gclid</code> (Google Click ID)
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code>{submittedPayload ? submittedPayload.attribution?.gclid || 'DEMO-GCLID-001' : 'DEMO-GCLID-001'}</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code style={{ color: 'var(--color-success-text)' }}>
                    {storedCrmRecord ? storedCrmRecord.gclid : '(pending submit)'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span
                    style={{
                      background: 'var(--color-success-bg)',
                      color: 'var(--color-success-text)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    INTACT
                  </span>
                </td>
              </tr>

              {/* Row 5: Mapping Status */}
              <tr>
                <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                  <code>mapping_status</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code>valid</code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <code style={{ color: 'var(--color-error-text)', fontWeight: 'bold' }}>
                    {storedCrmRecord ? storedCrmRecord.mapping_status : '(pending submit)'}
                  </code>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span
                    style={{
                      background: 'var(--color-error-bg)',
                      color: 'var(--color-error-text)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    CORRUPTED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
