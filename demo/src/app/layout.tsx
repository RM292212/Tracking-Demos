/**
 * ResponseLock Root Layout
 * Location: demo/src/app/layout.tsx
 *
 * Implements accessible semantic skeleton (header, main, footer),
 * skip link, tokens stylesheet, and GTM integration.
 */

import React from 'react';
import type { Metadata, Viewport } from 'next';
import { GtmScript } from '@/components/GtmScript';
import { WebsiteShell } from '@/components/WebsiteShell';
import '@/styles/tokens.css';
import '@/styles/globals.css';
import '@/styles/business.css';

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
        <WebsiteShell>{children}</WebsiteShell>
      </body>
    </html>
  );
}
