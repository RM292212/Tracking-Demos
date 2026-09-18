import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { CrmStore, DETERMINISTIC_LATENCY_MS } from '@/lib/crm-store';
import { LeadSubmissionPayloadSchema } from '@/lib/contracts/schema';
import { mapBaselineLeadToCrm, mapDefect06LeadToCrm } from '@/lib/mappers';

const TEST_STORAGE_PATH = path.resolve(__dirname, '../../data/test-crm-records.jsonl');

describe('Wave 0 Smoke Test Suite: Store, Contracts, and Mappers', () => {
  let store: CrmStore;

  beforeEach(async () => {
    store = new CrmStore(TEST_STORAGE_PATH);
    await store.resetStore();
  });

  afterEach(async () => {
    try {
      await fs.unlink(TEST_STORAGE_PATH);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('CrmStore & Async Mutex Operations', () => {
    it('initializes empty after resetStore()', async () => {
      const records = await store.listRecords();
      expect(records).toEqual([]);
    });

    it('appends and reads back a valid CRM record', async () => {
      const record = {
        submission_id: '11111111-1111-4111-8111-111111111111',
        scenario: 'baseline' as const,
        full_name: 'Jane Doe',
        work_email: 'demo.user@example.com',
        company_name: 'Acme Agency',
        monthly_ad_spend: '$10k-$50k',
        primary_challenge: 'Conversion Tracking',
        created_at: new Date().toISOString(),
        lead_source: 'google',
        lead_source_detail: 'cpc',
        campaign_name: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
        mapping_status: 'valid' as const,
        missing_fields: [],
      };

      await store.appendRecord(record);
      const records = await store.listRecords();
      expect(records).toHaveLength(1);
      expect(records[0]?.submission_id).toBe(record.submission_id);

      const found = await store.getRecordBySubmissionId(record.submission_id);
      expect(found).not.toBeNull();
      expect(found?.full_name).toBe('Jane Doe');
    });

    it('handles concurrent appends cleanly using Async Mutex without line corruption', async () => {
      const parallelWrites = 10;
      const tasks = Array.from({ length: parallelWrites }).map((_, i) => {
        const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
        return store.appendRecord({
          submission_id: id,
          scenario: 'baseline' as const,
          full_name: `User ${i}`,
          work_email: `demo.user.${i}@example.com`,
          company_name: `Company ${i}`,
          monthly_ad_spend: '$10k',
          primary_challenge: 'Audit',
          created_at: new Date().toISOString(),
          lead_source: 'google',
          lead_source_detail: 'cpc',
          campaign_name: 'demo',
          gclid: `GCLID-${i}`,
          mapping_status: 'valid' as const,
          missing_fields: [],
        });
      });

      await Promise.all(tasks);
      const records = await store.listRecords();
      expect(records).toHaveLength(parallelWrites);

      // Verify file content has exactly parallelWrites newline-separated lines
      const content = await fs.readFile(TEST_STORAGE_PATH, 'utf8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(parallelWrites);
    });
  });

  describe('Zod Payload Validation Contract', () => {
    it('accepts a valid fictional submission payload', () => {
      const payload = {
        submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scenario: 'baseline',
        full_name: 'Fictional Auditor',
        work_email: 'demo.user@example.com',
        company_name: 'Example Media Group',
        monthly_ad_spend: '$5,000 - $15,000',
        primary_challenge: 'GTM dataLayer sync',
        attribution: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'responselock_demo',
          gclid: 'DEMO-GCLID-001',
          attribution_status: 'present',
        },
      };

      const result = LeadSubmissionPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects submissions with invalid email or missing fields', () => {
      const badPayload = {
        submission_id: 'not-a-uuid',
        scenario: 'baseline',
        full_name: '',
        work_email: 'not-an-email',
      };

      const result = LeadSubmissionPayloadSchema.safeParse(badPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('submission_id');
        expect(paths).toContain('full_name');
        expect(paths).toContain('work_email');
        expect(paths).toContain('company_name');
      }
    });

    it('rejects honeypot populated submission', () => {
      const spamPayload = {
        submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scenario: 'baseline',
        full_name: 'Spam Bot',
        work_email: 'bot@example.com',
        company_name: 'Spam Corp',
        monthly_ad_spend: '$10k',
        primary_challenge: 'Spam',
        website: 'https://spam-link.com',
      };

      const result = LeadSubmissionPayloadSchema.safeParse(spamPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Scenario Field Mappers', () => {
    const mockPayload = {
      submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      scenario: 'baseline' as const,
      full_name: 'Jane Doe',
      work_email: 'demo.user@example.com',
      company_name: 'Acme Agency',
      monthly_ad_spend: '$10k',
      primary_challenge: 'Attribution',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
        attribution_status: 'present' as const,
      },
    };

    it('baseline mapper maps all fields with valid status', () => {
      const mapped = mapBaselineLeadToCrm(mockPayload);
      expect(mapped.lead_source).toBe('google');
      expect(mapped.lead_source_detail).toBe('cpc');
      expect(mapped.campaign_name).toBe('responselock_demo');
      expect(mapped.gclid).toBe('DEMO-GCLID-001');
      expect(mapped.mapping_status).toBe('valid');
      expect(mapped.missing_fields).toEqual([]);
    });

    it('defect-6 mapper swaps source and drops campaign', () => {
      const mapped = mapDefect06LeadToCrm({ ...mockPayload, scenario: 'defect-6' });
      expect(mapped.lead_source).toBe(''); // dropped
      expect(mapped.lead_source_detail).toBe('google'); // mismapped from source
      expect(mapped.campaign_name).toBe(''); // dropped
      expect(mapped.mapping_status).toBe('corrupted');
      expect(mapped.missing_fields).toEqual(['lead_source', 'campaign_name']);
    });
  });

  describe('Deterministic Latency Constant', () => {
    it('guarantees constant latency value of 420ms without randomness', () => {
      expect(DETERMINISTIC_LATENCY_MS).toBe(420);
      expect(typeof DETERMINISTIC_LATENCY_MS).toBe('number');
    });
  });
});
