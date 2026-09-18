/**
 * ResponseLock 404 - Not Found Page
 * Location: demo/src/app/not-found.tsx
 *
 * Implements accessible WCAG AA compliant 404 UI using tokens.css.
 * Resolves Next.js 15 App Router page trace resolution on Windows.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTE_REGISTRY } from '@/lib/contracts/routes';

export const metadata: Metadata = {
  title: '404 - Page Not Found | ResponseLock Demo Workspace',
  description:
    'The requested page or scenario does not exist in the ResponseLock demonstration workspace.',
};

export default function NotFound(): React.ReactElement {
  return (
    <section
      aria-labelledby="not-found-title"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-4)',
      }}
    >
      {/* Visual & Screen-Reader Status Badge */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-3)',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-error-bg)',
          border: '1px solid var(--color-error-border)',
          color: 'var(--color-error-text)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
          fontFamily: 'var(--font-family-mono)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <span>Error 404</span>
        <span aria-hidden="true">•</span>
        <span>Route Not Found</span>
      </div>

      {/* Primary Heading */}
      <h1
        id="not-found-title"
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-tight)',
          marginBottom: 'var(--space-3)',
        }}
      >
        Resource Not Found
      </h1>

      {/* Educational Explanation */}
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-relaxed)',
          marginBottom: 'var(--space-6)',
        }}
      >
        The URL you requested does not match any of the canonical routes or tracking defect
        scenarios configured in this local training workspace.
      </p>

      {/* Quick Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <Link
          href="/"
          className="btn-focus"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-contrast)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          ← Return to Workspace Index
        </Link>
        <Link
          href="/scenario/baseline"
          className="btn-focus"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface-raised)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: 'var(--font-size-sm)',
            textDecoration: 'none',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          Open Baseline Form
        </Link>
      </div>

      {/* Canonical Scenarios Directory */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Canonical Workspace Scenarios
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Select one of the valid routes below to test conversion tracking and defect behavior:
        </p>

        <ul
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-3)',
            padding: 0,
            margin: 0,
          }}
        >
          {ROUTE_REGISTRY.map((route) => (
            <li
              key={route.path}
              style={{
                backgroundColor: 'var(--color-bg-surface-raised)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
              }}
            >
              <Link
                href={route.path}
                className="btn-focus"
                style={{
                  color: 'var(--color-primary-500)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-sm)',
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: 'var(--space-1)',
                }}
              >
                {route.title}
              </Link>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {route.path}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Embedded CSS for Accessible Focus Rings */}
      <style>{`
        .btn-focus:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }
      `}</style>
    </section>
  );
}
