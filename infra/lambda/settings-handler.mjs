import { destinationFor, verifyDelivery } from './delivery-verification.mjs';
import { randomUUID } from 'node:crypto';
import { verifiedAccount } from './account-access.mjs';
import { defaultPreferences, recommendedCompanies, validatePreferences, SettingsError } from './matching-core.mjs';
export function createSettingsHandler({ store, account = verifiedAccount, enqueue, sendVerification, makeCode, smsEnabled = process.env.ALERT_SMS_ENABLED === 'true', ownerId = process.env.PERSONAL_ALERTS_USER_ID || '', sender = process.env.ALERT_EMAIL_FROM || '', now = () => new Date().toISOString() }) {
  const reply = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
  return async event => {
    try {
      const user = await account(event);
      const method = event.requestContext?.http?.method;
      if (!ownerId || user.id !== ownerId) return reply(method === 'GET' ? 200 : 403, { allowed: false, setupRequired: !ownerId, error: ownerId ? 'Personal alerts are not enabled for this account.' : 'Personal alerts need to be connected to your account.' });
      if (method === 'GET') {
        const [profile, results, state, request, email, sms] = await Promise.all(['profile', 'results', 'state', 'request', 'verified#email', 'verified#sms'].map(id => store.get(user.id, id)));
        const preferences = { ...defaultPreferences, ...profile?.preferences };
        if (!profile?.preferences?.timesPerDay && profile?.preferences?.frequency === 'hourly') preferences.timesPerDay = 24;
        return reply(200, { allowed: true, featureVersion: 2, preferences, request: request || null, smsReady: Boolean(smsEnabled), verifiedEmail: email?.address || (user.emailVerified ? user.email : ''), verifiedPhone: sms?.address || '', recommendedCompanies, emailReady: Boolean(sender), recipient: user.email, results: results?.value || null, delivery: { lastSentAt: state?.lastSentAt || null, lastError: state?.lastError || null, uncertain: Boolean(state?.pendingEmail), lastCheckedAt: results?.value?.checkedAt || null } });
      }
      if (method === 'DELETE') { await store.removeAll(user.id); return reply(200, { deleted: true }); }
      const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString() : event.body || '{}';
      if (Buffer.byteLength(raw) > 150000) throw new SettingsError('Settings are too large.', 413);
      let body; try { body = JSON.parse(raw); } catch { throw new SettingsError('Invalid settings.'); }
      if (method === 'PUT') {
        const preferences = validatePreferences(body);
        const destination = await destinationFor(user, preferences, store);
        if (preferences.emailEnabled) {
          if (destination.channel === 'email' && !sender) throw new SettingsError('Connect an email sender before enabling alerts.');
          if (destination.channel === 'sms' && !smsEnabled) throw new SettingsError('Phone delivery is not connected yet.');
          if (!destination.verified) throw new SettingsError('Verify your delivery address before enabling alerts.');
        }
        const prior = await store.get(user.id, 'profile');
        const stamp = now();
        await store.put(user.id, 'profile', { preferences, destination, email: user.email, emailVerified: user.emailVerified === true, version: randomUUID(), alertStartAt: prior?.alertStartAt || stamp, updatedAt: stamp });
        return reply(200, { saved: true, preferences, updatedAt: stamp });
      }
      if (method === 'POST') {
        if (['request-verification', 'verify-delivery'].includes(body.action)) return reply(200, await verifyDelivery({ body, user, store, sender, smsEnabled, sendVerification, now, makeCode }));
        if (!['preview', 'test', 'reset-delivery'].includes(body.action)) throw new SettingsError('Choose a valid action.');
        const profile = await store.get(user.id, 'profile');
        if (!profile) throw new SettingsError('Save your preferences first.');
        if (body.action === 'test') {
          const destination = await destinationFor(user, profile.preferences, store);
          if (!(destination.channel === 'sms' ? smsEnabled : sender) || !destination.verified) throw new SettingsError('Connect delivery and verify your address before sending a test.');
        }
        if (body.action === 'reset-delivery') {
          await store.patch(user.id, 'state', { pendingEmail: null, lastError: null });
          return reply(200, { reset: true });
        }
        // One manual refresh/test per minute. A scheduled run has its own worker lock.
        if (!await store.claimRequest(user.id, Date.parse(now()))) throw new SettingsError('Please wait a minute before running another check.', 429);
        const requestId = randomUUID();
        await store.put(user.id, 'request', { requestId, mode: body.action, status: 'queued', requestedAt: now(), message: 'Waiting for the checker.' });
        try { await enqueue({ mode: body.action, requestId }); } catch { await store.patch(user.id, 'request', { status: 'failed', message: 'Unable to start the check.' }); throw new SettingsError('Unable to start the check. Please try again.', 503); }
        return reply(202, { queued: true, requestId });
      }
      return reply(405, { error: 'Unsupported request.' });
    } catch (error) { const status = error.status || 503; return reply(status, { error: error.status ? error.message : 'Unable to update your settings. Please try again.' }); }
  };
}
