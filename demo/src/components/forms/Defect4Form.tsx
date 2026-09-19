'use client';

import React, { useState, useEffect } from 'react';
import {
  buildDefect04AnalyticsPayload,
  buildExpectedDefect04Payload,
  Defect04ActualPayload,
  ExpectedAnalyticsPayload,
} from '@/lib/mappers/defect-04';
import { deriveAttributionStatus, AttributionState } from '@/lib/contracts/attribution';
import { captureAttribution } from '@/lib/attribution';
import { PayloadDiffViewer } from '@/components/ui/PayloadDiffViewer';

interface FormErrors {
  full_name?: string;
  work_email?: string;
  company_name?: string;
  general?: string;
}

export function Defect4Form(): React.ReactElement {
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

  const [expectedPayload, setExpectedPayload] = useState<ExpectedAnalyticsPayload | null>(null);
  const [actualPayload, setActualPayload] = useState<Defect04ActualPayload | null>(null);

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
      scenario: 'defect-4' as const,
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

      // Success: CRM record created on the server
      // INTENTIONAL DEFECT: Build mutated dataLayer payload exhibiting schema drift
      // The mapper reads from context.formId (which is undefined since caller passes form_id)
      // and sets lead_type to 'contact'.
      const expected = buildExpectedDefect04Payload({
        submissionId,
        attributionStatus,
        scenario: 'defect-4',
      });

      const actual = buildDefect04AnalyticsPayload({
        submissionId,
        attributionStatus,
        scenario: 'defect-4',
        form_id: 'lead_audit_demo', // Intentionally ignored by mapper looking for formId!
      });

      setSubmittedId(submissionId);
      setExpectedPayload(expected);
      setActualPayload(actual);
      setIsSubmitted(true);
      setIsSubmitting(false);

      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(actual);
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
    setExpectedPayload(null);
    setActualPayload(null);
    setFullName('');
    setWorkEmail('');
    setCompanyName('');
    setErrors({});
  };

  if (isSubmitted && expectedPayload && actualPayload) {
    return (
      <div
        data-testid="defect-4-success-container"
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

        {/* Payload Diff Viewer displaying expected vs actual dataLayer push */}
        <PayloadDiffViewer
          expectedPayload={expectedPayload as unknown as Record<string, unknown>}
          actualPayload={actualPayload as unknown as Record<string, unknown>}
        />

        <div style={{ marginTop: '1.5rem' }}>
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
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-testid="defect-4-form"
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
          htmlFor="defect4-full-name"
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
          id="defect4-full-name"
          name="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={errors.full_name ? 'defect4-fullname-error' : undefined}
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
            id="defect4-fullname-error"
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
          htmlFor="defect4-work-email"
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
          id="defect4-work-email"
          name="work_email"
          type="email"
          value={workEmail}
          onChange={(e) => setWorkEmail(e.target.value)}
          placeholder="jane@example.com"
          aria-invalid={Boolean(errors.work_email)}
          aria-describedby={errors.work_email ? 'defect4-email-error' : undefined}
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
            id="defect4-email-error"
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
          htmlFor="defect4-company-name"
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
          id="defect4-company-name"
          name="company_name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Apex Media Partners"
          aria-invalid={Boolean(errors.company_name)}
          aria-describedby={errors.company_name ? 'defect4-company-error' : undefined}
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
            id="defect4-company-error"
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
          htmlFor="defect4-monthly-ad-spend"
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
          id="defect4-monthly-ad-spend"
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
          htmlFor="defect4-primary-challenge"
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
          id="defect4-primary-challenge"
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
        <label htmlFor="defect4-website">Leave blank</label>
        <input
          id="defect4-website"
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
