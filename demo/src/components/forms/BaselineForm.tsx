'use client';

/**
 * ResponseLock Baseline Lead Capture Form Component
 * Location: demo/src/components/forms/BaselineForm.tsx
 *
 * Implements the intact 12-step marketing conversion chain:
 * 1. User completes form
 * 2. Client validation passes
 * 3. submission_id (UUID v4) generated
 * 4. Attribution read from persisted storage
 * 5. Sanitized payload POSTed with Idempotency-Key
 * 6. Server validates and returns 201 Created
 * 7. Exactly 1 CRM record created
 * 8. Success UI renders from verified server response
 * 9. Exactly 1 demo_lead_success pushed to window.dataLayer
 * 10. Payload contains only the 7 approved keys (zero PII)
 * 11. GTM can respond to custom event trigger
 * 12. Timeline reflects complete sequence
 */

import React, { useState, useEffect } from 'react';
import { SuccessPanel } from '@/components/ui/SuccessPanel';
import {
  captureAttribution,
  getAttributionForSubmission,
} from '@/lib/attribution';
import {
  validateLeadFormFields,
  type ValidationErrors,
  type LeadFormValues,
} from '@/lib/validation';
import { buildAnalyticsPayload } from '@/lib/contracts/events';
import type {
  LeadSubmissionRequest,
  LeadSubmissionResponseSuccess,
} from '@/lib/contracts/schema';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export interface BaselineFormProps {
  onSubmitted?: (response: LeadSubmissionResponseSuccess) => void;
}

/**
 * RFC4122-compliant UUID v4 generation.
 */
function generateSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function BaselineForm({ onSubmitted }: BaselineFormProps): React.ReactElement {
  const [formData, setFormData] = useState<LeadFormValues>({
    full_name: '',
    work_email: '',
    company_name: '',
    monthly_ad_spend: '',
    primary_challenge: '',
    phone: '',
    notes: '',
    website: '',
    fax: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [submissionResponse, setSubmissionResponse] =
    useState<LeadSubmissionResponseSuccess | null>(null);

  // Capture attribution from URL params on component mount
  useEffect(() => {
    captureAttribution();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for edited field
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: '',
      work_email: '',
      company_name: '',
      monthly_ad_spend: '',
      primary_challenge: '',
      phone: '',
      notes: '',
      website: '',
      fax: '',
    });
    setErrors({});
    setIsSubmitting(false);
    setStatusAnnouncement('Form has been reset.');
    setServerError(null);
    setSubmissionResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    // Step 1 & 2: Client validation
    const validation = validateLeadFormFields(formData as unknown as Record<string, unknown>);

    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0] || 'Validation failed';
      setStatusAnnouncement(`Form contains errors: ${firstError}`);
      // Invariant: Zero network requests dispatched on validation failure
      return;
    }

    setIsSubmitting(true);
    setStatusAnnouncement('Validating and submitting audit inquiry...');

    try {
      // Step 3: Generate submission_id (UUID v4)
      const submissionId = generateSubmissionId();

      // Step 4: Retrieve persisted attribution state and derive status
      const { attribution, attribution_status } = getAttributionForSubmission();

      // Construct verified request payload
      const validData = validation.data!;
      const payload: LeadSubmissionRequest = {
        submission_id: submissionId,
        scenario: 'baseline',
        full_name: validData.full_name,
        work_email: validData.work_email,
        company_name: validData.company_name,
        monthly_ad_spend: validData.monthly_ad_spend || '',
        primary_challenge: validData.primary_challenge || '',
        phone: validData.phone || '',
        notes: validData.notes || '',
        website: formData.website || '',
        fax: formData.fax || '',
        attribution,
        attribution_status,
      };

      // Step 5: Send POST request with Idempotency-Key matching submission_id
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Submission failed. Please check your inputs.';
        try {
          const errData = await response.json();
          if (errData.errors) {
            setErrors(errData.errors);
          }
          if (errData.message) {
            errorMessage = errData.message;
          }
        } catch {
          // fallback
        }
        setServerError(errorMessage);
        setStatusAnnouncement(`Submission failed: ${errorMessage}`);
        setIsSubmitting(false);
        return;
      }

      // Step 6 & 7: Server returned 201 Created and committed exactly 1 CRM record
      const result: LeadSubmissionResponseSuccess = await response.json();

      // Step 8: Render Success UI strictly from verified server response
      setSubmissionResponse(result);
      setStatusAnnouncement('Audit inquiry submitted successfully.');

      // Step 9 & 10: Push exactly 1 demo_lead_success to window.dataLayer with 7 approved keys (zero PII)
      const analyticsPayload = buildAnalyticsPayload({
        scenario: 'baseline',
        submissionId: result.submission_id,
        attributionStatus: attribution_status,
      });

      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(analyticsPayload);
      }

      if (onSubmitted) {
        onSubmitted(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setServerError(msg);
      setStatusAnnouncement(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If server confirmed submission, render SuccessPanel
  if (submissionResponse) {
    return (
      <SuccessPanel
        submissionId={submissionResponse.submission_id}
        createdAt={submissionResponse.created_at}
        status={submissionResponse.status}
        scenario="baseline"
        onReset={handleReset}
      />
    );
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg-surface)',
    border: `1px solid ${hasError ? 'var(--color-error-border)' : 'var(--color-border-default)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-sans)',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: 'var(--space-1)',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div
      data-testid="baseline-form-container"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        marginTop: 'var(--space-6)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Request ResponseLock Audit ($350 Fixed-Scope)
        </h2>
        <p
          style={{
            marginTop: 'var(--space-1)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Comprehensive lead &amp; conversion integrity audit for paid media agencies.
          Fill in the details below to test the baseline valid submission chain.
        </p>
      </div>

      {/* WCAG live region for assistive technology announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="baseline-status-region"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {statusAnnouncement}
      </div>

      {serverError && (
        <div
          role="alert"
          data-testid="baseline-server-error"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error-text)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {serverError}
        </div>
      )}

      {/* Semantic form with noValidate */}
      <form
        noValidate
        onSubmit={handleSubmit}
        data-testid="baseline-form"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* Anti-spam honeypot fields visually hidden */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <label htmlFor="baseline-website">Do not fill this field</label>
          <input
            type="text"
            id="baseline-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website || ''}
            onChange={handleChange}
          />
          <label htmlFor="baseline-fax">Do not fill this field</label>
          <input
            type="text"
            id="baseline-fax"
            name="fax"
            tabIndex={-1}
            autoComplete="off"
            value={formData.fax || ''}
            onChange={handleChange}
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="baseline-full-name" style={labelStyle}>
            Full Name <span aria-hidden="true" style={{ color: 'var(--color-error-text)' }}>*</span>
          </label>
          <input
            type="text"
            id="baseline-full-name"
            name="full_name"
            data-testid="baseline-full-name"
            value={formData.full_name}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? 'baseline-full-name-error' : undefined}
            style={inputStyle(Boolean(errors.full_name))}
            placeholder="e.g. Alex Morgan"
            disabled={isSubmitting}
          />
          {errors.full_name && (
            <span
              id="baseline-full-name-error"
              role="alert"
              data-testid="baseline-full-name-error"
              style={{
                display: 'block',
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.full_name}
            </span>
          )}
        </div>

        {/* Work Email */}
        <div>
          <label htmlFor="baseline-work-email" style={labelStyle}>
            Work Email <span aria-hidden="true" style={{ color: 'var(--color-error-text)' }}>*</span>
          </label>
          <input
            type="email"
            id="baseline-work-email"
            name="work_email"
            data-testid="baseline-work-email"
            value={formData.work_email}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={Boolean(errors.work_email)}
            aria-describedby={errors.work_email ? 'baseline-work-email-error' : undefined}
            style={inputStyle(Boolean(errors.work_email))}
            placeholder="e.g. alex@example.com"
            disabled={isSubmitting}
          />
          {errors.work_email && (
            <span
              id="baseline-work-email-error"
              role="alert"
              data-testid="baseline-work-email-error"
              style={{
                display: 'block',
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.work_email}
            </span>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="baseline-company-name" style={labelStyle}>
            Company / Agency Name <span aria-hidden="true" style={{ color: 'var(--color-error-text)' }}>*</span>
          </label>
          <input
            type="text"
            id="baseline-company-name"
            name="company_name"
            data-testid="baseline-company-name"
            value={formData.company_name}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={Boolean(errors.company_name)}
            aria-describedby={errors.company_name ? 'baseline-company-name-error' : undefined}
            style={inputStyle(Boolean(errors.company_name))}
            placeholder="e.g. Apex Digital Media"
            disabled={isSubmitting}
          />
          {errors.company_name && (
            <span
              id="baseline-company-name-error"
              role="alert"
              data-testid="baseline-company-name-error"
              style={{
                display: 'block',
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.company_name}
            </span>
          )}
        </div>

        {/* Monthly Ad Spend */}
        <div>
          <label htmlFor="baseline-ad-spend" style={labelStyle}>
            Monthly Client Ad Spend Under Management
          </label>
          <select
            id="baseline-ad-spend"
            name="monthly_ad_spend"
            data-testid="baseline-ad-spend"
            value={formData.monthly_ad_spend}
            onChange={handleChange}
            style={inputStyle(false)}
            disabled={isSubmitting}
          >
            <option value="">Select spend tier...</option>
            <option value="<$10k">&lt; $10,000 / month</option>
            <option value="$10k-$50k">$10,000 – $50,000 / month</option>
            <option value="$50k-$150k">$50,000 – $150,000 / month</option>
            <option value="$150k+">$150,000+ / month</option>
          </select>
        </div>

        {/* Primary Conversion Challenge */}
        <div>
          <label htmlFor="baseline-challenge" style={labelStyle}>
            Primary Conversion Integrity Challenge
          </label>
          <select
            id="baseline-challenge"
            name="primary_challenge"
            data-testid="baseline-challenge"
            value={formData.primary_challenge}
            onChange={handleChange}
            style={inputStyle(false)}
            disabled={isSubmitting}
          >
            <option value="">Select primary challenge...</option>
            <option value="Conversion Discrepancy (CRM vs GA4/Ads)">
              Conversion Discrepancy (CRM vs GA4 / Google Ads)
            </option>
            <option value="Attribution Loss Across Funnels">
              Attribution Loss Across Funnels / Subdomains
            </option>
            <option value="Duplicate Conversion Fires">
              Duplicate Conversion Fires on Page Reload
            </option>
            <option value="Missing GA4 Key Events">
              Missing GA4 Key Events / Trigger Failures
            </option>
            <option value="CRM Mismapping & Incomplete Records">
              CRM Mismapping &amp; Incomplete Records
            </option>
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label htmlFor="baseline-notes" style={labelStyle}>
            Additional Audit Notes (Optional)
          </label>
          <textarea
            id="baseline-notes"
            name="notes"
            data-testid="baseline-notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            style={{
              ...inputStyle(false),
              resize: 'vertical',
            }}
            placeholder="Mention any specific tracking hurdles, GTM container nuances, or landing page frameworks..."
            disabled={isSubmitting}
          />
        </div>

        {/* Submit button disabling during flight */}
        <div style={{ marginTop: 'var(--space-2)' }}>
          <button
            type="submit"
            data-testid="baseline-submit-button"
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              backgroundColor: isSubmitting
                ? 'var(--color-bg-surface-raised)'
                : 'var(--color-primary-600)',
              color: isSubmitting
                ? 'var(--color-text-muted)'
                : 'var(--color-primary-contrast)',
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isSubmitting ? (
              <>
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Processing Audit Inquiry...
              </>
            ) : (
              'Request $350 Audit Inquiry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
