import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { CrmStore, crmStore, DETERMINISTIC_LATENCY_MS } from '@/lib/crm-store';
import { POST as leadsPost } from '@/app/api/leads/route';
import { POST as resetPost } from '@/app/api/dev/reset/route';
import { GET as crmGet } from '@/app/api/crm/route';

describe('Wave 0 Empirical Adversarial Stress Test Suite', () => {
  const storeFilePath = crmStore.getFilePath();

  const getRawLines = async (): Promise<string[]> => {
    try {
      const content = await fs.readFile(storeFilePath, 'utf8');
      return content.split('\n').filter((line) => line.trim().length > 0);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  };

  beforeEach(async () => {
    await crmStore.resetStore();
  });

  afterEach(async () => {
    await crmStore.resetStore();
  });

  describe('1. CrmStore Concurrency & Async Mutex Stress (50+ Parallel Writes)', () => {
    it('executes 100 concurrent parallel writes with zero line interleaving and zero data loss', async () => {
      const CONCURRENCY = 100;
      const ids: string[] = [];

      const tasks = Array.from({ length: CONCURRENCY }).map((_, i) => {
        const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
        ids.push(id);
        return crmStore.appendRecord({
          submission_id: id,
          scenario: 'baseline',
          full_name: `Stress User ${i}`,
          work_email: `stress.${i}@example.com`,
          company_name: `LoadTest Corp ${i}`,
          monthly_ad_spend: '$10,000',
          primary_challenge: 'Concurrency stress testing',
          created_at: new Date().toISOString(),
          lead_source: 'google',
          lead_source_detail: 'cpc',
          campaign_name: 'responselock_demo',
          gclid: `GCLID-STRESS-${i}`,
          mapping_status: 'valid',
          missing_fields: [],
        });
      });

      // Execute all 100 writes concurrently
      await Promise.all(tasks);

      // Verify raw file line count
      const rawLines = await getRawLines();
      expect(rawLines).toHaveLength(CONCURRENCY);

      // Verify atomic JSON parsing on every line
      const parsedIds: string[] = [];
      for (const [index, line] of rawLines.entries()) {
        let parsed: any;
        try {
          parsed = JSON.parse(line);
        } catch (e) {
          throw new Error(`Line ${index + 1} corrupted or interleaved: "${line}"`);
        }
        expect(parsed).toHaveProperty('submission_id');
        expect(parsed).toHaveProperty('full_name');
        expect(parsed.full_name).toMatch(/^Stress User \d+$/);
        parsedIds.push(parsed.submission_id);
      }

      // Verify zero data loss and all IDs present
      expect(parsedIds.sort()).toEqual(ids.sort());

      // Verify listRecords returns all 100 records
      const records = await crmStore.listRecords();
      expect(records).toHaveLength(CONCURRENCY);
    });

    it('preserves JSONL integrity with multiline strings, emojis, quotes, and unicode', async () => {
      const complexRecord = {
        submission_id: 'e0e0e0e0-e0e0-40e0-80e0-e0e0e0e0e0e0',
        scenario: 'baseline' as const,
        full_name: 'Alice "The Auditor" O\'Connor',
        work_email: 'alice.test@example.com',
        company_name: 'Unicode & Emoji Corp 🚀 \n Line 2 \r\n Line 3 \t Tabbed "quoted"',
        monthly_ad_spend: '$50k+',
        primary_challenge: 'Multi-line \n and special chars: <>&"\'',
        created_at: new Date().toISOString(),
        lead_source: 'google',
        lead_source_detail: 'cpc',
        campaign_name: 'responselock_demo',
        gclid: 'DEMO-GCLID-UNICODE',
        mapping_status: 'valid' as const,
        missing_fields: [],
      };

      await crmStore.appendRecord(complexRecord);

      const rawLines = await getRawLines();
      // Must remain exactly 1 line despite multiline string content
      expect(rawLines).toHaveLength(1);

      const parsed = JSON.parse(rawLines[0]!);
      expect(parsed.company_name).toBe(complexRecord.company_name);
      expect(parsed.submission_id).toBe(complexRecord.submission_id);

      const fetched = await crmStore.getRecordBySubmissionId(complexRecord.submission_id);
      expect(fetched?.company_name).toBe(complexRecord.company_name);
    });

    it('handles mixed concurrent reads, writes, and lookups without race errors', async () => {
      const WRITE_COUNT = 50;
      const READ_COUNT = 50;

      const writeTasks = Array.from({ length: WRITE_COUNT }).map((_, i) => {
        const id = `11111111-0000-4000-8000-${String(i).padStart(12, '0')}`;
        return crmStore.appendRecord({
          submission_id: id,
          scenario: 'baseline',
          full_name: `Interleaved User ${i}`,
          work_email: `interleaved.${i}@example.com`,
          company_name: `Interleaved Corp ${i}`,
          monthly_ad_spend: '$5,000',
          primary_challenge: 'Interleaving test',
          created_at: new Date().toISOString(),
          lead_source: 'google',
          lead_source_detail: 'cpc',
          campaign_name: 'responselock_demo',
          gclid: `GCLID-INT-${i}`,
          mapping_status: 'valid',
          missing_fields: [],
        });
      });

      const readTasks = Array.from({ length: READ_COUNT }).map(async (_, i) => {
        const records = await crmStore.listRecords();
        expect(Array.isArray(records)).toBe(true);
        await crmStore.getRecordBySubmissionId(`11111111-0000-4000-8000-${String(i % 10).padStart(12, '0')}`);
      });

      await Promise.all([...writeTasks, ...readTasks]);

      const finalRecords = await crmStore.listRecords();
      expect(finalRecords).toHaveLength(WRITE_COUNT);
    });
  });

  describe('2. /api/leads Invariant Enforcement & Boundary Testing', () => {
    const validSubmission = {
      submission_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      scenario: 'baseline',
      full_name: 'Empirical Tester',
      work_email: 'demo.tester@example.com',
      company_name: 'Acme Test Labs',
      monthly_ad_spend: '$10k-$50k',
      primary_challenge: 'Testing Invariants',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
        attribution_status: 'present',
      },
    };

    const makeRequest = (body: any, headers: Record<string, string> = {}) => {
      return new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': body?.submission_id || '',
          ...headers,
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    };

    it('rejects requests missing Idempotency-Key header and writes 0 lines', async () => {
      const req = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validSubmission),
      });

      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors).toHaveProperty('idempotency_key');

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects requests with mismatched Idempotency-Key header and writes 0 lines', async () => {
      const req = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': '99999999-9999-4999-8999-999999999999',
        },
        body: JSON.stringify(validSubmission),
      });

      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors.idempotency_key).toContain('must match');

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects requests with populated website honeypot and writes 0 lines', async () => {
      const spamPayload = {
        ...validSubmission,
        website: 'https://malicious-spam-site.com',
      };

      const req = makeRequest(spamPayload);
      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(JSON.stringify(json.errors)).toMatch(/honeypot/i);

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects requests with populated fax honeypot and writes 0 lines', async () => {
      const spamPayload = {
        ...validSubmission,
        fax: '+1-555-0100',
      };

      const req = makeRequest(spamPayload);
      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(JSON.stringify(json.errors)).toMatch(/honeypot/i);

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects requests with populated honeypot alias field and writes 0 lines', async () => {
      const spamPayload = {
        ...validSubmission,
        honeypot: 'bot-detected',
      };

      const req = makeRequest(spamPayload);
      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects requests with malformed email addresses and writes 0 lines', async () => {
      const badEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'invalid..email@example.com'];

      for (const badEmail of badEmails) {
        const payload = {
          ...validSubmission,
          submission_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          work_email: badEmail,
        };

        const req = makeRequest(payload);
        const res = await leadsPost(req);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.errors).toHaveProperty('work_email');

        const lines = await getRawLines();
        expect(lines).toHaveLength(0);
      }
    });

    it('rejects requests with missing required fields and writes 0 lines', async () => {
      const testCases = [
        { ...validSubmission, full_name: '' },
        { ...validSubmission, company_name: '' },
        { ...validSubmission, scenario: 'invalid-scenario' },
        { ...validSubmission, submission_id: 'not-a-uuid' },
      ];

      for (const badPayload of testCases) {
        const req = makeRequest(badPayload, {
          'Idempotency-Key': badPayload.submission_id || '',
        });
        const res = await leadsPost(req);
        expect(res.status).toBe(400);

        const lines = await getRawLines();
        expect(lines).toHaveLength(0);
      }
    });

    it('rejects string lengths exceeding maximum allowed and writes 0 lines', async () => {
      const overMaxPayload = {
        ...validSubmission,
        full_name: 'A'.repeat(101),
        notes: 'N'.repeat(501),
      };

      const req = makeRequest(overMaxPayload);
      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors).toHaveProperty('full_name');

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('rejects invalid JSON string body cleanly with 400 and writes 0 lines', async () => {
      const req = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        },
        body: '{"submission_id": "malformed json...',
      });

      const res = await leadsPost(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors).toHaveProperty('body');

      const lines = await getRawLines();
      expect(lines).toHaveLength(0);
    });

    it('handles sequential duplicate submissions idempotently returning exactly 1 record', async () => {
      const req1 = makeRequest(validSubmission);
      const res1 = await leadsPost(req1);
      expect(res1.status).toBe(201);
      const json1 = await res1.json();
      expect(json1.success).toBe(true);
      expect(json1.submission_id).toBe(validSubmission.submission_id);

      // Send duplicate with same submission_id after first completes
      const req2 = makeRequest(validSubmission);
      const res2 = await leadsPost(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.success).toBe(true);
      expect(json2.duplicate).toBe(true);

      // Assert strictly that EXACTLY ONE record exists in the store
      const lines = await getRawLines();
      expect(lines).toHaveLength(1);

      const records = await crmStore.listRecords();
      expect(records).toHaveLength(1);
      expect(records[0]?.submission_id).toBe(validSubmission.submission_id);
    });

    it('safely deduplicates concurrent duplicate submissions arriving within the 420ms window', async () => {
      const concurrentSubmission = {
        ...validSubmission,
        submission_id: 'c0000000-0000-4000-8000-000000000001',
      };

      const req1 = makeRequest(concurrentSubmission);
      const req2 = makeRequest(concurrentSubmission);

      // Fire both simultaneously within the 420ms latency window
      const [res1, res2] = await Promise.all([leadsPost(req1), leadsPost(req2)]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 201]);

      const res200 = res1.status === 200 ? res1 : res2;
      const json200 = await res200.json();
      expect(json200.success).toBe(true);
      expect(json200.duplicate).toBe(true);

      const res201 = res1.status === 201 ? res1 : res2;
      const json201 = await res201.json();
      expect(json201.success).toBe(true);
      expect(json201.duplicate).toBeUndefined();

      const lines = await getRawLines();
      const records = await crmStore.listRecords();

      // Invariant: Exactly 1 record written to disk, exactly 1 record in store
      expect(records).toHaveLength(1);
      expect(lines).toHaveLength(1);
      expect(records[0]?.submission_id).toBe('c0000000-0000-4000-8000-000000000001');
    });
  });

  describe('3. Dev Reset (/api/dev/reset) & CRM Read Endpoint', () => {
    it('truncates the store cleanly and returns 200', async () => {
      await crmStore.appendRecord({
        submission_id: '22222222-2222-4222-8222-222222222222',
        scenario: 'baseline',
        full_name: 'Pre-Reset User',
        work_email: 'prereset@example.com',
        company_name: 'Pre-Reset Corp',
        monthly_ad_spend: '$10k',
        primary_challenge: 'Reset testing',
        created_at: new Date().toISOString(),
        lead_source: 'google',
        lead_source_detail: 'cpc',
        campaign_name: 'demo',
        gclid: 'DEMO-GCLID',
        mapping_status: 'valid',
        missing_fields: [],
      });

      expect((await getRawLines()).length).toBe(1);

      const res = await resetPost();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect((await getRawLines()).length).toBe(0);
      expect((await crmStore.listRecords()).length).toBe(0);
    });

    it('blocks reset endpoint when NODE_ENV === production with 403 Forbidden', async () => {
      const env = process.env as Record<string, string | undefined>;
      const originalEnv = env['NODE_ENV'];
      try {
        env['NODE_ENV'] = 'production';
        const res = await resetPost();
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toMatch(/disabled in production/i);
      } finally {
        env['NODE_ENV'] = originalEnv;
      }
    });

    it('handles concurrent reset and parallel writes without file corruption or unhandled errors', async () => {
      const TOTAL = 30;

      const tasks = Array.from({ length: TOTAL }).map(async (_, i) => {
        if (i === 15) {
          return resetPost();
        }
        return crmStore.appendRecord({
          submission_id: `33333333-0000-4000-8000-${String(i).padStart(12, '0')}`,
          scenario: 'baseline',
          full_name: `Reset Stress User ${i}`,
          work_email: `resetstress.${i}@example.com`,
          company_name: `Reset Corp ${i}`,
          monthly_ad_spend: '$10k',
          primary_challenge: 'Reset Stress',
          created_at: new Date().toISOString(),
          lead_source: 'google',
          lead_source_detail: 'cpc',
          campaign_name: 'demo',
          gclid: `GCLID-${i}`,
          mapping_status: 'valid',
          missing_fields: [],
        });
      });

      await expect(Promise.all(tasks)).resolves.not.toThrow();

      const rawLines = await getRawLines();
      for (const line of rawLines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }

      const records = await crmStore.listRecords();
      expect(records.length).toBe(rawLines.length);
    });

    it('GET /api/crm returns all stored records with correct count and cache headers', async () => {
      await crmStore.appendRecord({
        submission_id: '55555555-5555-4555-8555-555555555555',
        scenario: 'baseline',
        full_name: 'Viewer User',
        work_email: 'viewer@example.com',
        company_name: 'Viewer Corp',
        monthly_ad_spend: '$5k',
        primary_challenge: 'CRM route testing',
        created_at: new Date().toISOString(),
        lead_source: 'google',
        lead_source_detail: 'cpc',
        campaign_name: 'demo',
        gclid: 'DEMO-GCLID',
        mapping_status: 'valid',
        missing_fields: [],
      });

      const res = await crmGet();
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(json.records).toHaveLength(1);
      expect(json.records[0].submission_id).toBe('55555555-5555-4555-8555-555555555555');
    });
  });
});
