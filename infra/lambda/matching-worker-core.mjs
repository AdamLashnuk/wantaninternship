import { randomUUID } from 'node:crypto';
import { rankMatches, matchesFilters, digest } from './matching-core.mjs';
import { enrichRequirements } from './job-requirements.mjs';
export function createMatchingWorker({ store, sendEmail, request = fetch, ownerId = process.env.PERSONAL_ALERTS_USER_ID || '', sender = process.env.ALERT_EMAIL_FROM || '', origin = process.env.SITE_ORIGIN || 'https://wantaninternship.com', now = () => new Date().toISOString() }) {
  return async (event = {}) => {
    if (!ownerId) return { skipped: 'not-configured' };
    const profile = await store.get(ownerId, 'profile');
    if (!profile || (!profile.preferences.matchEnabled && !profile.preferences.watchEnabled)) return { skipped: 'paused' };
    const stamp = now(); const clock = Date.parse(stamp); const lock = randomUUID();
    if (!await store.lock(ownerId, lock, clock)) return { skipped: 'busy' };
    try {
      const p = profile.preferences;
      const state = await store.get(ownerId, 'state') || {};
      const tracks = p.track === 'both' ? ['software', 'engineering'] : [p.track];
      let jobs = (await Promise.all(tracks.map(track => store.jobs(track)))).flat();
      const cached = new Map((await store.items(ownerId, 'requirements#')).filter(row => row.expiresAt > clock / 1000).map(row => [row.id.slice(13), row]));
      jobs = jobs.map(job => cached.get(job.id)?.description ? { ...job, ...cached.get(job.id).details, description: cached.get(job.id).description } : job);
      const eligible = jobs.filter(job => matchesFilters(job, { ...p, keywords: [], excludeKeywords: [] }));
      let enriched = 0;
      if (p.matchEnabled) {
        const missing = eligible.filter(job => !job.description && !cached.has(job.id)).slice(0, 20);
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
      // A save/pause/delete made while this run was working invalidates its output.
      const current = await store.get(ownerId, 'profile');
      if (current?.version !== profile.version) return { skipped: 'preferences-changed' };
      const result = { checkedAt: stamp, matches: matches.slice(0, 40), matchCount: matches.length, checkedJobs: jobs.length, withRequirements: jobs.filter(job => (job.description || '').length >= 100).length, enriched, remainingChecks: Math.max(0, eligible.filter(job => !job.description && !cached.has(job.id)).length - enriched) };
      await store.put(ownerId, 'results', { value: result });
      if (event.mode === 'preview') return { checked: jobs.length, matches: matches.length };
      if (!sender || !profile.emailVerified || !profile.email) return { skipped: 'email-not-configured', matches: matches.length };
      if (state.pendingEmail) return { skipped: 'delivery-needs-review', matches: matches.length };
      if (event.mode !== 'test' && !p.emailEnabled) return { skipped: 'email-paused' };
      const interval = p.frequency === 'hourly' ? 3600000 : 86400000;
      if (event.mode !== 'test' && clock - Date.parse(state.lastSentAt || '1970-01-01') < interval) return { skipped: 'not-due' };
      const delivered = new Set((state.delivered || []).filter(row => row.expiresAt > clock).map(row => row.id));
      const fresh = matches.filter(job => !delivered.has(job.id) && Date.parse(job.firstSeenAt || job.postedAt || '') >= Date.parse(profile.alertStartAt));
      const selected = (event.mode === 'test' ? matches : fresh).slice(0, 20);
      if (!selected.length && event.mode !== 'test') return { skipped: 'no-new-matches' };
      const message = selected.length ? digest(selected, origin) : { subject: 'Your WantAnInternship alerts are connected', text: `Your test email worked. New matching internships will appear here when they are found.\n\nManage alerts: ${new URL(origin).origin}/settings` };
      // Claim delivery before the network call. An interrupted/ambiguous send is
      // never retried automatically, so hourly runs cannot flood the inbox.
      await store.patch(ownerId, 'state', { pendingEmail: { attemptedAt: stamp, ids: selected.map(j => j.id) }, lastError: null });
      try {
        await sendEmail({ from: sender, to: profile.email, ...message, subject: event.mode === 'test' ? `[Test] ${message.subject}` : message.subject });
      } catch {
        await store.patch(ownerId, 'state', { lastError: 'Email delivery could not be confirmed. Check your inbox and email sender configuration before clearing the delivery hold.' });
        return { failed: 'email' };
      }
      const rows = (state.delivered || []).filter(row => row.expiresAt > clock);
      if (event.mode !== 'test') for (const job of selected) rows.push({ id: job.id, expiresAt: clock + 30 * 86400000 });
      await store.patch(ownerId, 'state', { pendingEmail: null, lastError: null, lastSentAt: event.mode === 'test' ? state.lastSentAt || null : stamp, delivered: rows.slice(-2000) });
      return { sent: selected.length, test: event.mode === 'test' };
    } finally { await store.unlock(ownerId, lock); }
  };
}
