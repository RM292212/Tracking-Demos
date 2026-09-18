import React from 'react';
import Link from 'next/link';
import { ROUTE_REGISTRY } from '@/lib/contracts/routes';

export default function HomePage(): React.ReactElement {
  return (
    <section>
      <h1>ResponseLock Lead &amp; Conversion Integrity Audit Demo</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
        Welcome to the ResponseLock demonstration and training workspace.
        This workspace allows you to inspect, test, and break every link in the conversion tracking chain.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Scenarios &amp; Tools</h2>
        <ul style={{ marginTop: '1rem', listStyle: 'none', display: 'grid', gap: '1rem' }}>
          {ROUTE_REGISTRY.map((route) => (
            <li
              key={route.path}
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}
            >
              <Link
                href={route.path}
                style={{
                  color: 'var(--color-primary-500)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-lg)',
                }}
              >
                {route.title}
              </Link>
              <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {route.description}
              </p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {route.verificationLayers.map((layer) => (
                  <span
                    key={layer}
                    style={{
                      background: 'var(--color-bg-surface-raised)',
                      color: 'var(--color-text-muted)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {layer}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
