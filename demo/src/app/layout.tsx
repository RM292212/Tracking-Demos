/**
 * ResponseLock Root Layout
 * Location: demo/src/app/layout.tsx
 *
 * Implements accessible semantic skeleton (header, main, footer),
 * skip link, tokens stylesheet, and GTM integration.
 */

import React from 'react';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { GtmScript } from '@/components/GtmScript';
import { env } from '@/lib/env';
import { ROUTE_REGISTRY } from '@/lib/contracts/routes';
import '@/styles/tokens.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ResponseLock | Lead & Conversion Integrity Demo Workspace',
  description:
    'Local training and demonstration workspace for auditing lead capture, tracking defects, and conversion integrity.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <GtmScript />
        {/* WCAG Skip to Main Content Link */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Global Application Header */}
        <header className="app-header" role="banner">
          <div className="header-container">
            <div className="brand-group">
              <Link href="/" className="brand-title">
                ResponseLock
              </Link>
              <span className="badge badge-demo">Local Demo Workspace</span>
            </div>

            {/* Environmental Status Indicator Badges */}
            <div className="status-indicators" aria-label="Tracking Status">
              <span
                className={`status-badge status-${env.gtmStatus}`}
                title={
                  env.gtmStatus === 'configured'
                    ? `GTM Configured: ${env.gtmContainerId}`
                    : env.gtmStatus === 'invalid'
                    ? 'GTM Container ID format invalid'
                    : 'GTM not configured (simulated offline mode)'
                }
              >
                GTM: {env.gtmStatus}
              </span>
              <span
                className={`status-badge status-${env.ga4Status}`}
                title={
                  env.ga4Status === 'configured'
                    ? `GA4 Configured: ${env.ga4MeasurementId}`
                    : 'GA4 via GTM'
                }
              >
                GA4: {env.ga4Status}
              </span>
            </div>
          </div>

          {/* Scenario & Workspace Navigation */}
          <nav
            className="main-nav"
            role="navigation"
            aria-label="Workspace Navigation"
          >
            <ul className="nav-list">
              {ROUTE_REGISTRY.map((route) => (
                <li key={route.path} className="nav-item">
                  <Link href={route.path} className="nav-link">
                    {route.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Main Content Landmark */}
        <main id="main-content" className="main-viewport" role="main">
          {children}
        </main>

        {/* Educational Disclaimer Footer */}
        <footer className="app-footer" role="contentinfo">
          <p>
            ResponseLock Lead &amp; Conversion Integrity Audit Demo ($350
            fixed-scope training service). Local simulated environment — NO real
            customer data or live marketing endpoints.
          </p>
        </footer>
      </body>
    </html>
  );
}
