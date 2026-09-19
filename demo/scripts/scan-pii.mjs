#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const ALLOWED_ID_FILES = new Set([
  'ORIGINAL_REQUEST.md',
  'PROJECT.md',
  '.env',
  '.env.local',
  '.env.example',
  'demo/.env.example',
  'demo/.env.local',
  'demo/src/lib/env.ts',
  'demo/src/lib/env.test.ts',
  'demo/scripts/scan-pii.mjs',
  'STATUS.md',
  'evidence/verification-status.md',
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.agents',
  'dist',
  'build',
  'data',
  'test-results',
]);

const GTM_GA4_REGEX = /\b(GTM-[A-Z0-9]{7,}|G-[A-Z0-9]{8,})\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g;

const ALLOWED_EMAIL_DOMAINS = ['@example.com', '@example.org', '@example.net'];
const ALLOWED_PHONE_PREFIXES = ['555-01', '55501', '+1-555-01'];

let violationsCount = 0;

async function scanFile(filePath) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();

  if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.md'].includes(ext)) {
    return;
  }

  // Skip package-lock.json since it contains third-party author URLs/emails
  if (relPath === 'package-lock.json' || relPath === 'demo/package-lock.json') {
    return;
  }

  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Check GTM / GA4 literal leaks outside allowed files
    if (
      !ALLOWED_ID_FILES.has(relPath) &&
      !relPath.startsWith('docs/') &&
      !relPath.startsWith('gtm/') &&
      !relPath.startsWith('.agents/')
    ) {
      const idMatches = line.match(GTM_GA4_REGEX);
      if (idMatches) {
        for (const match of idMatches) {
          console.error(`[PII_ERROR] Disallowed tracking literal "${match}" at ${relPath}:${lineNum}`);
          violationsCount++;
        }
      }
    }

    // 2. Check email patterns (must use approved fictional domains)
    if (!relPath.startsWith('docs/') && !relPath.startsWith('.agents/')) {
      const emailMatches = line.match(EMAIL_REGEX);
      if (emailMatches) {
        for (const email of emailMatches) {
          const isAllowed = ALLOWED_EMAIL_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain));
          if (!isAllowed) {
            console.error(`[PII_ERROR] Unapproved real-looking email "${email}" at ${relPath}:${lineNum}`);
            violationsCount++;
          }
        }
      }
    }

    // 3. Check phone patterns (must use approved fictional 555-0100 numbers)
    if (!relPath.startsWith('docs/') && !relPath.startsWith('.agents/')) {
      const phoneMatches = line.match(PHONE_REGEX);
      if (phoneMatches) {
        for (const phone of phoneMatches) {
          const isAllowed = ALLOWED_PHONE_PREFIXES.some((prefix) => phone.includes(prefix));
          if (!isAllowed) {
            console.error(`[PII_ERROR] Unapproved real-looking phone "${phone}" at ${relPath}:${lineNum}`);
            violationsCount++;
          }
        }
      }
    }
  });
}

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else {
      await scanFile(fullPath);
    }
  }
}

async function run() {
  console.log('[scan-pii] Scanning repository for PII and disallowed literals...');
  await walkDir(rootDir);

  if (violationsCount > 0) {
    console.error(`\n[scan-pii] FAILED: Found ${violationsCount} security / PII violation(s).`);
    process.exit(1);
  }

  console.log('[scan-pii] PASSED: Zero PII or disallowed tracking ID leaks detected.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[scan-pii] Execution error:', err);
  process.exit(1);
});
