import assert from 'node:assert/strict';
import test from 'node:test';
import { zipSync, strToU8 } from 'fflate';
import { extractResume } from './resume-text.ts';
const resume = 'Computer science student with Python, SQL and React experience. Built several web applications and machine learning projects.';
test('extracts only DOCX document text and decodes entities', async () => {
  const file = zipSync({ 'word/document.xml': strToU8(`<w:document><w:p><w:r><w:t>${resume} &amp; more.</w:t></w:r></w:p></w:document>`), 'word/relationships.xml': strToU8('https://do-not-fetch.example/') });
  assert.equal(await extractResume('resume.docx', file), `${resume} & more.`);
});
test('resume import rejects unsupported types, oversized uploads and unreadable text', async () => {
  await assert.rejects(extractResume('resume.exe', strToU8(resume)), /Upload/);
  await assert.rejects(extractResume('resume.txt', new Uint8Array(2 * 1024 * 1024 + 1)), /smaller/);
  await assert.rejects(extractResume('resume.txt', strToU8('tiny')), /readable/);
  await assert.rejects(extractResume('resume.pdf', strToU8(resume)), /valid PDF/);
  assert.equal(await extractResume('resume.txt', strToU8(resume)), resume);
});
