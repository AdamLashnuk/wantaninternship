import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanResumeText, resumeSkills } from './resume-profile.ts';
test('resume skill summary recognizes punctuation and distinct language names', () => {
  const skills = resumeSkills('JavaScript, C++, Next.js, Python, PyTorch, SQL. A portfolio of React applications.');
  assert.ok(skills.includes('C++')); assert.ok(skills.includes('Next.js')); assert.ok(skills.includes('JavaScript')); assert.ok(!skills.includes('Java'));
});
test('unreadable and oversized extracted text has an actionable error', () => {
  assert.throws(() => cleanResumeText('   '), /Scanned PDFs need OCR/);
  assert.throws(() => cleanResumeText('a'.repeat(30001)), /30,000/);
});
