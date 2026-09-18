import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';

export default function CrmPage(): React.ReactElement {
  const route = getRouteByPath('/crm');

  return (
    <section>
      {/* Permanent Warning / Disclaimer Banner mandated by spec */}
      <div
        style={{
          background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)',
          color: 'var(--color-warning-text)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
        }}
      >
        <strong>Notice:</strong> This is a local simulated CRM used only for ResponseLock training.
        It is not a production CRM and contains only fictional test records.
      </div>

      <h1>{route?.title ?? 'Simulated CRM Viewer'}</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
        {route?.description}
      </p>

      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--color-border-default)', borderRadius: 'var(--radius-md)' }}>
        <p>Wave 0 Foundation Active. Full CRM inspection table lands in Wave 1.</p>
      </div>
    </section>
  );
}
