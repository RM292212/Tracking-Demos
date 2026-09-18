import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CrmStore, AsyncMutex } from '@/lib/crm-store';
import type { CrmRecord } from '@/lib/contracts/crm';

describe('Adversarial Concurrency Red-Team: CrmStore & AsyncMutex', () => {
  const tempStorePath = path.join(process.cwd(), 'data', 'redteam-crm-test.jsonl');
  let store: CrmStore;

  const createSampleRecord = (id: string, index: number): CrmRecord => ({
    submission_id: id,
    scenario: 'baseline',
    full_name: `User ${index}`,
    work_email: `user${index}@example.com`,
    company_name: `Company ${index}`,
    monthly_ad_spend: '$10k-$50k',
    primary_challenge: 'Discrepancy',
    phone: '+1-555-0100',
    notes: `Stress test note ${index}`,
    created_at: new Date().toISOString(),
    lead_source: 'google',
    lead_source_detail: 'cpc',
    campaign_name: 'responselock_demo',
    gclid: `GCLID-${index}`,
    mapping_status: 'valid',
    missing_fields: [],
  });

  beforeEach(async () => {
    store = new CrmStore(tempStorePath);
    await store.resetStore();
  });

  afterEach(async () => {
    try {
      await fs.unlink(tempStorePath);
    } catch {}
  });

  it('Stress Test 1: 200 concurrent distinct writes produce zero corruption and zero data loss', async () => {
    const COUNT = 200;
    const records = Array.from({ length: COUNT }, (_, i) =>
      createSampleRecord(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, i)
    );

    const results = await Promise.all(records.map((rec) => store.appendRecord(rec)));

    // Verify all returned non-duplicate
    expect(results.every((r) => !r.duplicate)).toBe(true);

    // Verify raw file has exactly 200 valid lines
    const content = await fs.readFile(tempStorePath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(COUNT);

    // Verify each line parses without error
    const parsedIds = lines.map((l) => JSON.parse(l).submission_id);
    expect(new Set(parsedIds).size).toBe(COUNT);

    // Verify listRecords returns all 200
    const list = await store.listRecords();
    expect(list).toHaveLength(COUNT);
  });

  it('Stress Test 2: 100 concurrent writes with the EXACT SAME submission_id produces exactly 1 row', async () => {
    const SAME_ID = '11111111-2222-4333-8444-555555555555';
    const COUNT = 100;
    const records = Array.from({ length: COUNT }, (_, i) => createSampleRecord(SAME_ID, i));

    const results = await Promise.all(records.map((rec) => store.appendRecord(rec)));

    const nonDuplicates = results.filter((r) => !r.duplicate);
    const duplicates = results.filter((r) => r.duplicate);

    expect(nonDuplicates).toHaveLength(1);
    expect(duplicates).toHaveLength(COUNT - 1);

    // Raw file must contain exactly 1 line
    const content = await fs.readFile(tempStorePath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]!);
    expect(parsed.submission_id).toBe(SAME_ID);
  });

  it('Stress Test 3: 50 unique IDs each submitted 4 times concurrently (200 writes) produces exactly 50 rows', async () => {
    const NUM_UNIQUE = 50;
    const REPEATS = 4;
    const writes: Promise<{ record: CrmRecord; duplicate: boolean }>[] = [];

    for (let i = 0; i < NUM_UNIQUE; i++) {
      const id = `aabbccdd-0000-4000-8000-${String(i).padStart(12, '0')}`;
      for (let r = 0; r < REPEATS; r++) {
        writes.push(store.appendRecord(createSampleRecord(id, i)));
      }
    }

    // Reorder writes to simulate interleaved arrival order
    writes.reverse();

    const results = await Promise.all(writes);

    const nonDuplicates = results.filter((r) => !r.duplicate);
    const duplicates = results.filter((r) => r.duplicate);

    expect(nonDuplicates).toHaveLength(NUM_UNIQUE);
    expect(duplicates).toHaveLength(NUM_UNIQUE * (REPEATS - 1));

    const content = await fs.readFile(tempStorePath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(NUM_UNIQUE);
  });

  it('Stress Test 4: AsyncMutex recovers when an operation throws an error without deadlocking future calls', async () => {
    const mutex = new AsyncMutex();
    let completedAfterThrow = false;

    // First task throws
    const failingTask = mutex.runExclusive(async () => {
      throw new Error('Simulated disk/serialization failure inside mutex');
    });

    // Second task queued behind it
    const succeedingTask = mutex.runExclusive(async () => {
      completedAfterThrow = true;
      return 42;
    });

    await expect(failingTask).rejects.toThrow('Simulated disk/serialization failure');
    const result = await succeedingTask;
    expect(result).toBe(42);
    expect(completedAfterThrow).toBe(true);
  });

  it('Stress Test 5: Concurrent mixed read/write storm executes safely without deadlock', async () => {
    const WRITE_COUNT = 60;
    const READ_COUNT = 60;

    const operations: Promise<unknown>[] = [];

    for (let i = 0; i < WRITE_COUNT; i++) {
      const id = `mix00000-0000-4000-8000-${String(i).padStart(12, '0')}`;
      operations.push(store.appendRecord(createSampleRecord(id, i)));
    }

    for (let i = 0; i < READ_COUNT; i++) {
      operations.push(store.listRecords());
      operations.push(store.getRecordBySubmissionId(`mix00000-0000-4000-8000-${String(i % 10).padStart(12, '0')}`));
    }

    const settled = await Promise.allSettled(operations);
    expect(settled.every((s) => s.status === 'fulfilled')).toBe(true);

    const list = await store.listRecords();
    expect(list).toHaveLength(WRITE_COUNT);
  });

  it('Stress Test 6: File corruption resilience: skips partial or corrupted JSON lines gracefully', async () => {
    await fs.mkdir(path.dirname(tempStorePath), { recursive: true });
    // Intentionally inject corrupted and blank lines into the JSONL file
    const validRec1 = createSampleRecord('corrupt-test-1111-4111-8111-111111111111', 1);
    const validRec2 = createSampleRecord('corrupt-test-2222-4222-8222-222222222222', 2);

    const corruptedContent = [
      JSON.stringify(validRec1),
      '{ "malformed_json": ',
      '   ',
      JSON.stringify(validRec2),
      'BROKEN LINE NOT JSON',
      '',
    ].join('\n');

    await fs.writeFile(tempStorePath, corruptedContent, 'utf8');

    // listRecords should gracefully skip corrupted lines without throwing
    const records = await store.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]?.submission_id).toBe(validRec1.submission_id);
    expect(records[1]?.submission_id).toBe(validRec2.submission_id);
  });
});
