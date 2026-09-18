'use client';

/**
 * ResponseLock Observability Panel Component
 * Location: demo/src/components/ObservabilityPanel.tsx
 *
 * Chronological timeline of conversion-chain events with built-in PII redaction,
 * categorized filtering, formatted payloads, evidence export, and local introspection.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TimelineCategory,
  TimelineEntry,
  TIMELINE_CATEGORIES,
  SanitizedEvidenceManifest,
} from '@/lib/contracts/timeline';
import { ScenarioId } from '@/lib/contracts/events';

export const OBSERVABILITY_DISCLAIMER =
  'This observability panel is for local demo introspection and is NOT equivalent to GTM Preview mode or GA4 DebugView.' as const;

export const CUSTOM_TIMELINE_EVENT_NAME = 'responselock:timeline' as const;

// PII detection patterns for sanitization
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?<![0-9a-zA-Z])(?:\+?1[-.\s])?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{4})(?![0-9a-zA-Z])/g;

/**
 * Redacts email and phone numbers from raw text.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

/**
 * Recursively redacts PII keys and values from JSON payloads.
 */
export function sanitizePayload(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return sanitizeText(val);
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(sanitizePayload);
  }
  if (typeof val === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const lowerKey = k.toLowerCase();
      if (
        lowerKey === 'email' ||
        lowerKey === 'work_email' ||
        lowerKey.includes('email')
      ) {
        result[k] = '[REDACTED_EMAIL]';
      } else if (
        lowerKey === 'phone' ||
        lowerKey.includes('phone')
      ) {
        result[k] = '[REDACTED_PHONE]';
      } else if (
        lowerKey === 'full_name' ||
        lowerKey === 'fullname' ||
        lowerKey === 'name'
      ) {
        result[k] = '[REDACTED_NAME]';
      } else {
        result[k] = sanitizePayload(v);
      }
    }
    return result;
  }
  return val;
}

/**
 * Sanitizes a single timeline entry, guaranteeing zero PII in label and payload.
 */
export function sanitizeTimelineEntry(entry: TimelineEntry): TimelineEntry {
  return {
    ...entry,
    label: sanitizeText(entry.label),
    payload: entry.payload
      ? (sanitizePayload(entry.payload) as Record<string, unknown>)
      : entry.payload,
  };
}

/**
 * Computes summary statistics for a set of timeline entries.
 */
export function computeSummary(entries: TimelineEntry[]) {
  let dataLayerPushes = 0;
  let crmRequests = 0;
  let validationFailures = 0;

  for (const e of entries) {
    if (e.category === 'analytics') {
      dataLayerPushes++;
    } else if (
      e.category === 'crm' ||
      (e.category === 'network' &&
        e.label.toLowerCase().includes('/api/leads'))
    ) {
      crmRequests++;
    } else if (
      e.category === 'validation' &&
      (e.label.toLowerCase().includes('fail') ||
        e.label.toLowerCase().includes('error') ||
        e.label.toLowerCase().includes('invalid'))
    ) {
      validationFailures++;
    }
  }

  return {
    totalEvents: entries.length,
    dataLayerPushes,
    crmRequests,
    validationFailures,
  };
}

/**
 * Generates a SanitizedEvidenceManifest object adhering to the frozen timeline contract.
 */
export function generateSanitizedManifest(
  scenario: string,
  entries: TimelineEntry[]
): SanitizedEvidenceManifest {
  const sanitized = entries.map(sanitizeTimelineEntry);
  return {
    scenario: scenario as ScenarioId,
    exportedAt: new Date().toISOString(),
    entries: sanitized,
    summary: computeSummary(sanitized),
    disclaimer:
      'This manifest is a local educational record and is NOT equivalent to GTM Preview or GA4 DebugView.',
  };
}

/**
 * Formats timeline entries into a sanitized markdown summary for clipboard export.
 */
export function generateSanitizedMarkdown(
  scenario: string,
  entries: TimelineEntry[]
): string {
  const manifest = generateSanitizedManifest(scenario, entries);
  let md = `# ResponseLock Sanitized Evidence Summary\n\n`;
  md += `**Scenario:** ${manifest.scenario}  \n`;
  md += `**Exported At:** ${manifest.exportedAt}  \n`;
  md += `**Notice:** ${manifest.disclaimer}\n\n`;
  md += `## Summary Metrics\n\n`;
  md += `- **Total Events:** ${manifest.summary.totalEvents}\n`;
  md += `- **dataLayer Pushes:** ${manifest.summary.dataLayerPushes}\n`;
  md += `- **CRM Requests:** ${manifest.summary.crmRequests}\n`;
  md += `- **Validation Failures:** ${manifest.summary.validationFailures}\n\n`;
  md += `## Chronological Event Stream\n\n`;

  if (manifest.entries.length === 0) {
    md += `*No events recorded.*\n`;
  } else {
    for (const entry of manifest.entries) {
      md += `### [+${entry.timestamp}ms] [${entry.category.toUpperCase()}] ${entry.label}\n`;
      md += `- **Event ID:** \`${entry.id}\`\n`;
      if (entry.payload && Object.keys(entry.payload).length > 0) {
        md += `\`\`\`json\n${JSON.stringify(entry.payload, null, 2)}\n\`\`\`\n\n`;
      } else {
        md += `\n`;
      }
    }
  }

  return md;
}

/**
 * Global helper to dispatch a timeline event from anywhere in client code.
 */
export function emitTimelineEvent(
  entry: Omit<TimelineEntry, 'id'> & { id?: string }
): void {
  if (typeof window === 'undefined') return;
  const fullEntry: TimelineEntry = {
    id: entry.id ?? `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...entry,
  };
  window.dispatchEvent(
    new CustomEvent(CUSTOM_TIMELINE_EVENT_NAME, { detail: fullEntry })
  );
}

export interface ObservabilityPanelProps {
  scenario?: ScenarioId | string;
  initialEntries?: TimelineEntry[];
  entries?: TimelineEntry[]; // If provided, operates in controlled mode
  onClear?: () => void;
  className?: string;
}

const CATEGORY_COLORS: Record<TimelineCategory, { bg: string; text: string; border: string }> = {
  lifecycle: { bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd', border: '#8b5cf6' },
  validation: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d', border: '#f59e0b' },
  network: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd', border: '#3b82f6' },
  analytics: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7', border: '#10b981' },
  storage: { bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9', border: '#06b6d4' },
  crm: { bg: 'rgba(20, 184, 166, 0.15)', text: '#5eead4', border: '#14b8a6' },
  attribution: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fdba74', border: '#f97316' },
  consent: { bg: 'rgba(168, 85, 247, 0.15)', text: '#d8b4fe', border: '#a855f7' },
  defect: { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: '#ef4444' },
};

export function ObservabilityPanel({
  scenario = 'baseline',
  initialEntries = [],
  entries: controlledEntries,
  onClear,
  className = '',
}: ObservabilityPanelProps): React.ReactElement {
  const [internalEntries, setInternalEntries] = useState<TimelineEntry[]>(initialEntries);
  const [selectedCategory, setSelectedCategory] = useState<TimelineCategory | 'all'>('all');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Set<string>>(new Set());

  const activeEntries = controlledEntries ?? internalEntries;

  // Listen for global custom events when uncontrolled
  useEffect(() => {
    if (controlledEntries) return;

    const handleTimelineEvent = (event: Event) => {
      const customEvent = event as CustomEvent<TimelineEntry>;
      if (customEvent.detail) {
        setInternalEntries((prev) => [...prev, customEvent.detail]);
      }
    };

    window.addEventListener(CUSTOM_TIMELINE_EVENT_NAME, handleTimelineEvent);
    return () => {
      window.removeEventListener(CUSTOM_TIMELINE_EVENT_NAME, handleTimelineEvent);
    };
  }, [controlledEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'all') return activeEntries;
    return activeEntries.filter((e) => e.category === selectedCategory);
  }, [activeEntries, selectedCategory]);

  const summary = useMemo(() => computeSummary(activeEntries), [activeEntries]);

  // Toggle single payload expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedPayloadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Expand / Collapse all
  const toggleAllPayloads = useCallback(() => {
    if (expandedPayloadIds.size === filteredEntries.length) {
      setExpandedPayloadIds(new Set());
    } else {
      setExpandedPayloadIds(new Set(filteredEntries.map((e) => e.id)));
    }
  }, [expandedPayloadIds.size, filteredEntries]);

  // Handle Copy Sanitized Markdown
  const handleCopyMarkdown = useCallback(async () => {
    try {
      const markdown = generateSanitizedMarkdown(scenario, activeEntries);
      let copied = false;

      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(markdown);
          copied = true;
        } catch {
          // Fall through to textarea fallback
          copied = false;
        }
      }

      if (!copied && typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copied = true;
      }

      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  }, [scenario, activeEntries]);

  // Handle Download Sanitized JSON
  const handleDownloadManifest = useCallback(() => {
    const manifest = generateSanitizedManifest(scenario, activeEntries);
    const jsonStr = JSON.stringify(manifest, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sanitized-manifest-${scenario}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [scenario, activeEntries]);

  // Clear timeline
  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      setInternalEntries([]);
    }
    setExpandedPayloadIds(new Set());
  }, [onClear]);

  return (
    <div
      className={`observability-panel ${className}`}
      data-testid="observability-panel"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span>Observability Timeline</span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-accent-500)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              {activeEntries.length} events
            </span>
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: '2px',
            }}
          >
            Scenario: <strong>{scenario}</strong> | Real-time conversion-chain telemetry
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            aria-label={copyStatus === 'copied' ? 'Summary Copied' : 'Copy Sanitized Evidence Summary'}
            data-testid="copy-summary-button"
            style={{
              backgroundColor: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              color: copyStatus === 'copied' ? 'var(--color-success-text)' : 'var(--color-text-primary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copyStatus === 'copied' ? '✓ Summary Copied!' : 'Copy Sanitized Evidence Summary'}
          </button>

          <button
            type="button"
            onClick={handleDownloadManifest}
            aria-label="Download Sanitized JSON Manifest"
            data-testid="download-manifest-button"
            style={{
              backgroundColor: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-primary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Download Sanitized JSON Manifest
          </button>

          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear Timeline"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Mandatory Disclaimer Note */}
      <aside
        role="note"
        aria-label="Observability Disclaimer"
        data-testid="observability-disclaimer"
        style={{
          backgroundColor: 'var(--color-info-bg)',
          borderLeft: '3px solid var(--color-info-border)',
          color: 'var(--color-info-text)',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 'var(--font-size-xs)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        <strong>Notice:</strong> {OBSERVABILITY_DISCLAIMER}
      </aside>

      {/* Metrics Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 'var(--space-2)',
          backgroundColor: 'var(--color-bg-canvas)',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>Total</div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>
            {summary.totalEvents}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>dataLayer Pushes</div>
          <div style={{ fontWeight: 'bold', color: 'var(--color-success-text)', fontSize: 'var(--font-size-sm)' }}>
            {summary.dataLayerPushes}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>CRM Requests</div>
          <div style={{ fontWeight: 'bold', color: 'var(--color-accent-500)', fontSize: 'var(--font-size-sm)' }}>
            {summary.crmRequests}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>Validation Errors</div>
          <div
            style={{
              fontWeight: 'bold',
              color: summary.validationFailures > 0 ? 'var(--color-error-text)' : 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {summary.validationFailures}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
        role="toolbar"
        aria-label="Filter timeline by category"
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginRight: '4px',
          }}
        >
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--color-primary-600)' : 'var(--color-bg-surface-raised)',
            color: selectedCategory === 'all' ? 'var(--color-primary-contrast)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '2px 10px',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
          }}
        >
          All ({activeEntries.length})
        </button>

        {TIMELINE_CATEGORIES.map((cat) => {
          const count = activeEntries.filter((e) => e.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                backgroundColor: isSelected ? CATEGORY_COLORS[cat].bg : 'transparent',
                color: isSelected ? CATEGORY_COLORS[cat].text : 'var(--color-text-secondary)',
                border: `1px solid ${isSelected ? CATEGORY_COLORS[cat].border : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                opacity: count > 0 ? 1 : 0.6,
              }}
            >
              {cat} ({count})
            </button>
          );
        })}

        {filteredEntries.length > 0 && (
          <button
            type="button"
            onClick={toggleAllPayloads}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {expandedPayloadIds.size === filteredEntries.length ? 'Collapse Payloads' : 'Expand Payloads'}
          </button>
        )}
      </div>

      {/* Chronological Event Stream */}
      <div
        className="timeline-stream"
        style={{
          maxHeight: '420px',
          overflowY: 'auto',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-bg-canvas)',
          padding: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {filteredEntries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            No events recorded yet in this session.
            <div style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
              Actions, network calls, dataLayer events, and validation outcomes will appear here.
            </div>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const colors = CATEGORY_COLORS[entry.category] || {
              bg: 'var(--color-bg-subtle)',
              text: 'var(--color-text-primary)',
              border: 'var(--color-border-default)',
            };
            const hasPayload = Boolean(entry.payload && Object.keys(entry.payload).length > 0);
            const isExpanded = expandedPayloadIds.has(entry.id);
            const sanitizedEntry = sanitizeTimelineEntry(entry);

            return (
              <div
                key={entry.id}
                data-testid={`timeline-entry-${entry.id}`}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderLeft: `3px solid ${colors.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-2) var(--space-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {/* Entry Top Row: Timestamp, Category, Label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        color: 'var(--color-text-muted)',
                        minWidth: '55px',
                      }}
                    >
                      +{entry.timestamp}ms
                    </span>
                    <span
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                      }}
                    >
                      {entry.category}
                    </span>
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {sanitizedEntry.label}
                    </span>
                  </div>

                  {hasPayload && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(entry.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle payload for ${entry.id}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text-secondary)',
                        padding: '1px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? 'Hide JSON' : 'View JSON'}
                    </button>
                  )}
                </div>

                {/* Formatted JSON Payload (Sanitized) */}
                {hasPayload && isExpanded && (
                  <pre
                    data-testid={`payload-${entry.id}`}
                    style={{
                      marginTop: '4px',
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--color-bg-canvas)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-primary)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(sanitizedEntry.payload, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
