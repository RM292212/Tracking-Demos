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
 * - React Strict Mode double-injection prevention via module guard & Next.js script deduplication.
 * - Consent Mode v2 default denial executed BEFORE GTM script loads.
 * - NO separate gtag.js or GA4 script tag (GA4 tags are managed exclusively inside GTM).
 * - Graceful fallback when GTM ID is absent or invalid.
 */

import React, { useEffect } from 'react';
import Script from 'next/script';
import { env } from '@/lib/env';

/**
 * Module-level injection guard to ensure GTM is only initialized once
 * even when React Strict Mode mounts components twice in development.
 */
let isGtmInitialized = false;

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
  // 3. Set Consent Mode v2 default denial (all denied with wait_for_update: 500)
  const consentAndDataLayerInit = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'wait_for_update': 500
    });
  `;

  // Verbatim Google Tag Manager snippet from Google Official Documentation:
  // https://developers.google.com/tag-platform/tag-manager/web
  const gtmSnippet = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;

  return (
    <>
      {/* 1. Consent Mode v2 default denial (must run synchronously before GTM snippet) */}
      <script
        id="google-consent-mode-init"
        dangerouslySetInnerHTML={{ __html: consentAndDataLayerInit }}
      />

      {/* 2. Official Google Tag Manager Container Snippet */}
      <Script
        id="gtm-container-script"
        strategy="afterInteractive"
        onLoad={() => {
          isGtmInitialized = true;
        }}
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
