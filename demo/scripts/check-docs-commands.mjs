#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function loadAvailableScripts() {
  const scripts = new Set([
    'install',
    'test',
    'start',
    'build',
  ]);

  const packagePaths = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'demo', 'package.json'),
  ];

  for (const pkgPath of packagePaths) {
    try {
      const data = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      if (data.scripts) {
        Object.keys(data.scripts).forEach((s) => scripts.add(s));
      }
    } catch {
      // Ignored if package.json not yet created
    }
  }

  return scripts;
}

async function getMarkdownFiles(dir) {
  const files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await getMarkdownFiles(fullPath)));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist yet
  }
  return files;
}

async function run() {
  console.log('[check-docs-commands] Validating documentation shell commands against package.json scripts...');
  const availableScripts = await loadAvailableScripts();

  const mdFiles = [
    path.join(rootDir, 'README.md'),
    ...(await getMarkdownFiles(path.join(rootDir, 'docs'))),
  ];

  let errorsCount = 0;
  let commandsCount = 0;

  for (const file of mdFiles) {
    let content;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch {
      continue;
    }

    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const lines = content.split('\n');

    let insideCodeBlock = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        insideCodeBlock = !insideCodeBlock;
        return;
      }

      if (insideCodeBlock) {
        // Extract npm run <script>
        const npmRunMatch = line.match(/\bnpm\s+run\s+([a-zA-Z0-9:_-]+)/);
        if (npmRunMatch && npmRunMatch[1]) {
          commandsCount++;
          const scriptName = npmRunMatch[1];
          if (!availableScripts.has(scriptName)) {
            console.error(`[DOCS_ERROR] ${relPath}:${idx + 1} references undefined script: "npm run ${scriptName}"`);
            errorsCount++;
          }
        }
      }
    });
  }

  console.log(`[check-docs-commands] Verified ${commandsCount} documentation command(s).`);

  if (errorsCount > 0) {
    console.error(`[check-docs-commands] FAILED: ${errorsCount} invalid command reference(s) found.`);
    process.exit(1);
  }

  console.log('[check-docs-commands] PASSED: All documentation commands match valid package.json scripts.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[check-docs-commands] Execution error:', err);
  process.exit(1);
});
