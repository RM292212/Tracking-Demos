import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';

export default function Defect3Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-3');

  return (
    <section>
      <h1>{route?.title ?? 'Defect 3: Missing Conversion Event'}</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
        {route?.description}
      </p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        {route?.verificationLayers.map((layer) => (
          <span
            key={layer}
            style={{
              background: 'var(--color-bg-surface-raised)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {layer}
          </span>
        ))}
      </div>
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px dashed var(--color-border-default)', borderRadius: 'var(--radius-md)' }}>
        <p>Wave 0 Foundation Active. Defect 3 implementation lands in Wave 1.</p>
      </div>
    </section>
  );
}
