import type React from 'react';
import type { Metadata } from 'next';
import { AuditRepairLab } from '@/components/AuditRepairLab';

export const metadata: Metadata = {
  title: 'Conversion Repair Lab | ResponseLock',
  description: 'Trace a synthetic business inquiry through validation, the local API, CRM storage, and a zero-PII dataLayer event.',
};

export default function AuditPage(): React.ReactElement {
  return <AuditRepairLab />;
}
