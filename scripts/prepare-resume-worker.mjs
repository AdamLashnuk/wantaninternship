import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const entry = require.resolve('pdf-parse');
await mkdir('public', { recursive: true });
// Serve a same-origin worker pinned to the installed parser, never a third-party CDN.
await copyFile(join(dirname(entry), 'pdf.worker.mjs'), 'public/resume-pdf-worker.mjs');
