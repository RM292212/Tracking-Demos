'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LeadSubmissionPayloadSchema, LeadSubmissionResponseSuccessSchema, type LeadSubmissionRequest, type LeadSubmissionResponseSuccess } from '@/lib/contracts/schema';
import { captureAttribution } from '@/lib/attribution';
import { getV2AttributionForSubmission } from '@/lib/v2-attribution';
import { env } from '@/lib/env';
import { validateLeadFormFields, type ValidationErrors } from '@/lib/validation';
import { buildV2LeadSuccessPayload, countV2CanonicalEvents, sanitizeV2Attribution, type V2LeadSuccessPayload } from '@/lib/v2-events';
import { getV2PendingRequest, markV2EventEmitted, setV2PendingRequest, setV2RetrySubmissionId, wasV2EventEmitted } from '@/lib/v2-dedupe';

declare global {
  interface Window {
    dataLayer?: unknown[];
    google_tag_manager?: Record<string, unknown>;
  }
}

type FormValues = { name: string; email: string; company: string; phone: string; message: string };
type CrmEvidence = { lead_source?: string; campaign_name?: string; gclid?: string; mapping_status?: string };
type CrmCheck = 'idle' | 'found' | 'missing' | 'unavailable';

const EMPTY_VALUES: FormValues = { name: '', email: '', company: '', phone: '', message: '' };
const RECEIPT_KEY = 'responselock_v2_last_confirmed_receipt';

function createId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

function getPersistedReceipt(): LeadSubmissionResponseSuccess | null {
  try {
    const raw = window.sessionStorage.getItem(RECEIPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = LeadSubmissionResponseSuccessSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export interface BusinessLeadFormProps {
  showEvidence?: boolean;
  showDemoActions?: boolean;
  onReady?: () => void;
}

const DEMO_VALUES: FormValues = { name: 'Jordan Lee', email: 'jordan.lee@example.com', company: 'Alder Office Services', phone: '+1-202-555-0100', message: 'We are reviewing our lead capture and attribution workflow.' };

export function BusinessLeadForm({ showEvidence = false, showDemoActions = false, onReady }: BusinessLeadFormProps = {}): React.ReactElement {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<LeadSubmissionResponseSuccess | null>(null);
  const [retryPayload, setRetryPayload] = useState<LeadSubmissionRequest | null>(null);
  const [eventPayload, setEventPayload] = useState<V2LeadSuccessPayload | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [crmEvidence, setCrmEvidence] = useState<CrmEvidence | null>(null);
  const [crmCheck, setCrmCheck] = useState<CrmCheck>('idle');
  const [apiState, setApiState] = useState<'idle' | 'confirmed' | 'duplicate' | 'restored' | 'failed'>('idle');
  const [hasHydrated, setHasHydrated] = useState(false);
  const [eventIsCurrentPage, setEventIsCurrentPage] = useState(false);
  const [submitSyntheticAfterFill, setSubmitSyntheticAfterFill] = useState(false);
  const [attribution, setAttribution] = useState<Record<string, string>>({});
  const [attributionStatus, setAttributionStatus] = useState<'present' | 'partial' | 'missing' | 'dropped'>('missing');
  const [gtmLoadState, setGtmLoadState] = useState<'unknown' | 'loaded' | 'failed'>('unknown');
  const requestLock = useRef(false);
  const retryId = useRef<string | null>(null);
  const receiptId = useRef<string | null>(null);
  const eventPayloadRef = useRef<V2LeadSuccessPayload | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const refreshEvidence = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setEventCount(countV2CanonicalEvents(window.dataLayer));
    try {
      const raw = window.sessionStorage.getItem('responselock_v2_last_event');
      if (raw && !eventPayloadRef.current) {
        const previousEvent = JSON.parse(raw) as V2LeadSuccessPayload;
        eventPayloadRef.current = previousEvent;
        setEventPayload(previousEvent);
      }
    } catch { /* evidence remains based on live dataLayer */ }
    const saved = getPersistedReceipt();
    if (saved && !receiptId.current) {
      receiptId.current = saved.submission_id;
      setReceipt(saved);
      setApiState('restored');
    }
    try {
      const response = await fetch('/api/crm', { cache: 'no-store' });
      if (!response.ok) { setCrmCheck('unavailable'); return; }
      const body = await response.json() as { records?: Array<Record<string, unknown>> };
      if (!Array.isArray(body.records)) { setCrmCheck('unavailable'); return; }
      const record = body.records?.find((row) => row.submission_id === (saved?.submission_id ?? receiptId.current));
      if (record) setCrmEvidence({
        lead_source: typeof record.lead_source === 'string' ? record.lead_source : '',
        campaign_name: typeof record.campaign_name === 'string' ? record.campaign_name : '',
        gclid: typeof record.gclid === 'string' ? record.gclid : '',
        mapping_status: typeof record.mapping_status === 'string' ? record.mapping_status : '',
      });
      setCrmCheck(record ? 'found' : 'missing');
    } catch { setCrmCheck('unavailable'); }
  }, []);

  useEffect(() => {
    captureAttribution();
    const active = getV2AttributionForSubmission();
    setAttribution(active.safeAttribution);
    setAttributionStatus(active.attribution_status);
    const pendingResult = LeadSubmissionPayloadSchema.safeParse(getV2PendingRequest());
    if (pendingResult.success) {
      const pending = pendingResult.data as LeadSubmissionRequest;
      retryId.current = pending.submission_id;
      setRetryPayload(pending);
      setValues({ name: pending.full_name, email: pending.work_email, company: pending.company_name, phone: pending.phone ?? '', message: pending.notes ?? '' });
    } else {
      retryId.current = null;
      setV2RetrySubmissionId(null);
      setV2PendingRequest(null);
    }
    const saved = getPersistedReceipt();
    if (saved) { receiptId.current = saved.submission_id; setReceipt(saved); setApiState('restored'); }
    const onGtmLoad = (event: Event) => {
      const state = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (state === 'loaded' || state === 'failed') setGtmLoadState(state);
    };
    window.addEventListener('responselock:gtm-load', onGtmLoad);
    const externalGtm = document.getElementById('gtm-external-container') as HTMLScriptElement | null;
    if (externalGtm) {
      if (externalGtm.dataset['loadState'] === 'loaded' || window.google_tag_manager) setGtmLoadState('loaded');
      else if (externalGtm.dataset['loadState'] === 'failed') setGtmLoadState('failed');
    }
    refreshEvidence();
    setEventCount(countV2CanonicalEvents(window.dataLayer));
    setHasHydrated(true);
    return () => window.removeEventListener('responselock:gtm-load', onGtmLoad);
  }, [refreshEvidence]);

  useEffect(() => {
    if (!showDemoActions) return;
    const runSynthetic = () => {
      setValues(DEMO_VALUES);
      setErrors({});
      setMessage('Running the synthetic example through the real local form endpoint…');
      setSubmitSyntheticAfterFill(true);
    };
    window.addEventListener('responselock:v2-run-synthetic', runSynthetic);
    onReady?.();
    return () => window.removeEventListener('responselock:v2-run-synthetic', runSynthetic);
  }, [showDemoActions, onReady]);

  useEffect(() => {
    if (!submitSyntheticAfterFill || !hasHydrated || values.email !== DEMO_VALUES.email) return;
    setSubmitSyntheticAfterFill(false);
    formRef.current?.requestSubmit();
  }, [submitSyntheticAfterFill, hasHydrated, values.email]);

  const submitRequest = useCallback(async (payload: LeadSubmissionRequest, replay = false) => {
    if (requestLock.current) return;
    requestLock.current = true;
    setSubmitting(true);
    setMessage(replay ? 'Checking whether this request was already saved…' : 'Sending consultation request…');
    setApiState('idle');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.submission_id },
        body: JSON.stringify(payload),
      });
      const raw: unknown = await response.json();
      const parsed = LeadSubmissionResponseSuccessSchema.safeParse(raw);
      if (!response.ok || !parsed.success || parsed.data.submission_id !== payload.submission_id || parsed.data.scenario !== 'baseline') {
        setApiState('failed');
        setMessage('We could not confirm your request. Please retry or start over.');
        setErrors({ form: 'We could not save this request. Please retry or start over.' });
        return;
      }

      const result = parsed.data;
      receiptId.current = result.submission_id;
      setReceipt(result);
      setMessage(result.duplicate ? 'The API confirmed this request was already saved.' : 'The API confirmed the lead was saved.');
      setApiState(result.duplicate ? 'duplicate' : 'confirmed');
      setRetryPayload(payload);
      try { window.sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(result)); } catch { /* in-memory receipt is authoritative */ }

      let emitted = false;
      if (!wasV2EventEmitted(result.submission_id)) {
        const event = buildV2LeadSuccessPayload({
          submissionId: result.submission_id,
          attributionStatus: payload.attribution_status,
          attribution: sanitizeV2Attribution(payload.attribution as Record<string, unknown>),
          timestamp: result.created_at,
        });
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(event);
        markV2EventEmitted(result.submission_id);
        emitted = true;
        setEventCount(countV2CanonicalEvents(window.dataLayer));
        eventPayloadRef.current = event;
        setEventPayload(event);
        setEventIsCurrentPage(true);
        try { window.sessionStorage.setItem('responselock_v2_last_event', JSON.stringify(event)); } catch { /* local dataLayer remains authoritative */ }
      }
      window.dispatchEvent(new CustomEvent('responselock:v2-confirmed', { detail: { duplicate: Boolean(result.duplicate), emitted, submission_id: result.submission_id } }));
      retryId.current = null;
      setV2RetrySubmissionId(null);
      setV2PendingRequest(null);
      await refreshEvidence();
    } catch {
      setApiState('failed');
      setMessage('We could not confirm your request. You can retry safely.');
    } finally {
      requestLock.current = false;
      setSubmitting(false);
    }
  }, [refreshEvidence]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestLock.current) return;
    if (receiptId.current) {
      setMessage('This request is already confirmed. Start another request to create a new lead.');
      return;
    }
    if (retryPayload) {
      void submitRequest(retryPayload, true);
      return;
    }
    setErrors({});
    const validation = validateLeadFormFields({
      full_name: values.name,
      work_email: values.email,
      company_name: values.company,
      phone: values.phone,
      notes: values.message,
    });
    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      setMessage('Please correct the highlighted fields. Nothing has been sent yet.');
      window.dispatchEvent(new Event('responselock:v2-validation-failed'));
      return;
    }
    const key = retryId.current ?? createId();
    retryId.current = key;
    setV2RetrySubmissionId(key);
    const active = getV2AttributionForSubmission();
    const safeAttribution = active.safeAttribution;
    const payload: LeadSubmissionRequest = {
      submission_id: key,
      scenario: 'baseline',
      full_name: validation.data.full_name,
      work_email: validation.data.work_email,
      company_name: validation.data.company_name,
      phone: validation.data.phone ?? '',
      notes: validation.data.notes ?? '',
      monthly_ad_spend: '',
      primary_challenge: 'Consultation request',
      website: '',
      fax: '',
      attribution: safeAttribution,
      attribution_status: active.attribution_status,
    };
    setAttribution(safeAttribution);
    setAttributionStatus(active.attribution_status);
    setRetryPayload(payload);
    setV2PendingRequest(payload);
    void submitRequest(payload);
  }

  function loadDemoValues() {
    setValues(DEMO_VALUES);
    setErrors({});
    setMessage('Synthetic example values loaded. The email uses example.com; no real contact details are included.');
  }

  function startAnotherRequest() {
    receiptId.current = null;
    retryId.current = null;
    setV2RetrySubmissionId(null);
    setV2PendingRequest(null);
    try { window.sessionStorage.removeItem(RECEIPT_KEY); } catch { /* in-memory form remains usable */ }
    setValues(EMPTY_VALUES);
    setErrors({});
    setReceipt(null);
    setRetryPayload(null);
    setCrmEvidence(null);
    setApiState('idle');
    setMessage('Ready for a new consultation request.');
  }

  const inputClass = (field: string) => `business-input${errors[field] ? ' business-input-error' : ''}`;

  return (
    <div className="business-lead-layout">
      <section className="business-form-card">
        <header className="business-card-heading">
          <span className="business-eyebrow">Alder Office Services</span>
          <h2>Request a consultation</h2>
          <p>{showEvidence ? 'Your details are stored in the local demo CRM. The dataLayer carries a PII-free conversion event; downstream tag delivery is unverified.' : 'Tell us about your workplace. This portfolio form saves your request locally.'}</p>
        </header>
        {showDemoActions && <div className="business-form-actions"><button type="button" className="business-quiet-button" onClick={loadDemoValues}>Use synthetic demo details</button></div>}
        <form ref={formRef} onSubmit={handleSubmit} method="post" noValidate className="business-form" data-testid="business-lead-form">
          <div className="business-field-grid">
            <label className="business-field" htmlFor="alder-name">Name<input id="alder-name" className={inputClass('full_name')} name="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? 'alder-name-error' : undefined} autoComplete="name" />{errors.full_name && <small id="alder-name-error" role="alert">{errors.full_name}</small>}</label>
            <label className="business-field" htmlFor="alder-email">Work email<input id="alder-email" className={inputClass('work_email')} type="email" name="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} aria-invalid={Boolean(errors.work_email)} aria-describedby={errors.work_email ? 'alder-email-error' : undefined} autoComplete="email" />{errors.work_email && <small id="alder-email-error" role="alert">{errors.work_email}</small>}</label>
            <label className="business-field" htmlFor="alder-company">Company<input id="alder-company" className={inputClass('company_name')} name="company" value={values.company} onChange={(e) => setValues({ ...values, company: e.target.value })} aria-invalid={Boolean(errors.company_name)} aria-describedby={errors.company_name ? 'alder-company-error' : undefined} autoComplete="organization" />{errors.company_name && <small id="alder-company-error" role="alert">{errors.company_name}</small>}</label>
            <label className="business-field" htmlFor="alder-phone">Phone <span>Optional</span><input id="alder-phone" className={inputClass('phone')} type="tel" name="phone" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'alder-phone-error' : undefined} autoComplete="tel" />{errors.phone && <small id="alder-phone-error" role="alert">{errors.phone}</small>}</label>
          </div>
          <label className="business-field" htmlFor="alder-message">How can we help?<span>Optional · 500 characters</span><textarea id="alder-message" className={inputClass('notes')} name="message" maxLength={500} rows={4} value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} aria-invalid={Boolean(errors.notes)} aria-describedby={errors.notes ? 'alder-message-error' : undefined} />{errors.notes && <small id="alder-message-error" role="alert">{errors.notes}</small>}</label>
          {errors.form && <p className="business-error" role="alert">{errors.form}</p>}
          <div className="business-submit-row"><button className="business-primary-button" type="submit" disabled={submitting || !hasHydrated || Boolean(receipt)}>{submitting ? 'Sending…' : receipt ? 'Request confirmed' : !hasHydrated ? 'Preparing form…' : retryPayload ? 'Retry saved request' : 'Request consultation'}</button><span>{showEvidence ? 'Local CRM write · external tag receipt unverified' : 'Portfolio demonstration · no purchase required'}</span></div>
        </form>
        <p className="business-live-message" role="status" aria-live="polite">{message}</p>
        {receipt && <div className="business-confirmation" data-testid="business-confirmation"><strong>{apiState === 'duplicate' ? 'This request is already saved' : apiState === 'restored' ? showEvidence && crmCheck === 'missing' ? 'A previous request was confirmed, but its record is no longer in the current demo CRM.' : 'Your previous request was confirmed.' : 'Your request has been saved to the local demo CRM.'}</strong>{showEvidence && <><span>Record ID <code>{receipt.submission_id}</code></span><span>Created {new Date(receipt.created_at).toLocaleString()}</span></>}</div>}
        {apiState === 'failed' && retryPayload && <div className="business-confirmation-actions"><button type="button" className="business-quiet-button" disabled={submitting} onClick={() => void submitRequest(retryPayload, true)}>{showEvidence ? 'Retry the same saved request' : 'Try again'}</button><button type="button" className="business-quiet-button" disabled={submitting} onClick={startAnotherRequest}>{showEvidence ? 'Cancel this retry and start over' : 'Start over'}</button></div>}
        {receipt && <div className="business-confirmation-actions">{showEvidence && retryPayload && <button type="button" className="business-quiet-button" disabled={submitting} onClick={() => void submitRequest(retryPayload, true)}>Replay same request to demonstrate duplicate protection</button>}<button type="button" className="business-primary-button" onClick={startAnotherRequest}>{showEvidence ? 'Start another request' : 'Send another inquiry'}</button></div>}
      </section>

      {showEvidence && <aside className="business-evidence-card" data-testid="business-evidence-panel" aria-live="polite">
        <div className="business-evidence-heading"><div><span className="business-eyebrow">Live evidence</span><h2>What this browser can prove</h2></div><span className="business-evidence-dot" /></div>
        <div className="business-evidence-grid">
          <div><span>Lead API</span><strong className={`business-state-${apiState}`}>{apiState === 'confirmed' ? 'Confirmed · new record' : apiState === 'duplicate' ? 'Confirmed · duplicate' : apiState === 'restored' ? 'Earlier API confirmation restored' : apiState === 'failed' ? 'Unconfirmed' : 'Waiting for submission'}</strong></div>
          <div><span>Saved CRM record</span><strong>{crmEvidence ? 'Matched by submission ID' : receipt && crmCheck === 'missing' ? 'Not found in current CRM' : receipt && crmCheck === 'unavailable' ? 'CRM readback unavailable' : receipt ? 'Checking CRM record…' : 'No confirmed record yet'}</strong></div>
          <div><span>Canonical dataLayer events</span><strong data-testid="business-event-count">{eventCount}</strong></div>
          <div><span>Duplicate protection</span><strong>{receipt ? 'Session ID guard active' : 'Ready'}</strong></div>
          <div><span>GTM container configuration</span><strong>{env.gtmStatus === 'configured' ? 'Configured' : env.gtmStatus === 'invalid' ? 'Invalid ID' : 'Absent'}</strong></div>
          <div><span>GTM container script</span><strong>{gtmLoadState === 'loaded' ? 'External script loaded' : gtmLoadState === 'failed' ? 'External script failed' : 'Load not yet observed'}</strong></div>
          <div><span>GTM tags · GA4 · Ads receipt</span><strong>Unverified here</strong></div>
        </div>
        <div className="business-attribution-card"><h3>Attribution sent to the local lead API</h3><dl>
          <div><dt>Status</dt><dd>{attributionStatus}</dd></div>
          <div><dt>Source / medium</dt><dd>{[attribution.utm_source, attribution.utm_medium].filter(Boolean).join(' / ') || '—'}</dd></div>
          <div><dt>Campaign</dt><dd>{attribution.utm_campaign || '—'}</dd></div>
          <div><dt>Term / content</dt><dd>{[attribution.utm_term, attribution.utm_content].filter(Boolean).join(' / ') || '—'}</dd></div>
          <div><dt>GCLID</dt><dd>{attribution.gclid || '—'}</dd></div>
        </dl></div>
        <div className="business-attribution-card"><h3>Persisted CRM attribution</h3>{crmEvidence ? <dl>
          <div><dt>Lead source</dt><dd>{crmEvidence.lead_source || '—'}</dd></div><div><dt>Campaign</dt><dd>{crmEvidence.campaign_name || '—'}</dd></div><div><dt>GCLID</dt><dd>{crmEvidence.gclid || '—'}</dd></div><div><dt>Mapping</dt><dd>{crmEvidence.mapping_status || '—'}</dd></div>
        </dl> : <p>{receipt ? 'Waiting for the CRM API to return the matching saved record.' : 'A CRM comparison appears after a confirmed submission.'}</p>}</div>
        <details className="business-payload-details"><summary>Inspect actual canonical event payload</summary>
          {eventPayload ? <><p>{eventIsCurrentPage ? 'Captured from this page’s current dataLayer push:' : 'Saved payload from an earlier page visit in this tab; it is not counted as a current-page push:'}</p><pre>{JSON.stringify(eventPayload, null, 2)}</pre><p>The count above is read only from this page’s live dataLayer. The event contains no form values.</p></> : <p>No canonical event has been pushed in this page session.</p>}
        </details>
        <p className="business-evidence-boundary">A local API confirmation and dataLayer push do not prove GTM tag execution, GA4 receipt, or Google Ads receipt. No enhanced conversions or Meta transmission is configured by this form.</p>
      </aside>}
    </div>
  );
}
