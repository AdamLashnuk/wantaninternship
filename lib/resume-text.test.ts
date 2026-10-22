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
test('extracts a real text PDF with an explicit same-version worker', async () => {
  const content = 'Computer science student. Python SQL React. Built software applications and machine learning projects.';
  const stream = `BT /F1 10 Tf 30 750 Td (${content}) Tj ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets: number[] = [];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xref}\n%%EOF`;
  const text = await extractResume('resume.pdf', new Uint8Array(Buffer.from(pdf)));
  assert.match(text, /Python SQL React/); assert.match(text, /machine learning/); assert.doesNotMatch(text, /1 of 1/);
});
