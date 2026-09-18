import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import type { CrmRecord } from './contracts/crm';

/**
 * Deterministic latency constant (constant 420ms sleep).
 * Never use Math.random() in latency or test logic.
 */
export const DETERMINISTIC_LATENCY_MS = 420;

/**
 * Result of appending a CRM record under mutex.
 */
export interface AppendRecordResult {
  record: CrmRecord;
  duplicate: boolean;
}

/**
 * Lightweight in-memory Async Mutex providing FIFO mutual exclusion
 * for asynchronous file operations without third-party dependencies.
 */
export class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.queue;
    // Chained queue swallows errors from previous tasks so future locks can proceed
    this.queue = this.queue.then(
      () => next,
      () => next
    );

    await previous;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

/**
 * File-backed CRM store utilizing JSONL format with Async Mutex concurrency control.
 * Target storage file: demo/data/crm-records.jsonl
 */
export class CrmStore {
  private readonly filePath: string;
  private readonly mutex: AsyncMutex;

  constructor(customPath?: string) {
    this.filePath = customPath || this.resolveStoragePath();
    this.mutex = new AsyncMutex();
  }

  private resolveStoragePath(): string {
    if (process.env['CRM_STORAGE_PATH']) {
      return path.resolve(process.env['CRM_STORAGE_PATH']);
    }
    const cwd = process.cwd();
    // Check if executed inside demo/ directory
    if (fsSync.existsSync(path.join(cwd, 'src'))) {
      return path.join(cwd, 'data', 'crm-records.jsonl');
    }
    // Executed from project root
    return path.join(cwd, 'demo', 'data', 'crm-records.jsonl');
  }

  private async ensureStorageFile(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '', 'utf8');
    }
  }

  private async readRecordsUnlocked(): Promise<CrmRecord[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      const lines = content.split('\n');
      const records: CrmRecord[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as CrmRecord;
          records.push(parsed);
        } catch {
          // Gracefully skip corrupted or partial lines
        }
      }
      return records;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Appends a new CRM record as a JSONL row with atomic deduplication.
   * Serialized via Async Mutex.
   * If a record with record.submission_id is already stored, returns
   * { record: existingRecord, duplicate: true } without appending a new line.
   */
  async appendRecord(record: CrmRecord): Promise<AppendRecordResult> {
    return this.mutex.runExclusive(async () => {
      await this.ensureStorageFile();
      const existing = await this.readRecordsUnlocked();
      const match = existing.find((r) => r.submission_id === record.submission_id);
      if (match) {
        return { record: match, duplicate: true };
      }
      const line = JSON.stringify(record) + '\n';
      await fs.appendFile(this.filePath, line, 'utf8');
      return { record, duplicate: false };
    });
  }

  /**
   * Returns all stored CRM records in chronological order.
   */
  async listRecords(): Promise<CrmRecord[]> {
    return this.mutex.runExclusive(async () => {
      return this.readRecordsUnlocked();
    });
  }

  /**
   * Finds a CRM record by its unique submission_id (UUID v4).
   */
  async getRecordBySubmissionId(submissionId: string): Promise<CrmRecord | null> {
    return this.mutex.runExclusive(async () => {
      const records = await this.readRecordsUnlocked();
      const record = records.find((r) => r.submission_id === submissionId);
      return record ?? null;
    });
  }

  /**
   * Truncates the JSONL storage file. Used by dev reset endpoint and tests.
   */
  async resetStore(): Promise<void> {
    return this.mutex.runExclusive(async () => {
      await this.ensureStorageFile();
      await fs.writeFile(this.filePath, '', 'utf8');
    });
  }

  getFilePath(): string {
    return this.filePath;
  }
}

// Preserve singleton across Next.js Hot Module Replacement (HMR)
const globalForCrm = globalThis as unknown as {
  crmStoreInstance?: CrmStore;
};

export const crmStore = globalForCrm.crmStoreInstance ?? new CrmStore();

if (process.env['NODE_ENV'] !== 'production') {
  globalForCrm.crmStoreInstance = crmStore;
}
