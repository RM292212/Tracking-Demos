'use client';

import React, { useState, useEffect } from 'react';
import { LEGACY_MISSPELLED_EVENT } from '@/lib/stale-constants';
import { deriveAttributionStatus, AttributionState } from '@/lib/contracts/attribution';
import { captureAttribution } from '@/lib/attribution';

interface FormErrors {
  full_name?: string;
  work_email?: string;
  company_name?: string;
  general?: string;
}

export function Defect3Form(): React.ReactElement {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [monthlyAdSpend, setMonthlyAdSpend] = useState('$5k-$20k');
  const [primaryChallenge, setPrimaryChallenge] = useState('Attribution mismatch');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    captureAttribution();
  }, []);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      nextErrors.full_name = 'Full name must be at least 2 characters';
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!workEmail.trim() || !emailPattern.test(workEmail.trim())) {
      nextErrors.work_email = 'A valid email address is required';
    }

    if (!companyName.trim() || companyName.trim().length < 2) {
      nextErrors.company_name = 'Company name is required (min 2 characters)';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getAttributionFromStorage = (): AttributionState => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.sessionStorage.getItem('rl_last_touch');
      if (stored) {
        return JSON.parse(stored) as AttributionState;
      }
    } catch {
      // Ignore storage parse errors
    }
    return {};
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Client-side validation: must pass before any network call
    if (!validate()) {
      return;
    }

    // 2. Honeypot check
    if (websiteHoneypot) {
      setErrors({ general: 'Submission rejected' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const submissionId = crypto.randomUUID();
    const attribution = getAttributionFromStorage();
    const attributionStatus = deriveAttributionStatus(attribution);

    const payload = {
      submission_id: submissionId,
      scenario: 'defect-3' as const,
      full_name: fullName.trim(),
      work_email: workEmail.trim(),
      company_name: companyName.trim(),
      monthly_ad_spend: monthlyAdSpend,
      primary_challenge: primaryChallenge,
      website: '',
      attribution,
      attribution_status: attributionStatus,
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setErrors({
          general:
            (errData as { message?: string }).message ||
            'Submission failed. Please check form errors.',
        });
        setIsSubmitting(false);
        return;
      }

      // Success: exactly 1 CRM record is created on the server
      setSubmittedId(submissionId);
      setIsSubmitted(true);
      setIsSubmitting(false);

      // INTENTIONAL DEFECT: On post-success handling, push stale constant LEGACY_MISSPELLED_EVENT
      // instead of canonical 'demo_lead_success'.
      // GTM trigger listens for 'demo_lead_success' -> trigger NEVER fires.
      const analyticsPayload = {
        event: LEGACY_MISSPELLED_EVENT, // 'demo_lead_sucess'
        form_id: 'lead_audit_demo',
        lead_type: 'agency_audit_inquiry',
        scenario: 'defect-3' as const,
        submission_id: submissionId,
        attribution_status: attributionStatus,
        debug_mode: true as const,
      };

      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(analyticsPayload);
      }
    } catch (err) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : 'Network connection error during submission.',
      });
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmittedId(null);
    setFullName('');
    setWorkEmail('');
    setCompanyName('');
    setErrors({});
  };

  if (isSubmitted) {
    return (
      <div
        data-testid="defect-3-success-container"
        style={{
          background: 'var(--color-bg-surface-raised)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg, rgba(16, 185, 129, 0.12))',
              color: 'var(--color-success-text, #34d399)',
              fontWeight: 'bold',
            }}
          >
            ✓
          </span>
          <h2 style={{ fontSize: 'var(--font-size-lg, 1.25rem)', margin: 0, color: 'var(--color-text-primary)' }}>
            Lead Submitted Successfully
          </h2>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          The server accepted the request with <strong>201 Created</strong> and exactly 1 CRM record
          was persisted to the database store.
        </p>

        <div
          style={{
            background: 'var(--color-bg-canvas)',
            padding: '1rem',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: '1.5rem',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-sm, 0.875rem)',
          }}
        >
          <div><strong>Submission ID:</strong> <span data-testid="submission-id-display">{submittedId}</span></div>
          <div style={{ marginTop: '0.25rem' }}><strong>Server Status:</strong> confirmed (201 Created)</div>
          <div style={{ marginTop: '0.25rem' }}><strong>CRM Storage:</strong> 1 row written</div>
        </div>

        {/* Diagnostic Callout for Defect 3 */}
        <div
          data-testid="defect-3-diagnostic"
          style={{
            background: 'var(--color-error-bg, rgba(239, 68, 68, 0.14))',
            border: '1px solid var(--color-error-border, #ef4444)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--color-error-text, #f87171)', fontWeight: 'bold' }}>⚠️</span>
            <strong style={{ color: 'var(--color-error-text, #f87171)' }}>
              Tracking Defect Active: Event Name Drift
            </strong>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
            The post-success handler imported and pushed stale constant:
          </p>
          <div
            style={{
              background: 'var(--color-bg-canvas)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm, 4px)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-error-text, #f87171)',
            }}
          >
            event: &apos;{LEGACY_MISSPELLED_EVENT}&apos; &nbsp; <span style={{ color: 'var(--color-text-secondary)' }}>(Expected by GTM: &apos;demo_lead_success&apos;)</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
            Because GTM trigger looks for <code>demo_lead_success</code>, this custom event will <strong>never match</strong>.
            The lead is safely stored in the CRM, but invisible to GA4 and Google Ads!
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          style={{
            background: 'var(--color-primary-600, #2563eb)',
            color: 'var(--color-primary-contrast, #ffffff)',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md, 6px)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-testid="defect-3-form"
      style={{
        background: 'var(--color-bg-surface-raised)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg, 8px)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {errors.general && (
        <div
          role="alert"
          style={{
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error-text)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
          }}
        >
          {errors.general}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="defect3-full-name"
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            marginBottom: '0.375rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Full Name <span style={{ color: 'var(--color-error-text)' }}>*</span>
        </label>
        <input
          id="defect3-full-name"
          name="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={errors.full_name ? 'defect3-fullname-error' : undefined}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-bg-surface)',
            border: errors.full_name
              ? '1px solid var(--color-error-border)'
              : '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base, 1rem)',
          }}
        />
        {errors.full_name && (
          <p
            id="defect3-fullname-error"
            role="alert"
            style={{
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            {errors.full_name}
          </p>
        )}
      </div>

      {/* Work Email */}
      <div>
        <label
          htmlFor="defect3-work-email"
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            marginBottom: '0.375rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Work Email <span style={{ color: 'var(--color-error-text)' }}>*</span>
        </label>
        <input
          id="defect3-work-email"
          name="work_email"
          type="email"
          value={workEmail}
          onChange={(e) => setWorkEmail(e.target.value)}
          placeholder="jane@example.com"
          aria-invalid={Boolean(errors.work_email)}
          aria-describedby={errors.work_email ? 'defect3-email-error' : undefined}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-bg-surface)',
            border: errors.work_email
              ? '1px solid var(--color-error-border)'
              : '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base, 1rem)',
          }}
        />
        {errors.work_email && (
          <p
            id="defect3-email-error"
            role="alert"
            style={{
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            {errors.work_email}
          </p>
        )}
      </div>

      {/* Company Name */}
      <div>
        <label
          htmlFor="defect3-company-name"
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            marginBottom: '0.375rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Agency / Company Name <span style={{ color: 'var(--color-error-text)' }}>*</span>
        </label>
        <input
          id="defect3-company-name"
          name="company_name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Apex Media Partners"
          aria-invalid={Boolean(errors.company_name)}
          aria-describedby={errors.company_name ? 'defect3-company-error' : undefined}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-bg-surface)',
            border: errors.company_name
              ? '1px solid var(--color-error-border)'
              : '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base, 1rem)',
          }}
        />
        {errors.company_name && (
          <p
            id="defect3-company-error"
            role="alert"
            style={{
              color: 'var(--color-error-text)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            {errors.company_name}
          </p>
        )}
      </div>

      {/* Monthly Ad Spend */}
      <div>
        <label
          htmlFor="defect3-monthly-ad-spend"
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            marginBottom: '0.375rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Monthly Paid Media Spend
        </label>
        <select
          id="defect3-monthly-ad-spend"
          name="monthly_ad_spend"
          value={monthlyAdSpend}
          onChange={(e) => setMonthlyAdSpend(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base, 1rem)',
          }}
        >
          <option value="<$5k">&lt; $5,000 / month</option>
          <option value="$5k-$20k">$5,000 – $20,000 / month</option>
          <option value="$20k-$50k">$20,000 – $50,000 / month</option>
          <option value="$50k+">$50,000+ / month</option>
        </select>
      </div>

      {/* Primary Challenge */}
      <div>
        <label
          htmlFor="defect3-primary-challenge"
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            marginBottom: '0.375rem',
            color: 'var(--color-text-primary)',
          }}
        >
          Primary Conversion Integrity Challenge
        </label>
        <select
          id="defect3-primary-challenge"
          name="primary_challenge"
          value={primaryChallenge}
          onChange={(e) => setPrimaryChallenge(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md, 6px)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base, 1rem)',
          }}
        >
          <option value="Attribution mismatch">Attribution mismatch (GA4 vs CRM)</option>
          <option value="Offline conversion imports failing">Offline conversion imports failing</option>
          <option value="Ghost conversions">Ghost conversions on invalid forms</option>
          <option value="Auditing agency tracking setup">Auditing client conversion tracking</option>
          <option value="Other">Other tracking anomaly</option>
        </select>
      </div>

      {/* Honeypot field (hidden from real users) */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="defect3-website">Leave blank</label>
        <input
          id="defect3-website"
          type="text"
          name="website"
          value={websiteHoneypot}
          onChange={(e) => setWebsiteHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: isSubmitting
            ? 'var(--color-bg-surface-hover, #374151)'
            : 'var(--color-primary-600, #2563eb)',
          color: 'var(--color-primary-contrast, #ffffff)',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md, 6px)',
          fontSize: 'var(--font-size-base, 1rem)',
          fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          marginTop: '0.5rem',
        }}
      >
        {isSubmitting ? 'Processing Submission...' : 'Request Integrity Audit'}
      </button>
    </form>
  );
}
