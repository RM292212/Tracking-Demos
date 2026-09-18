import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';

export default function EvidencePage(): React.ReactElement {
  const route = getRouteByPath('/evidence');

  return (
    <section>
      <h1>{route?.title ?? 'Audit Evidence Hub'}</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
        {route?.description}
      </p>

      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--color-border-default)', borderRadius: 'var(--radius-md)' }}>
        <p>Wave 0 Foundation Active. Evidence findings and matrix views land in Wave 1.</p>
      </div>
    </section>
  );
}
