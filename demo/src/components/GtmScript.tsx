'use client';

/**
 * ResponseLock Google Tag Manager & Consent Mode v2 Script Component
 * Location: demo/src/components/GtmScript.tsx
 *
 * Official Google Documentation References:
 * 1. Google Tag Manager Web Container Setup:
 *    https://developers.google.com/tag-platform/tag-manager/web
 * 2. Google Consent Mode v2 Integration:
 *    https://developers.google.com/tag-platform/security/guides/consent
 *
 * INVARIANTS:
 * - Uses next/script with strategy="afterInteractive".
 * - Next.js script deduplication prevents duplicate container snippet insertion.
 * - Saved Consent Mode v2 choice is restored before GTM; absent storage defaults to denial.
 * - NO separate gtag.js or GA4 script tag (GA4 tags are managed exclusively inside GTM).
 * - Graceful fallback when GTM ID is absent or invalid.
 */

import React from 'react';
import Script from 'next/script';
import { env } from '@/lib/env';

export function GtmScript(): React.ReactElement | null {
  // If absent, render nothing (simulated offline mode)
  if (env.gtmStatus === 'absent') {
    return null;
  }

  // If invalid, do NOT inject tracking script
  if (env.gtmStatus === 'invalid' || !env.gtmContainerId) {
    return null;
  }

  const containerId = env.gtmContainerId;

  // Inline snippet executed before GTM container loads:
  // 1. Initialize dataLayer
  // 2. Define gtag helper
  // 3. Restore a saved consent choice, otherwise set the explicit default denial.
  const consentAndDataLayerInit = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    var rlConsentChoice = 'denied';
    try {
      var rlStoredConsent = window.localStorage.getItem('responselock_consent_choice');
      if (rlStoredConsent === 'granted' || rlStoredConsent === 'denied') rlConsentChoice = rlStoredConsent;
    } catch (e) {}
    gtag('consent', 'default', {
      'ad_storage': rlConsentChoice,
      'analytics_storage': rlConsentChoice,
      'ad_user_data': rlConsentChoice,
      'ad_personalization': rlConsentChoice,
      'wait_for_update': 500
    });
  `;

  // Verbatim Google Tag Manager snippet from Google Official Documentation:
  // https://developers.google.com/tag-platform/tag-manager/web
  const gtmSnippet = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.id='gtm-external-container';j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;
    j.onload=function(){j.dataset.loadState='loaded';w.dispatchEvent(new CustomEvent('responselock:gtm-load',{detail:{status:'loaded'}}));};
    j.onerror=function(){j.dataset.loadState='failed';w.dispatchEvent(new CustomEvent('responselock:gtm-load',{detail:{status:'failed'}}));};
    f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;

  return (
    <>
      {/* 1. Consent choice restore/default denial runs synchronously before the GTM snippet */}
      <script
        id="google-consent-mode-init"
        dangerouslySetInnerHTML={{ __html: consentAndDataLayerInit }}
      />

      {/* 2. Official Google Tag Manager Container Snippet */}
      <Script
        id="gtm-container-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: gtmSnippet }}
      />

      {/* 3. Official GTM <noscript> fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
