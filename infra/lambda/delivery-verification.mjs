import { createHash, timingSafeEqual, randomInt } from 'node:crypto';
import { defaultPreferences, validatePreferences, SettingsError } from './matching-core.mjs';
const hashCode = (id, address, code) => createHash('sha256').update(`${id}:${address}:${code}`).digest('hex');
export async function destinationFor(user, p, store) {
  const channel = p.deliveryChannel || 'email';
  const address = channel === 'sms' ? p.deliveryPhone || '' : p.deliveryEmail || user.email || '';
  const verified = channel === 'email' && address.toLowerCase() === user.email?.toLowerCase() && user.emailVerified || (await store.get(user.id, `verified#${channel}`))?.address === address;
  return { channel, address, verified: Boolean(verified) };
}
export async function verifyDelivery({ body, user, store, sender, smsEnabled, sendVerification, now, makeCode = () => String(randomInt(100000, 1000000)) }) {
  const channel = body.channel;
  if (!['email', 'sms'].includes(channel)) throw new SettingsError('Choose email or text messages.');
  const p = validatePreferences({ ...defaultPreferences, deliveryChannel: channel, [channel === 'sms' ? 'deliveryPhone' : 'deliveryEmail']: String(body.address || '').trim() });
  const target = channel === 'sms' ? p.deliveryPhone : p.deliveryEmail;
  if (!target) throw new SettingsError('Enter your delivery address.');
  const stamp = now(); const clock = Date.parse(stamp);
  if (body.action === 'request-verification') {
    if (channel === 'email' && target === user.email?.toLowerCase() && user.emailVerified) return { verified: true };
    if (channel === 'sms' && body.smsConsent !== true) throw new SettingsError('Confirm that you want text alerts at this number.');
    if (!(channel === 'sms' ? smsEnabled : sender) || !sendVerification) throw new SettingsError(`${channel === 'sms' ? 'Phone' : 'Email'} delivery is not connected yet.`);
    if (!await store.claimVerification(user.id, clock)) throw new SettingsError('Please wait before requesting another code. Up to five codes can be requested per day.', 429);
    const code = makeCode();
    await store.put(user.id, `verification#${channel}`, { address: target, hash: hashCode(user.id, target, code), attempts: 0, expiresAt: Math.floor(clock / 1000) + 600, consumed: false, consentAt: channel === 'sms' ? stamp : null });
    try { await sendVerification({ channel, to: target, code }); } catch { throw new SettingsError('The verification code could not be sent. Check delivery setup, then try again.', 503); }
    return { sent: true };
  }
  const challenge = await store.get(user.id, `verification#${channel}`);
  if (!challenge || challenge.address !== target || challenge.consumed || challenge.expiresAt <= clock / 1000 || challenge.attempts >= 5) throw new SettingsError('This code has expired. Request a new code.');
  if (!await store.verificationAttempt(user.id, channel, challenge.hash, clock)) throw new SettingsError('This code has expired. Request a new code.');
  const hash = hashCode(user.id, target, String(body.code || ''));
  if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(challenge.hash, 'hex'))) throw new SettingsError('That code does not match. Please try again.');
  await store.patch(user.id, `verification#${channel}`, { consumed: true });
  await store.put(user.id, `verified#${channel}`, { address: target, verifiedAt: stamp, consentAt: challenge.consentAt || null });
  return { verified: true };
}
