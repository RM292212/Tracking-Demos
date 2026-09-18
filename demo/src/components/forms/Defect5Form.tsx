// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: SPA client-side step navigation dropping query parameters without persisting attribution.
// Do not copy into production.

'use client';

import React, { useState, useEffect } from 'react';
import { buildAnalyticsPayload } from '@/lib/contracts/events';
import {
  type AttributionParams,
  type AttributionState,
  deriveAttributionStatus,
  hasAnyAttribution,
} from '@/lib/contracts/attribution';
import type { LeadSubmissionPayload, CrmRecord } from '@/lib/contracts/crm';

export interface Defect5FormProps {
  initialSearch?: string;
  onSubmissionSuccess?: (result: {
    payload: LeadSubmissionPayload;
    crmRecord: CrmRecord | null;
  }) => void;
}

/**
 * Utility to extract attribution query parameters from a URL search string.
 */
export function extractAttributionFromSearch(search: string): AttributionParams {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const result: AttributionParams = {};

  const utmSource = params.get('utm_source');
  if (utmSource) result.utm_source = utmSource;

  const utmMedium = params.get('utm_medium');
  if (utmMedium) result.utm_medium = utmMedium;

  const utmCampaign = params.get('utm_campaign');
  if (utmCampaign) result.utm_campaign = utmCampaign;

  const utmTerm = params.get('utm_term');
  if (utmTerm) result.utm_term = utmTerm;

  const utmContent = params.get('utm_content');
  if (utmContent) result.utm_content = utmContent;

  const gclid = params.get('gclid');
  if (gclid) result.gclid = gclid;

  const gbraid = params.get('gbraid');
  if (gbraid) result.gbraid = gbraid;

  const wbraid = params.get('wbraid');
  if (wbraid) result.wbraid = wbraid;

  return result;
}

export function Defect5Form({
  initialSearch,
  onSubmissionSuccess,
}: Defect5FormProps): React.ReactElement {
  const [step, setStep] = useState<1 | 2>(1);

  // Form field state (initialized with compliant fictional values)
  const [formData, setFormData] = useState({
    full_name: 'Jane Doe',
    work_email: 'demo.user@example.com',
    company_name: 'Example Media Group',
    monthly_ad_spend: '$10k-$50k',
    primary_challenge: 'Attribution & Conversion Integrity',
    phone: '+1-555-0199',
    website: '', // Honeypot field
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<LeadSubmissionPayload | null>(null);
  const [storedCrmRecord, setStoredCrmRecord] = useState<CrmRecord | null>(null);

  // Tracking inspection states
  const [entrySearch, setEntrySearch] = useState<string>('');
  const [entryAttribution, setEntryAttribution] = useState<AttributionState>({});
  const [afterNavSearch, setAfterNavSearch] = useState<string>('');
  const [afterNavAttribution, setAfterNavAttribution] = useState<AttributionParams>({});

  // Capture initial landing query parameters on mount
  useEffect(() => {
    let currentSearch = initialSearch;
    if (currentSearch === undefined && typeof window !== 'undefined') {
      currentSearch = window.location.search;
    }

    const effectiveSearch = currentSearch || '';
    setEntrySearch(effectiveSearch);

    const parsed = extractAttributionFromSearch(effectiveSearch);
    if (hasAnyAttribution(parsed)) {
      setEntryAttribution(parsed);
    } else {
      // Default to demo campaign parameters if landed without query string
      const defaultDemoParams: AttributionParams = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
      };
      setEntryAttribution(defaultDemoParams);
      setEntrySearch('?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001');
    }
  }, [initialSearch]);

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

  /**
   * Validate Step 1 controls before client-side step transition.
   */
  const validateStep1 = (): boolean => {
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

  /**
   * Client-side multi-step router navigation.
   *
   * INTENTIONAL DEFECT:
   * During client-side step navigation from Step 1 to Step 2, the router replaces/pushes
   * the URL path without carrying forward the existing URL query string (?utm_source=...).
   * Furthermore, the application failed to persist the entry attribution to sessionStorage
   * or first-touch cookies.
   */
  const handleProceedToStep2 = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!validateStep1()) {
      return;
    }

    if (typeof window !== 'undefined') {
      // Flawed SPA routing: navigates to Step 2 URL without query string preservation
      const strippedPath = window.location.pathname;
      try {
        window.history.pushState({ step: 2 }, '', strippedPath);
      } catch {
        // fallback
      }
      try {
        if (window.location && window.location.search) {
          (window.location as unknown as { search?: string }).search = '';
        }
      } catch {
        // fallback
      }
      const currentSearchAfterNav = window.location.search || '';
      setAfterNavSearch(currentSearchAfterNav);
      setAfterNavAttribution(extractAttributionFromSearch(currentSearchAfterNav));
    } else {
      setAfterNavSearch('');
      setAfterNavAttribution({});
    }

    setStep(2);
  };

  const handleBackToStep1 = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStep(1);
  };

  /**
   * Step 2 Form Submission.
   *
   * INTENTIONAL DEFECT:
   * Instead of reading persisted attribution from storage (cookie / sessionStorage),
   * the submit handler reads window.location.search. Because the client router stripped
   * the query string during the step transition, window.location.search is now empty.
   * Consequently, the lead is submitted with empty attribution and attribution_status: 'dropped'.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot check
    if (formData.website) {
      setSubmitError('Submission rejected by security verification.');
      return;
    }

    // Step 2 basic validation
    if (!formData.monthly_ad_spend) {
      setFieldErrors({ monthly_ad_spend: 'Please select monthly ad spend' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate client UUID v4
      const submissionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : '550e8400-e29b-41d4-a716-446655440000';

      // 2. DEFECT: Reads window.location.search at submit time instead of reading persisted storage
      const searchAtSubmit = typeof window !== 'undefined' ? window.location.search : '';
      const submittedAttribution = extractAttributionFromSearch(searchAtSubmit);

      // 3. Derive attribution status
      // Because entryAttribution was populated but submittedAttribution is empty, deriveAttributionStatus returns 'dropped'
      const attributionStatus = deriveAttributionStatus(submittedAttribution, entryAttribution);

      // 4. Construct payload
      const payload: LeadSubmissionPayload = {
        submission_id: submissionId,
        scenario: 'defect-5',
        full_name: formData.full_name,
        work_email: formData.work_email,
        company_name: formData.company_name,
        monthly_ad_spend: formData.monthly_ad_spend,
        primary_challenge: formData.primary_challenge,
        phone: formData.phone || '',
        website: formData.website || '',
        attribution: submittedAttribution, // Intentionally empty {}
        attribution_status: attributionStatus, // 'dropped'
      };

      setSubmittedPayload(payload);

      // 5. POST to /api/leads with Idempotency-Key
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.errors
            ? Object.values(errorData.errors).join(', ')
            : `Server returned HTTP ${response.status}`
        );
      }

      // 6. Push demo_lead_success to window.dataLayer
      const analyticsPayload = buildAnalyticsPayload({
        scenario: 'defect-5',
        submissionId,
        attributionStatus: attributionStatus,
      });

      if (typeof window !== 'undefined') {
        const win = window as unknown as { dataLayer?: unknown[] };
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push(analyticsPayload);
      }

      // 7. Retrieve stored CRM record from simulated CRM API
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
        maxWidth: '820px',
        margin: '0 auto',
      }}
    >
      {/* Live status announcements for screen readers */}
      <div
        role="status"
        aria-live="polite"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {isSubmitting
          ? 'Submitting form...'
          : submittedPayload
          ? 'Form submission completed. Attribution was dropped due to SPA navigation.'
          : ''}
      </div>

      {/* Multi-step lead capture form */}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'uppercase',
                color: 'var(--color-primary-500)',
                letterSpacing: '0.05em',
              }}
            >
              Step {step} of 2
            </span>
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-text-primary)',
                marginTop: 'var(--space-1)',
              }}
            >
              {step === 1 ? '1. Contact Information' : '2. Agency & Marketing Details'}
            </h2>
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg-surface-raised)',
              color: 'var(--color-text-secondary)',
            }}
          >
            SPA Navigation Mode
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {/* Hidden Honeypot Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="defect5-website">Website</label>
            <input
              id="defect5-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleInputChange}
            />
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="defect5-fullname"
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
                  id="defect5-fullname"
                  name="full_name"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.full_name)}
                  aria-describedby={fieldErrors.full_name ? 'defect5-fullname-error' : undefined}
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
                    id="defect5-fullname-error"
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
                  htmlFor="defect5-email"
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
                  id="defect5-email"
                  name="work_email"
                  type="email"
                  required
                  aria-invalid={Boolean(fieldErrors.work_email)}
                  aria-describedby={fieldErrors.work_email ? 'defect5-email-error' : undefined}
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
                    id="defect5-email-error"
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

              <div>
                <label
                  htmlFor="defect5-company"
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
                  id="defect5-company"
                  name="company_name"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.company_name)}
                  aria-describedby={fieldErrors.company_name ? 'defect5-company-error' : undefined}
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
                    id="defect5-company-error"
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

              <div style={{ marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  data-testid="proceed-to-step-2"
                  onClick={handleProceedToStep2}
                  style={{
                    background: 'var(--color-primary-600)',
                    color: 'var(--color-primary-contrast)',
                    padding: 'var(--space-2) var(--space-5)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                  }}
                >
                  Proceed to Step 2 →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="defect5-spend"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Monthly Ad Spend *
                </label>
                <select
                  id="defect5-spend"
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

              <div>
                <label
                  htmlFor="defect5-challenge"
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
                  id="defect5-challenge"
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

              <div>
                <label
                  htmlFor="defect5-phone"
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Phone (Optional)
                </label>
                <input
                  id="defect5-phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
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

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--color-bg-surface-raised)',
                    color: 'var(--color-text-secondary)',
                    padding: 'var(--space-2) var(--space-4)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    cursor: 'pointer',
                  }}
                >
                  ← Back to Step 1
                </button>
                <button
                  type="submit"
                  data-testid="defect5-submit-button"
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
                  {isSubmitting ? 'Submitting...' : 'Submit Audit Inquiry'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation & Inspection Panel */}
      <div
        data-testid="defect5-inspection-panel"
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
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            Attribution Integrity Inspection Panel
          </h3>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              background: submittedPayload ? 'var(--color-error-bg)' : 'var(--color-bg-surface-raised)',
              color: submittedPayload ? 'var(--color-error-text)' : 'var(--color-text-muted)',
              border: `1px solid ${submittedPayload ? 'var(--color-error-border)' : 'transparent'}`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {submittedPayload ? 'Attribution Dropped' : 'Awaiting Navigation & Submit'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {/* Section 1: At Entry */}
          <div
            data-testid="inspection-at-entry"
            style={{
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}
            >
              <h4
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-accent-500)',
                }}
              >
                1. At Entry (Initial Landing)
              </h4>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-success-text)',
                }}
              >
                Parameters Present
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
                wordBreak: 'break-all',
              }}
            >
              URL Search: <code>{entrySearch || '(empty)'}</code>
            </p>
            <pre
              tabIndex={0}
              role="region"
              aria-label="Attribution state at entry"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                background: 'var(--color-bg-surface-raised)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                color: 'var(--color-text-primary)',
              }}
            >
              {JSON.stringify(entryAttribution, null, 2)}
            </pre>
          </div>

          {/* Section 2: After Navigation */}
          <div
            data-testid="inspection-after-navigation"
            style={{
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}
            >
              <h4
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-warning-text)',
                }}
              >
                2. After Navigation (Step 2 URL)
              </h4>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: step === 2 ? 'var(--color-error-text)' : 'var(--color-text-muted)',
                }}
              >
                {step === 2 ? 'Query String Stripped' : 'Pending Step 2'}
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
                wordBreak: 'break-all',
              }}
            >
              URL Search:{' '}
              <code>{step === 2 ? afterNavSearch || '"" (stripped)' : '(not navigated yet)'}</code>
            </p>
            <pre
              tabIndex={0}
              role="region"
              aria-label="Attribution state after navigation"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                background: 'var(--color-bg-surface-raised)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                color: 'var(--color-text-primary)',
              }}
            >
              {step === 2
                ? JSON.stringify(afterNavAttribution, null, 2)
                : '// Navigate to Step 2 to observe stripped query parameters'}
            </pre>
          </div>

          {/* Section 3: Submitted Payload */}
          <div
            data-testid="inspection-submitted-payload"
            style={{
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}
            >
              <h4
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-info-text)',
                }}
              >
                3. Submitted Client Payload
              </h4>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: submittedPayload ? 'var(--color-warning-text)' : 'var(--color-text-muted)',
                }}
              >
                {submittedPayload?.attribution_status || 'Pending Submit'}
              </span>
            </div>
            <pre
              tabIndex={0}
              role="region"
              aria-label="Submitted attribution payload"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                background: 'var(--color-bg-surface-raised)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                color: 'var(--color-text-primary)',
              }}
            >
              {submittedPayload
                ? JSON.stringify(
                    {
                      submission_id: submittedPayload.submission_id,
                      scenario: submittedPayload.scenario,
                      attribution: submittedPayload.attribution,
                      attribution_status: submittedPayload.attribution_status,
                    },
                    null,
                    2
                  )
                : '// Submit Step 2 to observe client payload'}
            </pre>
          </div>

          {/* Section 4: Stored CRM Fields */}
          <div
            data-testid="inspection-stored-crm"
            style={{
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}
            >
              <h4
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-error-text)',
                }}
              >
                4. Stored CRM Fields
              </h4>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: storedCrmRecord ? 'var(--color-error-text)' : 'var(--color-text-muted)',
                }}
              >
                {storedCrmRecord ? 'Blank Attribution' : 'Awaiting Write'}
              </span>
            </div>
            <pre
              tabIndex={0}
              role="region"
              aria-label="CRM record attribution data"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-mono)',
                background: 'var(--color-bg-surface-raised)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                color: 'var(--color-text-primary)',
              }}
            >
              {storedCrmRecord
                ? JSON.stringify(
                    {
                      submission_id: storedCrmRecord.submission_id,
                      lead_source: storedCrmRecord.lead_source,
                      lead_source_detail: storedCrmRecord.lead_source_detail,
                      campaign_name: storedCrmRecord.campaign_name,
                      gclid: storedCrmRecord.gclid || '(empty)',
                      mapping_status: storedCrmRecord.mapping_status,
                    },
                    null,
                    2
                  )
                : '// CRM record will appear here after submission'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
