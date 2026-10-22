import { randomUUID } from 'node:crypto';
import { verifiedAccount } from './account-access.mjs';
import { defaultPreferences, recommendedCompanies, validatePreferences, SettingsError } from './matching-core.mjs';
export function createSettingsHandler({ store, account = verifiedAccount, enqueue, ownerId = process.env.PERSONAL_ALERTS_USER_ID || '', sender = process.env.ALERT_EMAIL_FROM || '', now = () => new Date().toISOString() }) {
  const reply = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  return async event => {
    try {
      const user = await account(event);
      const method = event.requestContext?.http?.method;
      if (!ownerId || user.id !== ownerId) return reply(method === 'GET' ? 200 : 403, { allowed: false, setupRequired: !ownerId, error: ownerId ? 'Personal alerts are not enabled for this account.' : 'Personal alerts need to be connected to your account.' });
      if (method === 'GET') {
        const [profile, results, state] = await Promise.all([store.get(user.id, 'profile'), store.get(user.id, 'results'), store.get(user.id, 'state')]);
        return reply(200, { allowed: true, preferences: profile?.preferences || defaultPreferences, recommendedCompanies, emailReady: Boolean(sender), recipient: user.email, results: results?.value || null, delivery: { lastSentAt: state?.lastSentAt || null, lastError: state?.lastError || null, uncertain: Boolean(state?.pendingEmail), lastCheckedAt: results?.value?.checkedAt || null } });
      }
      if (method === 'DELETE') { await store.removeAll(user.id); return reply(200, { deleted: true }); }
      const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString() : event.body || '{}';
      if (Buffer.byteLength(raw) > 150000) throw new SettingsError('Settings are too large.', 413);
      let body; try { body = JSON.parse(raw); } catch { throw new SettingsError('Invalid settings.'); }
      if (method === 'PUT') {
        const preferences = validatePreferences(body);
        if (preferences.emailEnabled && !sender) throw new SettingsError('Connect an email sender before enabling email alerts.');
        if (preferences.emailEnabled && !user.emailVerified) throw new SettingsError('Verify your account email before enabling alerts.');
        const prior = await store.get(user.id, 'profile');
        const stamp = now();
        await store.put(user.id, 'profile', { preferences, email: user.email, emailVerified: user.emailVerified === true, version: randomUUID(), alertStartAt: prior?.alertStartAt || stamp, updatedAt: stamp });
        return reply(200, { saved: true, updatedAt: stamp });
      }
      if (method === 'POST') {
        if (!['preview', 'test', 'reset-delivery'].includes(body.action)) throw new SettingsError('Choose a valid action.');
        const profile = await store.get(user.id, 'profile');
        if (!profile) throw new SettingsError('Save your preferences first.');
        if (body.action !== 'reset-delivery' && !profile.preferences.matchEnabled && !profile.preferences.watchEnabled) throw new SettingsError('Enable resume matching or company alerts first.');
        if (body.action === 'test' && (!sender || !user.emailVerified)) throw new SettingsError('Connect an email sender and verify your account email first.');
        if (body.action === 'reset-delivery') {
          await store.patch(user.id, 'state', { pendingEmail: null, lastError: null });
          return reply(200, { reset: true });
        }
        // One manual refresh/test per minute. A scheduled run has its own worker lock.
        if (!await store.claimRequest(user.id, Date.now())) throw new SettingsError('Please wait a minute before running another check.', 429);
        await enqueue({ mode: body.action });
        return reply(202, { queued: true });
      }
      return reply(405, { error: 'Unsupported request.' });
    } catch (error) { const status = error.status || 503; return reply(status, { error: error.status ? error.message : 'Unable to update your settings. Please try again.' }); }
  };
}
