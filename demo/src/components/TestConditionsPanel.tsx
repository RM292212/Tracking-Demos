'use client';

/**
 * ResponseLock Test Conditions Simulation Panel
 * Location: demo/src/components/TestConditionsPanel.tsx
 *
 * Provides toggleable simulation controls (off by default) for:
 * 1. Ad-blocker simulation (skips GTM injection + shows diagnostic notice)
 * 2. API 500 error injection
 * 3. API timeout simulation
 * 4. Slow network simulation (2s artificial delay)
 * 5. Consent denied simulation
 * 6. SPA navigation mode toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import { emitTimelineEvent } from './ObservabilityPanel';

export interface TestConditions {
  adBlocker: boolean;
  api500: boolean;
  apiTimeout: boolean;
  slowNetwork: boolean;
  consentDenied: boolean;
  spaNavigation: boolean;
}

export const DEFAULT_TEST_CONDITIONS: TestConditions = {
  adBlocker: false,
  api500: false,
  apiTimeout: false,
  slowNetwork: false,
  consentDenied: false,
  spaNavigation: false,
};

export const TEST_CONDITIONS_EVENT = 'responselock:test-conditions' as const;

// Global window declaration for runtime test inspection
declare global {
  interface Window {
    __RL_TEST_CONDITIONS__?: TestConditions;
  }
}

export interface TestConditionsPanelProps {
  conditions?: TestConditions;
  onConditionsChange?: (conditions: TestConditions) => void;
  className?: string;
}

interface ConditionMeta {
  key: keyof TestConditions;
  title: string;
  description: string;
  badge: string;
}

const CONDITIONS_META: ConditionMeta[] = [
  {
    key: 'adBlocker',
    title: 'Ad-Blocker Simulation',
    description: 'Suppresses GTM container execution and simulates client-side script blocking.',
    badge: 'Network / Tagging',
  },
  {
    key: 'api500',
    title: 'API 500 Error Injection',
    description: 'Forces lead submission endpoint (/api/leads) to return HTTP 500 Internal Server Error.',
    badge: 'Backend Error',
  },
  {
    key: 'apiTimeout',
    title: 'API Timeout Simulation',
    description: 'Simulates connection abort or server hang (aborts after 8 seconds).',
    badge: 'Latency / Hang',
  },
  {
    key: 'slowNetwork',
    title: 'Slow Network Simulation',
    description: 'Injects an artificial 2000ms delay into API requests to test loading states.',
    badge: 'Latency (+2000ms)',
  },
  {
    key: 'consentDenied',
    title: 'Consent Denied Simulation',
    description: 'Enforces Consent Mode v2 denial state regardless of user interaction.',
    badge: 'Privacy / Consent',
  },
  {
    key: 'spaNavigation',
    title: 'SPA Navigation Mode Toggle',
    description: 'Simulates client-side route transitions (Next.js router) vs standard page loads.',
    badge: 'Routing / Router',
  },
];

export function TestConditionsPanel({
  conditions: controlledConditions,
  onConditionsChange,
  className = '',
}: TestConditionsPanelProps): React.ReactElement {
  const [internalConditions, setInternalConditions] = useState<TestConditions>(() => {
    if (typeof window !== 'undefined' && window.__RL_TEST_CONDITIONS__) {
      return window.__RL_TEST_CONDITIONS__;
    }
    return DEFAULT_TEST_CONDITIONS;
  });

  const activeConditions = controlledConditions ?? internalConditions;

  // Sync to global window object and emit custom event
  const updateCondition = useCallback(
    (key: keyof TestConditions, value: boolean) => {
      const next: TestConditions = {
        ...activeConditions,
        [key]: value,
      };

      if (!controlledConditions) {
        setInternalConditions(next);
      }

      if (typeof window !== 'undefined') {
        window.__RL_TEST_CONDITIONS__ = next;
        window.dispatchEvent(
          new CustomEvent(TEST_CONDITIONS_EVENT, { detail: next })
        );
      }

      // Log to observability timeline
      emitTimelineEvent({
        category: 'defect',
        timestamp: Date.now(),
        label: `Test Condition Toggle: ${key} = ${value}`,
        payload: {
          condition: key,
          active: value,
          allConditions: { ...next } as Record<string, unknown>,
        },
      });

      if (onConditionsChange) {
        onConditionsChange(next);
      }
    },
    [activeConditions, controlledConditions, onConditionsChange]
  );

  const resetAllConditions = useCallback(() => {
    if (!controlledConditions) {
      setInternalConditions(DEFAULT_TEST_CONDITIONS);
    }

    if (typeof window !== 'undefined') {
      window.__RL_TEST_CONDITIONS__ = DEFAULT_TEST_CONDITIONS;
      window.dispatchEvent(
        new CustomEvent(TEST_CONDITIONS_EVENT, { detail: DEFAULT_TEST_CONDITIONS })
      );
    }

    emitTimelineEvent({
      category: 'defect',
      timestamp: Date.now(),
      label: 'Test Conditions Reset: All simulations returned to default (off)',
      payload: { ...DEFAULT_TEST_CONDITIONS } as Record<string, unknown>,
    });

    if (onConditionsChange) {
      onConditionsChange(DEFAULT_TEST_CONDITIONS);
    }
  }, [controlledConditions, onConditionsChange]);

  // Synchronize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__RL_TEST_CONDITIONS__ = activeConditions;
    }
  }, [activeConditions]);

  const activeCount = Object.values(activeConditions).filter(Boolean).length;

  return (
    <div
      className={`test-conditions-panel ${className}`}
      data-testid="test-conditions-panel"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span>Environment Simulators</span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                backgroundColor: activeCount > 0 ? 'var(--color-warning-bg)' : 'var(--color-bg-subtle)',
                color: activeCount > 0 ? 'var(--color-warning-text)' : 'var(--color-text-muted)',
                border: `1px solid ${activeCount > 0 ? 'var(--color-warning-border)' : 'var(--color-border-subtle)'}`,
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              {activeCount === 0 ? '0 active (default)' : `${activeCount} active`}
            </span>
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Toggle environmental faults and network degradation (off by default)
          </p>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAllConditions}
            aria-label="Reset all simulations"
            style={{
              backgroundColor: 'var(--color-bg-surface-raised)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-secondary)',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Diagnostic Notice when Ad-Blocker is Active */}
      {activeConditions.adBlocker && (
        <aside
          role="alert"
          aria-live="polite"
          data-testid="adblocker-diagnostic-notice"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            borderLeft: '4px solid var(--color-error-border)',
            color: 'var(--color-error-text)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          <strong>Diagnostic Notice:</strong> Ad-blocker simulation is ACTIVE. GTM script injection is suppressed,
          third-party analytics beacons are dropped, and client-side Google tags will fail to load.
        </aside>
      )}

      {/* Conditions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {CONDITIONS_META.map((meta) => {
          const isEnabled = activeConditions[meta.key];

          return (
            <label
              key={meta.key}
              htmlFor={`test-condition-${meta.key}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: isEnabled ? 'var(--color-bg-surface-raised)' : 'var(--color-bg-canvas)',
                border: `1px solid ${isEnabled ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <input
                id={`test-condition-${meta.key}`}
                type="checkbox"
                role="switch"
                aria-checked={isEnabled}
                checked={isEnabled}
                onChange={(e) => updateCondition(meta.key, e.target.checked)}
                data-testid={`toggle-${meta.key}`}
                style={{
                  marginTop: '3px',
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--color-primary-600)',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: isEnabled ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {meta.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-family-mono)',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {meta.badge}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 'var(--line-height-normal)',
                  }}
                >
                  {meta.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
