import { randomUUID } from 'node:crypto';
import { rankMatches, matchesFilters, digest, potentialMatches } from './matching-core.mjs';
import { canEnrichRequirements, enrichRequirements } from './job-requirements.mjs';
export function createMatchingWorker({ store, sendEmail, sendSms, request = fetch, ownerId = process.env.PERSONAL_ALERTS_USER_ID || '', sender = process.env.ALERT_EMAIL_FROM || '', smsEnabled = process.env.ALERT_SMS_ENABLED === 'true', origin = process.env.SITE_ORIGIN || 'https://wantaninternship.com', now = () => new Date().toISOString() }) {
  return async (event = {}) => {
    if (!ownerId) return { skipped: 'not-configured' };
    const updateRequest = async (status, message) => {
      if (!event.requestId) return;
      if (store.requestStatus) return store.requestStatus(ownerId, event.requestId, status, message, now());
      if ((await store.get(ownerId, 'request'))?.requestId !== event.requestId) return;
      await store.patch(ownerId, 'request', { status, message, updatedAt: now() });
    };
    const profile = await store.get(ownerId, 'profile');
    if (!profile || (!event.mode && !profile.preferences.matchEnabled && !profile.preferences.watchEnabled)) { await updateRequest('failed', 'Save a resume or company preferences first.'); return { skipped: 'paused' }; }
    const stamp = now(); const clock = Date.parse(stamp); const lock = randomUUID();
    if (!await store.lock(ownerId, lock, clock)) { await updateRequest('failed', 'Another check is running. Please try again shortly.'); return { skipped: 'busy' }; }
    try {
      await updateRequest('running', 'Finding internships that fit your preferences.');
      const p = { ...profile.preferences };
      // Manual previews work while alerts are paused; no notification is sent.
      if (event.mode === 'preview' && !p.matchEnabled && !p.watchEnabled) { p.matchEnabled = p.resumeText.length >= 50; p.watchEnabled = true; }
      const state = await store.get(ownerId, 'state') || {};
      const tracks = p.track === 'both' ? ['software', 'engineering'] : [p.track];
      let jobs = (await Promise.all(tracks.map(track => store.jobs(track)))).flat();
      const cached = new Map((await store.items(ownerId, 'requirements#')).filter(row => row.expiresAt > clock / 1000).map(row => [row.id.slice(13), row]));
      jobs = jobs.map(job => cached.get(job.id)?.description ? { ...job, ...cached.get(job.id).details, description: cached.get(job.id).description } : job);
      const eligible = jobs.filter(job => matchesFilters(job, { ...p, keywords: [], excludeKeywords: [] }));
      const pending = eligible.filter(job => (job.description || '').length < 100 && !cached.has(job.id) && canEnrichRequirements(job));
      let enriched = 0;
      if (p.matchEnabled) {
        const missing = pending.slice(0, 40);
        await updateRequest('running', `Checking requirements for ${missing.length} available postings.`);
        const apiCache = new Map(); const enrichedJobs = new Map();
        for (let offset = 0; offset < missing.length; offset += 5) {
          await Promise.all(missing.slice(offset, offset + 5).map(async job => {
            const full = await enrichRequirements(job, request, apiCache);
            enrichedJobs.set(job.id, full);
            await store.put(ownerId, `requirements#${job.id}`, { description: full.description || '', details: { workplaceType: full.workplaceType, isRemote: full.isRemote }, expiresAt: Math.floor(clock / 1000) + (full.description ? 7 : 1) * 86400 });
          }));
        }
        enriched = missing.length;
        jobs = jobs.map(job => enrichedJobs.get(job.id) || job);
      }
      const matches = rankMatches(jobs, p);
      const current = await store.get(ownerId, 'profile');
      if (current?.version !== profile.version) { await updateRequest('failed', 'Your preferences changed during this check. Run it again to use the new settings.'); return { skipped: 'preferences-changed' }; }
      const result = { checkedAt: stamp, requestId: event.requestId || null, matches: matches.slice(0, 40), potentialMatches: potentialMatches(jobs, p), matchCount: matches.length, checkedJobs: jobs.length, filteredJobs: jobs.filter(job => matchesFilters(job, p)).length, withRequirements: jobs.filter(job => (job.description || '').length >= 100).length, enriched, remainingChecks: p.matchEnabled ? Math.max(0, pending.length - enriched) : 0, unavailableRequirements: eligible.filter(job => (job.description || '').length < 100 && !canEnrichRequirements(job)).length };
      await store.put(ownerId, 'results', { value: result });
      if (event.mode === 'preview') { await updateRequest('complete', `${matches.length} matches found.`); return { checked: jobs.length, matches: matches.length }; }
      const destination = profile.destination || { channel: 'email', address: profile.email, verified: profile.emailVerified };
      const isSms = destination.channel === 'sms';
      if (!destination.verified || !destination.address || (isSms ? !smsEnabled || !sendSms : !sender || !sendEmail)) { await updateRequest('failed', 'Verify and connect your selected delivery method first.'); return { skipped: 'email-not-configured', matches: matches.length }; }
      if (state.pendingEmail) { await updateRequest('failed', 'A previous delivery needs review before sending another.'); return { skipped: 'delivery-needs-review', matches: matches.length }; }
      if (event.mode !== 'test' && !p.emailEnabled) return { skipped: 'email-paused' };
      const interval = 86400000 / (p.timesPerDay || (p.frequency === 'hourly' ? 24 : 1));
      if (event.mode !== 'test' && clock - Date.parse(state.lastSentAt || '1970-01-01') < interval) return { skipped: 'not-due' };
      const delivered = new Set((state.delivered || []).filter(row => row.expiresAt > clock).map(row => row.id));
      const fresh = matches.filter(job => !delivered.has(job.id) && Date.parse(job.firstSeenAt || job.postedAt || '') >= Date.parse(profile.alertStartAt));
      const selected = (event.mode === 'test' ? matches : fresh).slice(0, 20);
      if (!selected.length && event.mode !== 'test') return { skipped: 'no-new-matches' };
      const message = selected.length ? digest(selected, origin) : { subject: 'Your WantAnInternship alerts are connected', text: `Your test alert worked. New matching internships will appear here when found.\n\nManage alerts: ${new URL(origin).origin}/settings/delivery` };
      await store.patch(ownerId, 'state', { pendingEmail: { attemptedAt: stamp, ids: selected.map(j => j.id), channel: destination.channel }, lastError: null });
      try {
        if (isSms) await sendSms({ to: destination.address, text: event.mode === 'test' ? `WantAnInternship: your test text worked. Manage or pause alerts: ${new URL(origin).origin}/settings/delivery` : `WantAnInternship: ${selected.length} new internship matches. Review: ${new URL(origin).origin}/settings/companies. Pause in settings.` });
        else await sendEmail({ from: sender, to: destination.address, ...message, subject: event.mode === 'test' ? `[Test] ${message.subject}` : message.subject });
      } catch {
        await store.patch(ownerId, 'state', { lastError: 'Delivery could not be confirmed. Check your inbox or phone and delivery setup before clearing the hold.' });
        await updateRequest('failed', 'Delivery could not be confirmed. Check your selected inbox or phone.');
        return { failed: isSms ? 'sms' : 'email' };
      }
      const rows = (state.delivered || []).filter(row => row.expiresAt > clock);
      if (event.mode !== 'test') for (const job of selected) rows.push({ id: job.id, expiresAt: clock + 30 * 86400000 });
      await store.patch(ownerId, 'state', { pendingEmail: null, lastError: null, lastTestAt: event.mode === 'test' ? stamp : state.lastTestAt || null, lastSentAt: event.mode === 'test' ? state.lastSentAt || null : stamp, delivered: rows.slice(-2000) });
      await updateRequest('complete', event.mode === 'test' ? 'Test alert sent to your selected destination.' : 'Alerts sent.');
      return { sent: selected.length, test: event.mode === 'test' };
    } catch (error) { await updateRequest('failed', 'The check could not finish. Try again shortly.'); throw error; }
    finally { await store.unlock(ownerId, lock); }
  };
}
