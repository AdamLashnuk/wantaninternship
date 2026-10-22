import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPreferences, validatePreferences, rankMatches, extractSkills, matchesFilters, digest } from './matching-core.mjs';
import { createSettingsHandler } from './settings-handler.mjs';
import { createMatchingWorker } from './matching-worker-core.mjs';
import { enrichRequirements } from './job-requirements.mjs';
const now = '2026-10-22T12:00:00.000Z';
const description = 'You will build software applications using Python, TypeScript, React, and SQL. We are looking for students with projects in web development and interest in learning. Familiarity with AWS is a plus.';
const prefs = (overrides = {}) => ({ ...structuredClone(defaultPreferences), roles: [], resumeText: 'Computer science student. Built software applications with Python, TypeScript, React and SQL. Projects include backend development and machine learning.', matchEnabled: true, emailEnabled: true, ...overrides });
const job = (overrides = {}) => ({ id: 'job1', title: 'Software Engineer Intern', company: 'Google', location: 'Remote', locations: ['Remote'], track: 'software', active: true, opportunityType: 'internship', applicationUrl: 'https://careers.example.com/1', description, firstSeenAt: '2026-10-22T11:00:00.000Z', ...overrides });
function memoryStore(profile) {
  const rows = new Map(); if (profile) rows.set('owner:profile', structuredClone(profile));
  let locked = false; let claimed = false;
  return {
    rows,
    async get(user, id) { return structuredClone(rows.get(`${user}:${id}`)); },
    async put(user, id, row) { rows.set(`${user}:${id}`, structuredClone({ ...row, userId: user, id })); },
    async patch(user, id, row) { rows.set(`${user}:${id}`, { ...rows.get(`${user}:${id}`), ...structuredClone(row), userId: user, id }); },
    async items(user, prefix = '') { return [...rows.entries()].filter(([key]) => key.startsWith(`${user}:${prefix}`)).map(([,value]) => value); },
    async removeAll(user) { for (const key of rows.keys()) if (key.startsWith(`${user}:`)) rows.delete(key); },
    async jobs() { return [job()]; },
    async lock() { if (locked) return false; locked = true; return true; },
    async unlock() { locked = false; },
    async claimRequest() { if (claimed) return false; claimed = true; return true; },
  };
}
const profile = (p = prefs()) => ({ preferences: p, email: 'owner@example.com', emailVerified: true, version: 'version1', alertStartAt: '2026-10-22T10:00:00.000Z' });
const event = (method, body) => ({ requestContext: { http: { method } }, body: JSON.stringify(body || {}) });
const owner = async () => ({ id: 'owner', email: 'owner@example.com', emailVerified: true });

test('preferences reject arbitrary fields, invalid inputs, and unconfigured modes', () => {
  assert.throws(() => validatePreferences(prefs({ resumeText: '', matchEnabled: true })), /resume/);
  assert.throws(() => validatePreferences(prefs({ minimumScore: 101 })), /threshold/);
  assert.throws(() => validatePreferences(prefs({ watchEnabled: true, watchlistMode: 'custom' })), /company/);
  assert.throws(() => validatePreferences(prefs({ roles: ['x'.repeat(101)] })), /short/);
  const result = validatePreferences({ ...prefs(), email: 'attacker@example.com', userId: 'attacker' });
  assert.equal(result.email, undefined); assert.equal(result.userId, undefined);
});
test('skill matching uses word boundaries and does not confuse Java with JavaScript', () => {
  assert.deepEqual(extractSkills('JavaScript and SQL'), ['JavaScript', 'SQL']);
  const matches = rankMatches([job()], prefs());
  assert.equal(matches.length, 1); assert.ok(matches[0].matchedSkills.includes('Python')); assert.ok(matches[0].missingSkills.includes('AWS'));
  assert.ok(matches[0].score < 100);
});
test('hard filters apply to both modes and unknown remote status fails remote-only', () => {
  assert.equal(matchesFilters(job({ location: 'Pittsburgh', locations: ['Pittsburgh'] }), prefs({ remoteOnly: true })), false);
  assert.equal(matchesFilters(job(), prefs({ locations: ['Pittsburgh'] })), false);
  assert.equal(matchesFilters(job(), prefs({ keywords: ['Rust'] })), false);
  assert.equal(matchesFilters(job(), prefs({ excludeKeywords: ['AWS'] })), false);
  assert.equal(matchesFilters(job({ track: 'engineering' }), prefs()), false);
  assert.equal(matchesFilters(job({ opportunityType: 'new-grad' }), prefs()), false);
});
test('sparse titles cannot trigger resume alerts but watched companies can', () => {
  assert.equal(rankMatches([job({ description: '' })], prefs()).length, 0);
  const matches = rankMatches([job({ description: '' })], prefs({ matchEnabled: false, watchEnabled: true }));
  assert.equal(matches.length, 1); assert.equal(matches[0].hasRequirements, false); assert.deepEqual(matches[0].reasons, ['Company watchlist']);
});
test('company names match boundaries and a custom list replaces recommendations', () => {
  const p = prefs({ matchEnabled: false, watchEnabled: true, watchlistMode: 'custom', companies: ['Meta'] });
  assert.equal(rankMatches([job({ company: 'Meta Platforms' })], p).length, 1);
  assert.equal(rankMatches([job({ company: 'Metal Products' })], p).length, 0);
  assert.equal(rankMatches([job({ company: 'Google' })], p).length, 0);
});
test('duplicate URLs and unsafe links do not produce extra results', () => {
  assert.equal(rankMatches([job(), job({ id: 'job2' })], prefs()).length, 1);
  assert.equal(rankMatches([job({ applicationUrl: 'javascript:alert(1)' })], prefs()).length, 0);
});
test('personal settings are restricted to the configured owner and authenticate first', async () => {
  const store = memoryStore(profile()); const accesses = [];
  store.get = async (...args) => { accesses.push(args); return null; };
  const handler = createSettingsHandler({ store, ownerId: 'owner', account: async () => ({ id: 'other' }), enqueue: async () => {} });
  const read = await handler(event('GET')); assert.equal(JSON.parse(read.body).allowed, false); assert.equal(accesses.length, 0);
  assert.equal((await handler(event('PUT', prefs()))).statusCode, 403);
  const blocked = createSettingsHandler({ store, ownerId: '', account: owner });
  assert.equal(JSON.parse((await blocked(event('GET'))).body).setupRequired, true);
});
test('saving settings pins the recipient to the verified account and preserves alert start', async () => {
  const store = memoryStore(profile());
  const handler = createSettingsHandler({ store, ownerId: 'owner', sender: 'alerts@example.com', account: owner, now: () => now });
  assert.equal((await handler(event('PUT', { ...prefs(), email: 'wrong@example.com' }))).statusCode, 200);
  const result = await store.get('owner', 'profile'); assert.equal(result.email, 'owner@example.com'); assert.equal(result.alertStartAt, profile().alertStartAt);
  const unverified = createSettingsHandler({ store, ownerId: 'owner', sender: 'alerts@example.com', account: async () => ({ id: 'owner', emailVerified: false }) });
  assert.equal((await unverified(event('PUT', prefs()))).statusCode, 400);
});
test('manual checks are rate limited and deleting settings stops future runs', async () => {
  const store = memoryStore(profile()); let queued = 0;
  const handler = createSettingsHandler({ store, ownerId: 'owner', account: owner, enqueue: async () => queued++ });
  assert.equal((await handler(event('POST', { action: 'preview' }))).statusCode, 202);
  assert.equal((await handler(event('POST', { action: 'preview' }))).statusCode, 429); assert.equal(queued, 1);
  assert.equal((await handler(event('DELETE'))).statusCode, 200);
  const worker = createMatchingWorker({ store, ownerId: 'owner' }); assert.equal((await worker()).skipped, 'paused');
});
test('worker sends only new matches once and respects daily cadence', async () => {
  const store = memoryStore(profile()); const sent = [];
  const worker = createMatchingWorker({ store, ownerId: 'owner', sender: 'alerts@example.com', now: () => now, sendEmail: async value => sent.push(value) });
  assert.equal((await worker()).sent, 1); assert.equal(sent[0].to, 'owner@example.com');
  assert.equal((await worker()).skipped, 'not-due'); assert.equal(sent.length, 1);
  await store.patch('owner', 'state', { lastSentAt: '2026-10-20T12:00:00.000Z' });
  assert.equal((await worker()).skipped, 'no-new-matches'); assert.equal(sent.length, 1);
});
test('preview and paused email never send; old imports are not emailed', async () => {
  const store = memoryStore(profile()); let sends = 0;
  const worker = createMatchingWorker({ store, ownerId: 'owner', sender: 'alerts@example.com', now: () => now, sendEmail: async () => sends++ });
  await worker({ mode: 'preview' }); assert.equal(sends, 0);
  store.jobs = async () => [job({ firstSeenAt: '2026-09-01T00:00:00Z' })];
  assert.equal((await worker()).skipped, 'no-new-matches');
  await store.put('owner', 'profile', profile(prefs({ emailEnabled: false })));
  assert.equal((await worker()).skipped, 'email-paused'); assert.equal(sends, 0);
});
test('ambiguous delivery failures hold automatic retries instead of repeating emails', async () => {
  const store = memoryStore(profile()); let sends = 0;
  const worker = createMatchingWorker({ store, ownerId: 'owner', sender: 'alerts@example.com', now: () => now, sendEmail: async () => { sends++; throw Error('timeout'); } });
  assert.equal((await worker()).failed, 'email'); assert.equal((await worker()).skipped, 'delivery-needs-review'); assert.equal(sends, 1);
  assert.ok((await store.get('owner', 'state')).pendingEmail);
});
test('changing preferences during a check prevents stale results or emails', async () => {
  const store = memoryStore(profile()); let sends = 0;
  store.jobs = async () => { await store.put('owner', 'profile', { ...profile(), version: 'new' }); return [job()]; };
  const worker = createMatchingWorker({ store, ownerId: 'owner', sender: 'alerts@example.com', now: () => now, sendEmail: async () => sends++ });
  assert.equal((await worker()).skipped, 'preferences-changed'); assert.equal(sends, 0);
});
test('resume enrichment cannot request arbitrary or private URLs', async () => {
  let requested = 0;
  for (const url of ['http://169.254.169.254/latest/meta-data', 'https://example.com/job', 'https://jobs.lever.co.evil.example/org/id', 'https://jobs.lever.co:8443/org/id']) {
    await enrichRequirements(job({ description: '', applicationUrl: url }), async () => { requested++; });
  }
  assert.equal(requested, 0);
});
test('documented ATS endpoints add requirements and do not follow redirects', async () => {
  const full = await enrichRequirements(job({ description: '', applicationUrl: 'https://job-boards.greenhouse.io/example/jobs/123' }), async (url, options) => {
    assert.equal(url, 'https://boards-api.greenhouse.io/v1/boards/example/jobs/123'); assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify({ content: `<p>${description}</p>` }));
  });
  assert.equal(full.description, description);
});
test('digests identify keyword scores and include a pause link', () => {
  const email = digest(rankMatches([job()], prefs()), 'https://wantaninternship.com');
  assert.ok(email.text.includes('not hiring odds')); assert.ok(email.text.includes('https://wantaninternship.com/settings'));
});

test('common role aliases include SWE, AI/ML and data scientist titles', () => {
  assert.equal(matchesFilters(job(), prefs({ roles: ['SWE'] })), true);
  assert.equal(matchesFilters(job({ title: 'AI Engineer Intern' }), prefs({ roles: ['AI/ML'] })), true);
  assert.equal(matchesFilters(job({ title: 'Data Scientist Intern' }), prefs({ roles: ['Data Science'] })), true);
});
