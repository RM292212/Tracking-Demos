import { NextResponse } from 'next/server';
import { crmStore } from '@/lib/crm-store';

export async function POST() {
  if (process.env['NODE_ENV'] === 'production') {
    return NextResponse.json(
      { success: false, error: 'Reset endpoint is disabled in production' },
      { status: 403 }
    );
  }

  await crmStore.resetStore();

  return NextResponse.json(
    { success: true, message: 'CRM store reset' },
    { status: 200 }
  );
}
