import { NextResponse } from 'next/server';
import { crmStore } from '@/lib/crm-store';

export async function GET() {
  const records = await crmStore.listRecords();

  return NextResponse.json(
    {
      success: true,
      count: records.length,
      records,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
