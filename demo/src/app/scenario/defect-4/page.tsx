import React from 'react';
import { getRouteByPath } from '@/lib/contracts/routes';

export default function Defect4Page(): React.ReactElement {
  const route = getRouteByPath('/scenario/defect-4');

  return (
    <section>
      <h1>{route?.title ?? 'Defect 4: Bad/Missing Event Parameters'}</h1>
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
        <p>Wave 0 Foundation Active. Defect 4 implementation lands in Wave 1.</p>
      </div>
    </section>
  );
}
