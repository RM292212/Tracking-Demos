import { NextResponse } from 'next/server';
import { crmStore, DETERMINISTIC_LATENCY_MS } from '@/lib/crm-store';
import { LeadSubmissionPayloadSchema } from '@/lib/contracts/schema';
import type { CrmRecord } from '@/lib/contracts/crm';
import { getCrmMapper } from '@/lib/mappers';

export async function POST(request: Request) {
  // 1. Enforce Idempotency-Key header presence
  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    request.headers.get('Idempotency-Key');

  if (!idempotencyKey) {
    return NextResponse.json(
      {
        success: false,
        errors: { idempotency_key: 'Idempotency-Key header is required' },
      },
      { status: 400 }
    );
  }

  // 2. Parse request JSON body safely
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: { body: 'Invalid JSON payload' },
      },
      { status: 400 }
    );
  }

  // 3. Check honeypot fields before schema parsing
  if (
    typeof rawBody === 'object' &&
    rawBody !== null &&
    (('website' in rawBody && Boolean((rawBody as Record<string, unknown>)['website'])) ||
      ('fax' in rawBody && Boolean((rawBody as Record<string, unknown>)['fax'])) ||
      ('honeypot' in rawBody && Boolean((rawBody as Record<string, unknown>)['honeypot'])))
  ) {
    return NextResponse.json(
      {
        success: false,
        errors: { form: 'Submission rejected by honeypot verification' },
      },
      { status: 400 }
    );
  }

  // 4. Server-side Zod validation
  const validationResult = LeadSubmissionPayloadSchema.safeParse(rawBody);
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validationResult.error.issues) {
      const field = issue.path.join('.') || 'form';
      fieldErrors[field] = issue.message;
    }
    // Invariant: Zero CRM writes on validation failure
    return NextResponse.json(
      {
        success: false,
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  const payload = validationResult.data;

  // 5. Enforce Idempotency-Key matches body submission_id
  if (idempotencyKey !== payload.submission_id) {
    return NextResponse.json(
      {
        success: false,
        errors: {
          idempotency_key: 'Idempotency-Key header must match submission_id',
        },
      },
      { status: 400 }
    );
  }

  // 6. Check for duplicate submission (Idempotency handling)
  const existingRecord = await crmStore.getRecordBySubmissionId(payload.submission_id);
  if (existingRecord) {
    return NextResponse.json(
      {
        success: true,
        submission_id: existingRecord.submission_id,
        status: 'confirmed',
        created_at: existingRecord.created_at,
        scenario: existingRecord.scenario,
        duplicate: true,
      },
      { status: 200 }
    );
  }

  // 7. Deterministic latency simulation (sleep fixed 420ms)
  await new Promise((resolve) => setTimeout(resolve, DETERMINISTIC_LATENCY_MS));

  // 8. Apply scenario field mapper
  const mapper = getCrmMapper(payload.scenario);
  const mapped = mapper(payload);

  // 9. Construct canonical CRM record
  const newRecord: CrmRecord = {
    submission_id: payload.submission_id,
    scenario: payload.scenario,
    full_name: payload.full_name,
    work_email: payload.work_email,
    company_name: payload.company_name,
    monthly_ad_spend: payload.monthly_ad_spend || '',
    primary_challenge: payload.primary_challenge || '',
    phone: payload.phone || '',
    notes: payload.notes || '',
    created_at: new Date().toISOString(),
    lead_source: mapped.lead_source,
    lead_source_detail: mapped.lead_source_detail,
    campaign_name: mapped.campaign_name,
    gclid: mapped.gclid,
    mapping_status: mapped.mapping_status,
    missing_fields: mapped.missing_fields,
    intentionally_missing_fields: mapped.missing_fields,
  };

  // 10. Persist to JSONL store under Async Mutex lock with atomic deduplication
  const appendResult = await crmStore.appendRecord(newRecord);

  if (appendResult.duplicate) {
    return NextResponse.json(
      {
        success: true,
        submission_id: appendResult.record.submission_id,
        status: 'confirmed',
        created_at: appendResult.record.created_at,
        scenario: appendResult.record.scenario,
        duplicate: true,
      },
      { status: 200 }
    );
  }

  // 11. Return 201 Created
  return NextResponse.json(
    {
      success: true,
      submission_id: appendResult.record.submission_id,
      status: 'confirmed',
      created_at: appendResult.record.created_at,
      scenario: appendResult.record.scenario,
    },
    { status: 201 }
  );
}
