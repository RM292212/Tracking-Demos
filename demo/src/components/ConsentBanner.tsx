'use client';

/**
 * ResponseLock Consent Mode v2 Banner Component
 * Location: demo/src/components/ConsentBanner.tsx
 *
 * Official Google Documentation Reference:
 * https://developers.google.com/tag-platform/security/guides/consent
 *
 * Provides:
 * 1. Accessible Consent Mode v2 banner with Accept All and Decline All buttons.
 * 2. On accept: pushes gtag('consent', 'update', {
 *      'ad_storage': 'granted',
 *      'analytics_storage': 'granted',
 *      'ad_user_data': 'granted',
 *      'ad_personalization': 'granted'
 *    }) and logs to observability timeline under 'consent' category.
 * 3. On decline: pushes gtag('consent', 'update', {
 *      'ad_storage': 'denied',
 *      'analytics_storage': 'denied',
 *      'ad_user_data': 'denied',
 *      'ad_personalization': 'denied'
 *    }) and logs to timeline under 'consent' category.
 * 4. Persistent toggle allowing users to inspect or change their consent choice at any time.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { emitTimelineEvent } from './ObservabilityPanel';

export type ConsentStatus = 'granted' | 'denied' | 'default_denied';

const CONSENT_STORAGE_KEY = 'responselock_consent_choice';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Official Google Consent Mode v2 update caller.
 * Verbatim arguments per: https://developers.google.com/tag-platform/security/guides/consent
 */
export function updateGoogleConsent(status: 'granted' | 'denied'): Record<string, string> {
  const consentUpdatePayload = {
    ad_storage: status,
    analytics_storage: status,
    ad_user_data: status,
    ad_personalization: status,
  };

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', consentUpdatePayload);
    } else {
      // Fallback: push standard arguments object into dataLayer
      window.dataLayer.push(['consent', 'update', consentUpdatePayload]);
    }
  }

  return consentUpdatePayload;
}

export interface ConsentBannerProps {
  className?: string;
  forceOpen?: boolean;
}

export function ConsentBanner({
  className = '',
  forceOpen = false,
}: ConsentBannerProps): React.ReactElement {
  const [currentStatus, setCurrentStatus] = useState<ConsentStatus>('default_denied');
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  // Initialize consent status from storage
  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentStatus | null;
    if (stored === 'granted' || stored === 'denied') {
      setCurrentStatus(stored);
      setIsBannerVisible(false);
    } else {
      setCurrentStatus('default_denied');
      setIsBannerVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    const payload = updateGoogleConsent('granted');
    setCurrentStatus('granted');
    setIsBannerVisible(false);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    } catch {
      // Storage error ignored
    }

    emitTimelineEvent({
      category: 'consent',
      timestamp: Date.now(),
      label: 'Consent Mode v2: User Granted All Permissions',
      payload: {
        action: 'consent_update',
        status: 'granted',
        consent_parameters: payload,
      },
    });
  }, []);

  const handleDecline = useCallback(() => {
    const payload = updateGoogleConsent('denied');
    setCurrentStatus('denied');
    setIsBannerVisible(false);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    } catch {
      // Storage error ignored
    }

    emitTimelineEvent({
      category: 'consent',
      timestamp: Date.now(),
      label: 'Consent Mode v2: User Denied All Permissions',
      payload: {
        action: 'consent_update',
        status: 'denied',
        consent_parameters: payload,
      },
    });
  }, []);

  const handleResetConsent = useCallback(() => {
    setCurrentStatus('default_denied');
    setIsBannerVisible(true);
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // Storage error ignored
    }

    // Restore default denial
    const payload = updateGoogleConsent('denied');

    emitTimelineEvent({
      category: 'consent',
      timestamp: Date.now(),
      label: 'Consent Mode v2: Preferences Reset to Default Denial',
      payload: {
        action: 'consent_reset',
        status: 'default_denied',
        consent_parameters: payload,
      },
    });
  }, []);

  const showBanner = forceOpen || isBannerVisible;

  // Render persistent toggle pill + banner when visible
  return (
    <div
      className={`consent-manager ${className}`}
      data-testid="consent-manager"
      style={{
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* Persistent Consent Status Toggle Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-bg-surface-raised)',
          border: '1px solid var(--color-border-default)',
          fontSize: 'var(--font-size-xs)',
        }}
        data-testid="consent-persistent-status"
      >
        <span style={{ color: 'var(--color-text-secondary)' }}>Consent:</span>
        <span
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontWeight: 'bold',
            color:
              currentStatus === 'granted'
                ? 'var(--color-success-text)'
                : currentStatus === 'denied'
                ? 'var(--color-error-text)'
                : 'var(--color-warning-text)',
          }}
        >
          {currentStatus === 'granted'
            ? 'Granted'
            : currentStatus === 'denied'
            ? 'Denied'
            : 'Default Denied'}
        </span>

        <button
          type="button"
          onClick={() => setIsBannerVisible((prev) => !prev)}
          aria-expanded={showBanner}
          aria-label="Toggle Consent Mode Preferences Banner"
          data-testid="consent-toggle-button"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--color-primary-500)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: 'var(--font-size-xs)',
            textDecoration: 'underline',
          }}
        >
          {showBanner ? 'Hide Banner' : 'Manage Consent'}
        </button>

        {currentStatus !== 'default_denied' && (
          <button
            type="button"
            onClick={handleResetConsent}
            aria-label="Reset Consent to Default"
            data-testid="consent-reset-button"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '0.7rem',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Floating or Embedded Consent Mode v2 Banner */}
      {showBanner && hasMounted && (
        <aside
          role="dialog"
          aria-label="Cookie & Tracking Consent Mode v2"
          aria-describedby="consent-banner-desc"
          data-testid="consent-banner"
          style={{
            marginTop: 'var(--space-2)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            maxWidth: '680px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-2)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Google Consent Mode v2 (Educational Simulation)</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-family-mono)',
                    backgroundColor: 'var(--color-info-bg)',
                    color: 'var(--color-info-text)',
                    border: '1px solid var(--color-info-border)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  EU Privacy Compliance
                </span>
              </h3>

              <button
                type="button"
                onClick={() => setIsBannerVisible(false)}
                aria-label="Close Consent Banner"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-base)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            </div>

            <p
              id="consent-banner-desc"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              By default, ResponseLock pre-sets all 4 Consent Mode v2 categories (<code>ad_storage</code>,{' '}
              <code>analytics_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>) to{' '}
              <strong>denied</strong> before GTM loads. Choose below to test how GTM and GA4 tags adapt to grant or
              denial updates in real time.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <button
              type="button"
              onClick={handleAccept}
              data-testid="consent-accept-button"
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'var(--color-primary-contrast)',
                border: 'none',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Accept All Tracking (Grant)
            </button>

            <button
              type="button"
              onClick={handleDecline}
              data-testid="consent-decline-button"
              style={{
                backgroundColor: 'var(--color-bg-surface-raised)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Decline All (Keep Denied)
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
