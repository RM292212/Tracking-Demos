'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BusinessLeadForm } from '@/components/BusinessLeadForm';
import { ConsentBanner } from '@/components/ConsentBanner';
import { countV2CanonicalEvents, V2_CANONICAL_EVENT } from '@/lib/v2-events';

declare global {
  interface Window { dataLayer?: unknown[] }
}

type Confirmation = { duplicate: boolean; emitted: boolean; submission_id: string };

const DEFECTS = [
  { id: 'defect-1', label: '01 · Invalid click counted as a lead', cause: 'Click trigger runs before client validation.', severity: 'Critical', check: 'Invalid submit must cause zero canonical events and zero lead API requests.' },
  { id: 'defect-2', label: '02 · Duplicate conversion', cause: 'Legacy and new handlers both emit on success.', severity: 'High', check: 'One confirmed new record creates one canonical event; retry is deduplicated.' },
  { id: 'defect-3', label: '03 · Missing event', cause: 'A misspelled event never matches the GTM custom event trigger.', severity: 'High', check: 'Event name exactly matches demo_lead_success.' },
  { id: 'defect-4', label: '04 · Corrupt event parameters', cause: 'Contract drift omits or changes required event fields.', severity: 'High', check: 'Inspect form_id, lead_type, scenario, attribution, and timestamp in the actual payload.' },
  { id: 'defect-5', label: '05 · Attribution lost in navigation', cause: 'A client route drops landing query parameters before the form reads them.', severity: 'High', check: 'Compare captured source/campaign with the CRM record after a tagged landing.' },
  { id: 'defect-6', label: '06 · CRM field mapping broken', cause: 'A server mapper drops campaign fields or assigns them to the wrong columns.', severity: 'High', check: 'Compare the real saved CRM fields with the sanitized form attribution.' },
];

export function AuditRepairLab(): React.ReactElement {
  const [mode, setMode] = useState<'defect' | 'corrected'>('defect');
  const [pipelineReady, setPipelineReady] = useState(false);
  const [brokenConversionCount, setBrokenConversionCount] = useState(0);
  const [invalidValidationCount, setInvalidValidationCount] = useState(0);
  const [conversionCount, setConversionCount] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [defectMessage, setDefectMessage] = useState('Enter no details and test the premature click handler.');
  const handlePipelineReady = useCallback(() => setPipelineReady(true), []);

  useEffect(() => {
    const count = () => {
      setConversionCount(countV2CanonicalEvents(window.dataLayer));
      setBrokenConversionCount((window.dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === V2_CANONICAL_EVENT && (item as Record<string, unknown>).form_id === 'alder_consultation_broken').length);
    };
    const onValidation = () => setInvalidValidationCount((n) => n + 1);
    const onConfirm = (event: Event) => {
      const detail = (event as CustomEvent<Confirmation>).detail;
      if (detail?.submission_id) setConfirmation(detail);
      count();
    };
    window.addEventListener('responselock:v2-validation-failed', onValidation);
    window.addEventListener('responselock:v2-confirmed', onConfirm);
    count();
    return () => {
      window.removeEventListener('responselock:v2-validation-failed', onValidation);
      window.removeEventListener('responselock:v2-confirmed', onConfirm);
    };
  }, []);

  function testInvalidSubmission(form: HTMLFormElement) {
    const formData = new FormData(form);
    const valid = String(formData.get('invalid_name') ?? '').trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.get('invalid_email') ?? '').trim());
    if (mode === 'defect') {
      // This deliberately reproduces the old conversion bug. The special form_id
      // is excluded by the GTM export's production conversion trigger.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: V2_CANONICAL_EVENT,
        form_id: 'alder_consultation_broken',
        lead_type: 'consultation',
        scenario: 'baseline',
        submission_id: crypto.randomUUID(),
        attribution_status: 'missing',
        debug_mode: true,
        timestamp: new Date().toISOString(),
      });
      setBrokenConversionCount((window.dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === V2_CANONICAL_EVENT && (item as Record<string, unknown>).form_id === 'alder_consultation_broken').length);
      setDefectMessage(valid ? 'The fields are valid.' : 'Broken handler emitted a conversion before checking the empty required fields; validation then rejected the form. No lead request was sent.');
    } else {
      if (!valid) {
        setDefectMessage('Corrected handler checked the same required fields first and rejected this invalid form. No event or lead request was sent.');
        setInvalidValidationCount((n) => n + 1);
      } else {
        setDefectMessage('Corrected handler accepted the completed fields; use the real consultation form below to create a saved lead.');
      }
    }
    // A click on the button reaches the handler, but there is deliberately no API call.
    setConversionCount(countV2CanonicalEvents(window.dataLayer));
  }

  function applyCorrectedHandler() {
    setMode('corrected');
    setDefectMessage('Corrected handler is active. Test the same invalid submission again.');
  }

  return (
    <div className="business-audit-page">
      <header className="business-audit-hero">
        <div><span className="business-eyebrow">Conversion repair lab · V2</span><h1>From form submit to verified lead</h1>
          <p>Follow an actual Alder Office Services consultation through validation, the local lead API, the CRM mapper, and the browser dataLayer. The evidence stays explicit about what this environment can and cannot verify.</p></div>
        <div className="business-audit-meta"><span>Local CRM write</span><span>Zero PII in dataLayer</span><span>External tag delivery unverified</span></div>
      </header>

      <section className="business-repair-card" aria-labelledby="repair-title">
        <div className="business-section-heading"><div><span className="business-step-label">01 / REPRODUCE · 02 / REPAIR</span><h2 id="repair-title">The invalid-click defect</h2></div><span className={`business-mode-pill business-mode-${mode}`}>{mode === 'defect' ? 'Defect demonstration' : 'Corrected flow active'}</span></div>
        <div className="business-repair-grid">
          <div><h3>What goes wrong</h3><p>A click listener pushes a conversion before validation. A blank or malformed form then fails without creating a lead, while the analytics layer has already counted one.</p><p className="business-cause"><strong>Root cause:</strong> the event is coupled to button click instead of a matching successful API response.</p></div>
          <div className="business-repair-controls">
            <form className="business-defect-mini-form" onSubmit={(event) => { event.preventDefault(); testInvalidSubmission(event.currentTarget); }} noValidate>
              <label className="business-field">Name<input name="invalid_name" value="" readOnly placeholder="Leave blank for the invalid test" /></label>
              <label className="business-field">Work email<input name="invalid_email" value="" readOnly placeholder="Leave blank for the invalid test" /></label>
              <button type="submit" className={mode === 'defect' ? 'business-danger-button' : 'business-primary-button'}>Test invalid submission</button>
            </form>
            <p>{defectMessage}</p>
            {mode === 'defect' && <button type="button" className="business-primary-button" onClick={applyCorrectedHandler}>Apply corrected handler</button>}
            <p>The broken sample uses <code>form_id: alder_consultation_broken</code>; the GTM conversion trigger accepts only <code>alder_consultation</code>. The sample never calls <code>/api/leads</code>.</p>
            <button type="button" className="business-primary-button" disabled={!pipelineReady} onClick={() => window.dispatchEvent(new Event('responselock:v2-run-synthetic'))}>{pipelineReady ? 'Run synthetic valid lead through the real pipeline' : 'Preparing synthetic lead…'}</button>
            <small>Uses synthetic example.com data and the real lead API, CRM mapper, and dataLayer.</small>
          </div>
        </div>
        <div className="business-repair-results" aria-live="polite">
          <div><span>False conversions</span><strong>{brokenConversionCount}</strong></div>
          <div><span>Invalid requests blocked</span><strong>{invalidValidationCount}</strong></div>
          <div><span>Confirmed lead events</span><strong data-testid="audit-canonical-count">{conversionCount}</strong></div>
          <div><span>API result</span><strong>{confirmation ? confirmation.duplicate ? confirmation.emitted ? 'Recovered · event emitted once' : 'Duplicate · earlier event suppressed' : confirmation.emitted ? 'New record · event emitted once' : 'New record · event already observed' : 'Waiting for valid submission'}</strong></div>
        </div>
        <p className="business-repair-caption">Accepted event: <code>{V2_CANONICAL_EVENT}</code> with <code>form_id: alder_consultation</code>. The false conversion uses a separate blocked form ID.</p>
        <p className="business-repair-note">Corrected rule: a confirmed submission ID emits at most once. If the first response was lost, a later confirmed retry can recover the event; if an earlier event was already observed, the duplicate response is suppressed. A pending retry is kept in this browser tab until confirmation or cancellation.</p>
      </section>

      <section className="business-workspace-section" aria-label="Consultation form and evidence">
        <BusinessLeadForm showEvidence showDemoActions onReady={handlePipelineReady} />
      </section>

      <section className="business-defect-index" aria-labelledby="defects-title">
        <div className="business-section-heading"><div><span className="business-step-label">LEGACY DIAGNOSTICS</span><h2 id="defects-title">Six failure modes to compare</h2></div><p>Each link opens its existing isolated scenario. These examples preserve the legacy event contracts.</p></div>
        <div className="business-defect-list">{DEFECTS.map((defect) => <article className="business-defect-row" key={defect.id}>
          <div className="business-defect-row-heading"><h3><Link href={`/scenario/${defect.id}`}>{defect.label}</Link></h3><span className="business-severity">{defect.severity} severity</span></div>
          <p><strong>Cause</strong> {defect.cause}</p><p><strong>Verify repair</strong> {defect.check}</p>
        </article>)}</div>
      </section>

      <section className="business-verification-card" aria-labelledby="boundary-title">
        <span className="business-step-label">VERIFICATION BOUNDARY</span><h2 id="boundary-title">Local evidence ends at the browser boundary</h2>
        <div className="business-verification-grid"><div><strong>Confirmed locally</strong><p>Validated request, matching API response, CRM record readback, and dataLayer event.</p></div><div><strong>Requires GTM Preview</strong><p>Whether a matching trigger fires and which tags execute.</p></div><div><strong>Requires GA4 DebugView</strong><p>Whether GA4 receives and accepts the event and parameters.</p></div><div><strong>Google Ads</strong><p>No Ads receipt or conversion action is verified in this demo.</p></div></div>
      </section>

      <section className="business-consent-section" aria-labelledby="consent-title"><div><span className="business-step-label">OPTIONAL BROWSER SETTING</span><h2 id="consent-title">Consent preferences</h2><p>Default state is denied. Changes update Consent Mode for the existing GTM container.</p></div><ConsentBanner className="business-consent-manager" /></section>
    </div>
  );
}
