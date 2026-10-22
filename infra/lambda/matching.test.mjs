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
    async claimVerification() { return true; },
    async verificationAttempt(user, channel, hash, clock) { const row = rows.get(`${user}:verification#${channel}`); if (!row || row.hash !== hash || row.consumed || row.attempts >= 5 || row.expiresAt <= clock / 1000) return false; row.attempts++; return true; },
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

test('delivery accepts only one channel, a valid cadence, and verified targets', async () => {
  assert.throws(() => validatePreferences(prefs({ deliveryChannel: 'both' })), /email or text/);
  assert.throws(() => validatePreferences(prefs({ timesPerDay: 1000 })), /per day/);
  assert.throws(() => validatePreferences(prefs({ deliveryPhone: '4125551234' })), /country code/);
  const store = memoryStore(profile());
  const handler = createSettingsHandler({ store, account: owner, ownerId:'owner', sender:'alerts@example.com', smsEnabled:true });
  assert.equal((await handler(event('PUT',prefs({ deliveryChannel:'sms', deliveryPhone:'+14125551234' })))).statusCode,400);
  assert.equal((await handler(event('PUT',prefs({ deliveryEmail:'other@example.com' })))).statusCode,400);
});
test('verification sends no code back, limits guesses, binds the destination, and cannot be replayed', async () => {
  const store = memoryStore(profile()); const sent = [];
  const handler = createSettingsHandler({ store, account:owner, ownerId:'owner', sender:'alerts@example.com', smsEnabled:true, now:()=>now, makeCode:()=> '123456', sendVerification: async v => sent.push(v) });
  const start = await handler(event('POST',{action:'request-verification',channel:'sms',address:'+14125551234',smsConsent:true}));
  assert.equal(start.statusCode,200); assert.equal(JSON.parse(start.body).code,undefined); assert.equal(sent[0].code,'123456');
  assert.equal((await handler(event('POST',{action:'verify-delivery',channel:'sms',address:'+14125559999',code:'123456'}))).statusCode,400);
  assert.equal((await handler(event('POST',{action:'verify-delivery',channel:'sms',address:'+14125551234',code:'999999'}))).statusCode,400);
  assert.equal((await handler(event('POST',{action:'verify-delivery',channel:'sms',address:'+14125551234',code:'123456'}))).statusCode,200);
  assert.equal((await handler(event('POST',{action:'verify-delivery',channel:'sms',address:'+14125551234',code:'123456'}))).statusCode,400);
  const saved = await handler(event('PUT',prefs({deliveryChannel:'sms',deliveryPhone:'+14125551234'})));
  assert.equal(saved.statusCode,200);assert.equal((await store.get('owner','profile')).destination.channel,'sms');
});
test('too many code attempts invalidate a verification challenge', async () => {
  const store = memoryStore(profile());
  const handler = createSettingsHandler({store,account:owner,ownerId:'owner',sender:'alerts@example.com',now:()=>now,makeCode:()=> '123456',sendVerification:async()=>{}});
  await handler(event('POST',{action:'request-verification',channel:'email',address:'other@example.com'}));
  for(let i=0;i<5;i++) assert.equal((await handler(event('POST',{action:'verify-delivery',channel:'email',address:'other@example.com',code:'000000'}))).statusCode,400);
  const result=await handler(event('POST',{action:'verify-delivery',channel:'email',address:'other@example.com',code:'123456'}));assert.equal(result.statusCode,400);assert.match(result.body,/expired/);
});
test('SMS delivery sends a single short summary and never also emails', async () => {
  const row = profile(prefs({deliveryChannel:'sms',deliveryPhone:'+14125551234',timesPerDay:3}));row.destination={channel:'sms',address:'+14125551234',verified:true};
  const store=memoryStore(row);const texts=[];let emails=0;
  const worker=createMatchingWorker({store,ownerId:'owner',smsEnabled:true,now:()=>now,sendSms:async v=>texts.push(v),sendEmail:async()=>emails++});
  assert.equal((await worker()).sent,1);assert.equal(emails,0);assert.equal(texts[0].to,'+14125551234');assert.ok(texts[0].text.length<=160);
  await store.patch('owner','state',{lastSentAt:'2026-10-22T05:00:00Z'});assert.equal((await worker()).skipped,'not-due');
});
test('email mode never texts, including test delivery while matching is paused',async()=>{
  const row=profile(prefs({matchEnabled:false,watchEnabled:false}));const store=memoryStore(row);let emails=0;let texts=0;
  const worker=createMatchingWorker({store,ownerId:'owner',sender:'alerts@example.com',now:()=>now,sendEmail:async()=>emails++,sendSms:async()=>texts++});
  await worker({mode:'test'});assert.equal(emails,1);assert.equal(texts,0);
});
test('manual preview works while alerts are paused and reports its own completion',async()=>{
  const store=memoryStore(profile(prefs({matchEnabled:false,watchEnabled:false})));
  let queued;const handler=createSettingsHandler({store,ownerId:'owner',account:owner,now:()=>now,enqueue:async e=>queued=e});
  const response=await handler(event('POST',{action:'preview'}));assert.equal(response.statusCode,202);assert.ok(queued.requestId);
  const worker=createMatchingWorker({store,ownerId:'owner',now:()=>now});await worker(queued);
  assert.equal((await store.get('owner','request')).status,'complete');assert.equal((await store.get('owner','results')).value.requestId,queued.requestId);
});
test('unsupported descriptions become review candidates rather than endless pending checks',async()=>{
  const store=memoryStore(profile(prefs()));store.jobs=async()=>[job({description:'',applicationUrl:'https://example.com/jobs/1'})];
  const worker=createMatchingWorker({store,ownerId:'owner',now:()=>now});await worker({mode:'preview'});
  const result=(await store.get('owner','results')).value;assert.equal(result.remainingChecks,0);assert.equal(result.unavailableRequirements,1);assert.equal(result.matches.length,0);assert.equal(result.potentialMatches.length,1);assert.equal(result.potentialMatches[0].provisional,true);
});
test('Workday descriptions use only the employer public ATS host',async()=>{
  const result=await enrichRequirements(job({description:'',applicationUrl:'https://carrier.wd5.myworkdayjobs.com/en-US/jobs/job/USA/Engineering-Intern_123'}),async(url,config)=>{assert.equal(url,'https://carrier.wd5.myworkdayjobs.com/wday/cxs/carrier/jobs/job/USA/Engineering-Intern_123');assert.equal(config.redirect,'error');return new Response(JSON.stringify({jobPostingInfo:{jobDescription:description}}));});assert.equal(result.description,description);
  let calls=0;await enrichRequirements(job({description:'',applicationUrl:'https://carrier.wd5.myworkdayjobs.com.evil.test/en-US/jobs/job/a/b'}),async()=>{calls++});assert.equal(calls,0);
});

test('common dropdown role and country labels match their listing aliases',()=>{
  assert.equal(matchesFilters(job({title:'Software Development Engineer Intern'}),prefs({roles:['Software Engineer']})),true);
  assert.equal(matchesFilters(job({title:'SDE Intern'}),prefs({roles:['Software Engineer']})),true);
  assert.equal(matchesFilters(job({locations:['New York, United States']}),prefs({locations:['USA']})),true);
  assert.equal(matchesFilters(job({locations:['London, UK']}),prefs({locations:['United Kingdom']})),true);
  assert.equal(matchesFilters(job({locations:['London, UK']}),prefs({locations:['USA']})),false);
});
