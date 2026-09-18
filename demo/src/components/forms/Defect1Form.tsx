// INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: GTM Click-All Elements trigger bound to submit button before validation. Do not copy into production.

'use client';

/**
 * ResponseLock Defect 1 Form Component
 * Location: demo/src/components/forms/Defect1Form.tsx
 *
 * Demonstrates a premature GTM click trigger firing before form validation.
 * When the user clicks the submit button, a conversion event is pushed to dataLayer
 * immediately. When client validation fails, submission is blocked (zero network requests,
 * zero CRM writes), but the false conversion has already been recorded in analytics!
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  buildAnalyticsPayload,
  type AnalyticsPayload,
} from '@/lib/contracts/events';
import {
  deriveAttributionStatus,
  type AttributionState,
  type AttributionStatus,
  ATTRIBUTION_STORAGE_KEYS,
} from '@/lib/contracts/attribution';
import type { LeadSubmissionResponseSuccess } from '@/lib/contracts/schema';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

interface FormState {
  full_name: string;
  work_email: string;
  company_name: string;
  monthly_ad_spend: string;
  primary_challenge: string;
  phone: string;
  notes: string;
  website: string; // Hidden honeypot
}

const INITIAL_FORM_STATE: FormState = {
  full_name: '',
  work_email: '',
  company_name: '',
  monthly_ad_spend: '$5,000 - $25,000',
  primary_challenge: 'Discrepancy between Ads & CRM',
  phone: '',
  notes: '',
  website: '',
};

export function Defect1Form(): React.ReactElement {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] =
    useState<LeadSubmissionResponseSuccess | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Tracks the active submission UUID generated on click
  const activeSubmissionIdRef = useRef<string>(crypto.randomUUID());
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Helper to read marketing attribution from URL or storage
  const getAttributionContext = useCallback((): {
    state: AttributionState;
    status: AttributionStatus;
  } => {
    if (typeof window === 'undefined') {
      return { state: {}, status: 'missing' };
    }

    let current: AttributionState = {};
    let firstTouch: AttributionState | null = null;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlParams: AttributionState = {};
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');
      const utmTerm = params.get('utm_term');
      const utmContent = params.get('utm_content');
      const gclid = params.get('gclid');
      const gbraid = params.get('gbraid');
      const wbraid = params.get('wbraid');

      if (utmSource) urlParams.utm_source = utmSource;
      if (utmMedium) urlParams.utm_medium = utmMedium;
      if (utmCampaign) urlParams.utm_campaign = utmCampaign;
      if (utmTerm) urlParams.utm_term = utmTerm;
      if (utmContent) urlParams.utm_content = utmContent;
      if (gclid) urlParams.gclid = gclid;
      if (gbraid) urlParams.gbraid = gbraid;
      if (wbraid) urlParams.wbraid = wbraid;

      if (Object.keys(urlParams).length > 0) {
        current = urlParams;
      }
    } catch {}

    try {
      const sessionData = sessionStorage.getItem(
        ATTRIBUTION_STORAGE_KEYS.LAST_TOUCH_SESSION
      );
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        current = { ...parsed, ...current };
      }
    } catch {}

    try {
      const match = document.cookie.match(
        new RegExp(
          '(^| )' + ATTRIBUTION_STORAGE_KEYS.FIRST_TOUCH_COOKIE + '=([^;]+)'
        )
      );
      if (match && match[2]) {
        firstTouch = JSON.parse(decodeURIComponent(match[2]));
      }
    } catch {}

    const status = deriveAttributionStatus(current, firstTouch);
    return { state: current, status };
  }, []);

  // Defect 1 Premature Trigger Handler
  const handlePrematureButtonClick = useCallback((): void => {
    // INTENTIONAL DEFECT — EDUCATIONAL. Real-world analogue: GTM Click-All Elements trigger bound to submit button before validation. Do not copy into production.
    const submissionId = crypto.randomUUID();
    activeSubmissionIdRef.current = submissionId;

    const { status } = getAttributionContext();

    const payload: AnalyticsPayload = buildAnalyticsPayload({
      scenario: 'defect-1',
      submissionId,
      attributionStatus: status,
    });

    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    }
  }, [getAttributionContext]);

  // Bind the DOM click listener directly to the submit button
  useEffect(() => {
    const button = submitButtonRef.current;
    if (!button) return;

    const onButtonClick = (_e: MouseEvent): void => {
      handlePrematureButtonClick();
    };

    button.addEventListener('click', onButtonClick);
    return () => {
      button.removeEventListener('click', onButtonClick);
    };
  }, [handlePrematureButtonClick]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.work_email.trim()) {
      newErrors.work_email = 'Work email is required';
    } else if (!emailRegex.test(formData.work_email.trim())) {
      newErrors.work_email = 'A valid email address is required';
    }

    if (
      !formData.company_name.trim() ||
      formData.company_name.trim().length < 2
    ) {
      newErrors.company_name = 'Company name is required';
    }

    return newErrors;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setServerError(null);

    // 1. Client-side form validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // VALIDATION FAILED: Form submission aborts!
      // Invariant: ZERO network requests, ZERO CRM rows written.
      // BUT because of Defect 1, the click listener ALREADY pushed demo_lead_success to dataLayer!
      return;
    }

    // 2. Client validation passed -> Proceed to API submission
    setIsSubmitting(true);
    const submissionId = activeSubmissionIdRef.current;
    const { state: attributionData, status: attributionStatus } =
      getAttributionContext();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionId,
        },
        body: JSON.stringify({
          submission_id: submissionId,
          scenario: 'defect-1',
          full_name: formData.full_name.trim(),
          work_email: formData.work_email.trim(),
          company_name: formData.company_name.trim(),
          monthly_ad_spend: formData.monthly_ad_spend,
          primary_challenge: formData.primary_challenge,
          phone: formData.phone.trim(),
          notes: formData.notes.trim(),
          website: formData.website, // Honeypot
          attribution: attributionData,
          attribution_status: attributionStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setServerError(
          errorData.message ||
            `Server returned ${response.status}: Failed to record lead`
        );
        return;
      }

      const result: LeadSubmissionResponseSuccess = await response.json();
      setSubmissionResult(result);
    } catch {
      setServerError('A network error occurred while submitting the lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Server-Confirmed Success Panel
  if (submissionResult) {
    return (
      <section
        className="form-success-panel"
        aria-live="polite"
        style={{
          background: 'var(--color-bg-surface-raised)',
          border: '1px solid var(--color-success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginTop: 'var(--space-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-success-border)',
            }}
          />
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-success-text)',
              margin: 0,
            }}
          >
            Audit Request Confirmed (Server 201 Created)
          </h2>
        </div>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Your audit request was successfully received and written to the
          simulated CRM store.
        </p>

        <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            border: '1px solid var(--color-border-subtle)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div>
            <strong style={{ color: 'var(--color-text-secondary)' }}>
              Submission ID:{' '}
            </strong>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {submissionResult.submission_id}
            </span>
          </div>
          <div>
            <strong style={{ color: 'var(--color-text-secondary)' }}>
              Status:{' '}
            </strong>
            <span style={{ color: 'var(--color-success-text)' }}>
              {submissionResult.status}
            </span>
          </div>
          <div>
            <strong style={{ color: 'var(--color-text-secondary)' }}>
              Timestamp:{' '}
            </strong>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {submissionResult.created_at}
            </span>
          </div>
          <div>
            <strong style={{ color: 'var(--color-text-secondary)' }}>
              Scenario:{' '}
            </strong>
            <span style={{ color: 'var(--color-accent-500)' }}>defect-1</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSubmissionResult(null);
            setFormData(INITIAL_FORM_STATE);
            setErrors({});
            activeSubmissionIdRef.current = crypto.randomUUID();
          }}
          style={{
            marginTop: 'var(--space-4)',
            background: 'transparent',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
        >
          Submit Another Request
        </button>
      </section>
    );
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        marginTop: 'var(--space-4)',
      }}
    >
      {/* Educational Defect Indicator Banner */}
      <div
        role="note"
        style={{
          background: 'var(--color-error-bg)',
          borderLeft: '4px solid var(--color-error-border)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-error-text)',
        }}
      >
        <strong>Defect Mechanism Active:</strong> Submit button has an unvalidated
        click trigger attached. Clicking submit on an empty or invalid form will
        fire a <code>demo_lead_success</code> conversion event to{' '}
        <code>window.dataLayer</code> before validation fails!
      </div>

      {/* Accessible Status Announcement Region */}
      <div aria-live="polite" aria-atomic="true">
        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            style={{
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Please correct the {Object.keys(errors).length} highlighted error(s)
            below before submitting.
          </div>
        )}
        {serverError && (
          <div
            role="alert"
            style={{
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {serverError}
          </div>
        )}
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {/* Honeypot field (hidden from genuine users, traps automated bots) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="defect1-website">Leave this field blank</label>
          <input
            id="defect1-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={handleChange}
          />
        </div>

        {/* Full Name Field */}
        <div>
          <label
            htmlFor="defect1-full_name"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Full Name <span style={{ color: 'var(--color-error-border)' }}>*</span>
          </label>
          <input
            id="defect1-full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            value={formData.full_name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? 'defect1-full_name-error' : undefined}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: `1px solid ${
                errors.full_name
                  ? 'var(--color-error-border)'
                  : 'var(--color-border-default)'
              }`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          />
          {errors.full_name && (
            <div
              id="defect1-full_name-error"
              role="alert"
              style={{
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.full_name}
            </div>
          )}
        </div>

        {/* Work Email Field */}
        <div>
          <label
            htmlFor="defect1-work_email"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Work Email <span style={{ color: 'var(--color-error-border)' }}>*</span>
          </label>
          <input
            id="defect1-work_email"
            name="work_email"
            type="email"
            required
            autoComplete="email"
            value={formData.work_email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.work_email)}
            aria-describedby={
              errors.work_email ? 'defect1-work_email-error' : undefined
            }
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: `1px solid ${
                errors.work_email
                  ? 'var(--color-error-border)'
                  : 'var(--color-border-default)'
              }`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          />
          {errors.work_email && (
            <div
              id="defect1-work_email-error"
              role="alert"
              style={{
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.work_email}
            </div>
          )}
        </div>

        {/* Company Name Field */}
        <div>
          <label
            htmlFor="defect1-company_name"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Company Name{' '}
            <span style={{ color: 'var(--color-error-border)' }}>*</span>
          </label>
          <input
            id="defect1-company_name"
            name="company_name"
            type="text"
            required
            autoComplete="organization"
            value={formData.company_name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.company_name)}
            aria-describedby={
              errors.company_name ? 'defect1-company_name-error' : undefined
            }
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: `1px solid ${
                errors.company_name
                  ? 'var(--color-error-border)'
                  : 'var(--color-border-default)'
              }`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          />
          {errors.company_name && (
            <div
              id="defect1-company_name-error"
              role="alert"
              style={{
                color: 'var(--color-error-text)',
                fontSize: 'var(--font-size-xs)',
                marginTop: 'var(--space-1)',
              }}
            >
              {errors.company_name}
            </div>
          )}
        </div>

        {/* Monthly Ad Spend Select */}
        <div>
          <label
            htmlFor="defect1-monthly_ad_spend"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Monthly Ad Spend
          </label>
          <select
            id="defect1-monthly_ad_spend"
            name="monthly_ad_spend"
            value={formData.monthly_ad_spend}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          >
            <option value="< $5,000">&lt; $5,000 / month</option>
            <option value="$5,000 - $25,000">$5,000 - $25,000 / month</option>
            <option value="$25,000 - $100,000">$25,000 - $100,000 / month</option>
            <option value="$100,000+">$100,000+ / month</option>
          </select>
        </div>

        {/* Primary Audit Focus */}
        <div>
          <label
            htmlFor="defect1-primary_challenge"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Primary Audit Focus
          </label>
          <select
            id="defect1-primary_challenge"
            name="primary_challenge"
            value={formData.primary_challenge}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          >
            <option value="High CPA / Low Conversion Rate">
              High CPA / Low Conversion Rate
            </option>
            <option value="Discrepancy between Ads & CRM">
              Discrepancy between Ads &amp; CRM
            </option>
            <option value="Attribution Loss / Missing GCLID">
              Attribution Loss / Missing GCLID
            </option>
            <option value="Duplicate / Phantom Leads">
              Duplicate / Phantom Leads
            </option>
          </select>
        </div>

        {/* Phone Field (Optional) */}
        <div>
          <label
            htmlFor="defect1-phone"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Phone Number (optional)
          </label>
          <input
            id="defect1-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
            }}
          />
        </div>

        {/* Audit Context / Notes */}
        <div>
          <label
            htmlFor="defect1-notes"
            style={{
              display: 'block',
              marginBottom: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            Audit Context / Notes (optional)
          </label>
          <textarea
            id="defect1-notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-canvas)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-md)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Submit Button (Disables during flight in Defect 1) */}
        <div style={{ marginTop: 'var(--space-2)' }}>
          <button
            ref={submitButtonRef}
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: isSubmitting
                ? 'var(--color-bg-surface-hover)'
                : 'var(--color-primary-600)',
              color: 'var(--color-primary-contrast)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            {isSubmitting
              ? 'Submitting Lead...'
              : 'Request Conversion Audit ($350)'}
          </button>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              marginTop: 'var(--space-2)',
            }}
          >
            Fixed $350 ResponseLock conversion audit scope. Educational demo
            environment.
          </p>
        </div>
      </form>
    </div>
  );
}
