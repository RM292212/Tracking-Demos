'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { env } from '@/lib/env';
import { ROUTE_REGISTRY } from '@/lib/contracts/routes';

export function WebsiteShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const businessHome = pathname === '/';
  const businessLayout = businessHome || pathname === '/audit';

  if (businessHome) {
    return <><a href="#main-content" className="skip-link">Skip to main content</a>{children}</>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!businessLayout && (
        <header className="app-header" role="banner">
          <div className="header-container">
            <div className="brand-group">
              <Link href="/" className="brand-title">ResponseLock</Link>
              <span className="badge badge-demo">Local Demo Workspace</span>
            </div>
            <div className="status-indicators" aria-label="Tracking Status">
              <span
                className={`status-badge status-${env.gtmStatus}`}
                title={env.gtmStatus === 'configured' ? `GTM Configured: ${env.gtmContainerId}` : env.gtmStatus === 'invalid' ? 'GTM Container ID format invalid' : 'GTM not configured'}
              >GTM: {env.gtmStatus}</span>
              <span
                className={`status-badge status-${env.ga4Status}`}
                title={env.ga4Status === 'configured' ? `GA4 Configured: ${env.ga4MeasurementId}` : 'GA4 via GTM'}
              >GA4: {env.ga4Status}</span>
            </div>
          </div>
          <nav className="main-nav" aria-label="Workspace Navigation">
            <ul className="nav-list">
              {ROUTE_REGISTRY.map((route) => (
                <li key={route.path} className="nav-item">
                  <Link href={route.path} className="nav-link">{route.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      )}
      {pathname === '/audit' && (
        <div className="audit-return">
          <Link href="/" aria-label="Return to Alder Office Services">← <span>Alder Office Services</span></Link>
          <span className="audit-return__label">Internal verification workspace</span>
        </div>
      )}
      <main id="main-content" className={businessLayout ? 'business-main' : 'main-viewport'}>
        {children}
      </main>
      {!businessLayout && (
        <footer className="app-footer" role="contentinfo">
          <p>ResponseLock · Lead &amp; Conversion Integrity Audit demonstration workspace.</p>
        </footer>
      )}
    </>
  );
}
