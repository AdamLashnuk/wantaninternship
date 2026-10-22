'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from './AccountProvider';
import type { MatchingPreferences, MatchingState } from '../lib/matching';
import styles from './MatchingSettings.module.css';
const stamp = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not yet';
const listKeys = ['roles', 'locations', 'skills', 'keywords', 'excludeKeywords', 'companies'] as const;
type ListKey = typeof listKeys[number];
export default function MatchingSettings() {
  const { user, loading } = useAccount(); const router = useRouter();
  const [data, setData] = useState<MatchingState | null>(null);
  const [preferences, setPreferences] = useState<MatchingPreferences | null>(null);
  const [lists, setLists] = useState<Record<ListKey, string>>({ roles: '', locations: '', skills: '', keywords: '', excludeKeywords: '', companies: '' });
  const [tab, setTab] = useState('match'); const [busy, setBusy] = useState(false); const [checking, setChecking] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [confirmDelete, setConfirmDelete] = useState(false);
  const poll = useRef<ReturnType<typeof setTimeout> | null>(null); const disposed = useRef(false);
  useEffect(() => { disposed.current = false; return () => { disposed.current = true; if (poll.current) clearTimeout(poll.current); }; }, []);
  useEffect(() => {
    if (!loading && !user) { router.replace('/login?next=/settings'); return; }
    if (!user) return;
    const controller = new AbortController(); setData(null); setPreferences(null);
    fetch('/api/settings', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to load settings.');
      setData(result); if (result.preferences) loadPreferences(result.preferences);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [user?.id, loading, router]);
  function loadPreferences(p: MatchingPreferences) { setPreferences(p); setLists(Object.fromEntries(listKeys.map(key => [key, p[key].join(', ')])) as Record<ListKey, string>); }
  function change<K extends keyof MatchingPreferences>(key: K, value: MatchingPreferences[K]) { setPreferences(p => p ? { ...p, [key]: value } : p); setNotice(''); }
  async function call(method: string, body?: unknown) {
    const response = await fetch('/api/settings', { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Unable to complete this request.'); return value;
  }
  async function save() {
    if (!preferences) return;
    const p = { ...preferences, ...Object.fromEntries(listKeys.map(key => [key, lists[key].split(/[,\n]/).map(v => v.trim()).filter(Boolean)])) } as MatchingPreferences;
    await call('PUT', p); setPreferences(p); setNotice('Preferences saved.');
  }
  async function run(action: 'preview' | 'test' | 'reset-delivery') {
    setBusy(true); setError(''); setNotice('');
    try {
      if (action !== 'reset-delivery') await save();
      const previous = data?.results?.checkedAt;
      await call('POST', { action });
      if (action === 'reset-delivery') { setData(await call('GET')); setNotice('Delivery hold cleared. New alerts can resume.'); return; }
      setChecking(true); setNotice(action === 'test' ? 'Test email queued. This may take a moment.' : 'Checking the latest internships against your saved preferences…');
      let attempts = 0;
      const refresh = async () => {
        try {
          const result: MatchingState = await call('GET'); if (disposed.current) return; setData(result);
          if (result.results?.checkedAt && result.results.checkedAt !== previous) {
            setChecking(false); setNotice(action === 'test' ? 'Check complete. Check your inbox or refresh delivery status below.' : 'Your matches are up to date.'); return;
          }
        } catch { /* A transient status error should not discard saved preferences. */ }
        if (disposed.current) return;
        if (++attempts < 40) poll.current = setTimeout(refresh, 3000);
        else { setChecking(false); setNotice('Your check is queued. Use Refresh status to see the latest results.'); }
      };
      poll.current = setTimeout(refresh, 3000);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Use a resume smaller than 2 MB.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const form = new FormData(); form.append('resume', file);
      const response = await fetch('/api/settings/resume', { method: 'POST', body: form }); const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPreferences(p => p ? { ...p, resumeText: result.text, resumeName: result.name } : p);
      setNotice('Resume text extracted. Review it below, then save your preferences.');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  const field = (key: ListKey, title: string, placeholder: string, hint?: string) => <label>{title}<input value={lists[key]} onChange={event => { setLists(p => ({ ...p, [key]: event.target.value })); setNotice(''); }} placeholder={placeholder} maxLength={5000} />{hint && <small>{hint}</small>}</label>;
  if (!user) return <p role="status">Loading your settings…</p>;
  const tabItems = [
    { id: 'match', label: 'Resume matching', status: preferences?.matchEnabled ? 'On' : 'Off' },
    { id: 'watch', label: 'Company alerts', status: preferences?.watchEnabled ? 'On' : 'Off' },
    { id: 'email', label: 'Email preferences', status: !data?.emailReady ? 'Unavailable' : preferences?.emailEnabled ? 'On' : 'Off' },
  ];
  return <section className={styles.root}>
    <div className={styles.heading}><div><span className={styles.kicker}>Your preferences</span><h1>Settings.</h1><p>Find the openings that fit. Hear about them on your terms.</p></div><Link href="/applications" className={styles.textLink}>View applications</Link></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading your preferences…</p>}
    {(data?.allowed === false || (!data && error)) && <div className={styles.panel}>
      <h2>Personal matching &amp; alerts</h2><p>{data?.error || 'The personal alerts backend needs to be deployed before you can save preferences.'}</p>
      <p>This mode is private to the account selected during setup.</p>
      <details><summary>Setup details</summary><p>Use this account ID for the PersonalAlertsUserId deployment parameter:</p><code className={styles.code}>{user.id}</code><p>Email delivery also needs an SES-verified sender configured as AlertEmailFrom.</p></details>
    </div>}
    {data?.allowed && preferences && <>
      <div className={styles.tabs} role="tablist" aria-label="Settings sections">{tabItems.map(({ id, label, status }, index) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { const ids = ['match', 'watch', 'email']; const next = ids[(ids.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} onClick={() => setTab(id)}><span className={styles.tabNumber}>0{index + 1}</span><span className={styles.tabCopy}><b>{label}</b><small>{status}</small></span></button>)}</div>
      <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await save(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>
        <fieldset disabled={busy || checking} className={styles.fields}>
          <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className={`${styles.panel} ${styles.workspace}`}>
            {tab === 'match' && <>
              <div className={styles.sectionHeading}><div><h2>Resume matching</h2><p>Compare your experience with the skills mentioned in available job descriptions.</p></div><label className={styles.toggle}><input type="checkbox" checked={preferences.matchEnabled} onChange={event => change('matchEnabled', event.target.checked)} /><span>Enabled</span></label></div>
              <label className={styles.upload}>Upload your resume<input type="file" accept=".pdf,.docx,.txt" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /><small>PDF, DOCX, or TXT, up to 2 MB. Only extracted text is saved to your account.</small></label>
              <label>Resume text{preferences.resumeName && <small>{preferences.resumeName}</small>}<textarea value={preferences.resumeText} onChange={event => change('resumeText', event.target.value)} rows={9} maxLength={30000} placeholder="Upload your resume or paste its text here." /><small>Review the extracted text. Contact details are optional and can be removed.</small></label>
              {field('skills', 'Skills to emphasize', 'Python, React, SQL', 'Optional. Add relevant skills that the resume parser may have missed.')}
              <label>Minimum keyword fit: {preferences.minimumScore}/100<input type="range" min="10" max="100" step="5" value={preferences.minimumScore} onChange={event => change('minimumScore', Number(event.target.value))} /><small>A keyword comparison, not a hiring probability. Full descriptions are required for resume-match alerts.</small></label>
              <aside className={styles.tabSummary}><span>Readiness</span><strong>{preferences.resumeText.length >= 50 ? 'Resume ready' : 'Resume needed'}</strong><p>{preferences.resumeText.length >= 50 ? 'Your resume has enough text to run matching.' : 'Add resume text before turning on matching.'}</p><dl><div><dt>Keyword fit</dt><dd>{preferences.minimumScore}/100</dd></div><div><dt>Status</dt><dd>{preferences.matchEnabled ? 'Active' : 'Paused'}</dd></div></dl></aside>
            </>}
            {tab === 'watch' && <>
              <div className={styles.sectionHeading}><div><h2>Company alerts</h2><p>Get new internships from companies you want to follow, even without a resume match.</p></div><label className={styles.toggle}><input type="checkbox" checked={preferences.watchEnabled} onChange={event => change('watchEnabled', event.target.checked)} /><span>Enabled</span></label></div>
              <label>Companies to follow<select value={preferences.watchlistMode} onChange={event => change('watchlistMode', event.target.value as MatchingPreferences['watchlistMode'])}><option value="recommended">Recommended companies</option><option value="custom">My company list</option><option value="both">Recommended + my list</option></select></label>
              {preferences.watchlistMode !== 'custom' && <div className={styles.chips} aria-label="Recommended companies">{data.recommendedCompanies?.map(company => <span key={company}>{company}</span>)}</div>}
              {preferences.watchlistMode !== 'recommended' && field('companies', 'My company list', 'Duolingo, PNC, NVIDIA', 'Separate company names with commas. Use the employer name as it appears in listings.')}
              <p className={styles.note}>Company alerts use the existing internship feed. Adding a name does not start a new careers-site scraper. Your filters below apply to both alert modes.</p>
              <aside className={styles.tabSummary}><span>Watchlist</span><strong>{preferences.watchlistMode === 'recommended' ? 'Recommended companies' : preferences.watchlistMode === 'custom' ? 'Your company list' : 'Combined list'}</strong><p>Alerts use employers already available in the internship feed.</p><dl><div><dt>Mode</dt><dd>{preferences.watchlistMode}</dd></div><div><dt>Status</dt><dd>{preferences.watchEnabled ? 'Active' : 'Paused'}</dd></div></dl></aside>
            </>}
            {tab === 'email' && <>
              <div className={styles.sectionHeading}><div><h2>Email preferences</h2><p>A digest of new matches, without repeating listings already emailed.</p></div><label className={styles.toggle}><input type="checkbox" checked={preferences.emailEnabled} disabled={!data.emailReady} onChange={event => change('emailEnabled', event.target.checked)} /><span>Send emails</span></label></div>
              <div className={styles.delivery}><span>Send to</span><strong>{data.recipient}</strong><small>Uses your verified account email.</small></div>
              {!data.emailReady && <p className={styles.note}>Email delivery is not connected yet. You can save preferences and check matches now. Connect an SES sender to enable emails.</p>}
              <label>How often<select value={preferences.frequency} onChange={event => change('frequency', event.target.value as MatchingPreferences['frequency'])}><option value="daily">Daily digest</option><option value="hourly">Hourly digest</option></select><small>The feed is checked hourly. Emails contain up to 20 new listings and are sent only when there is something to share.</small></label>
              <p className={styles.note}>New-listing alerts begin when you first save settings. Use Check matches to browse existing opportunities. Pause Send emails at any time to keep matching without delivery.</p>
              <button type="button" className={styles.secondary} disabled={!data.emailReady} onClick={() => void run('test')}>Send test email</button>
              <aside className={styles.tabSummary}><span>Delivery</span><strong>{!data.emailReady ? 'Setup required' : preferences.emailEnabled ? 'Digest active' : 'Delivery paused'}</strong><p>Previously emailed listings are not repeated.</p><dl><div><dt>Schedule</dt><dd>{preferences.frequency}</dd></div><div><dt>Last sent</dt><dd>{stamp(data.delivery?.lastSentAt)}</dd></div></dl></aside>
            </>}
          </section>
          <section className={styles.panel}><h2>Filters</h2><p>Apply these preferences to resume matches and company alerts.</p><div className={styles.grid}>
            <label>Track<select value={preferences.track} onChange={event => change('track', event.target.value as MatchingPreferences['track'])}><option value="software">Tech</option><option value="engineering">Engineering</option><option value="both">Tech + engineering</option></select></label>
            {field('roles', 'Roles', 'Software Engineer, Machine Learning', 'Any listed role can match. Leave blank for all roles.')}
            {field('locations', 'Locations', 'Pittsburgh, Remote', 'Any listed location can match. Leave blank for all locations.')}
            {field('keywords', 'Must include', 'Python, SQL', 'All keywords must appear in the title or available description.')}
            {field('excludeKeywords', 'Exclude', 'PhD, Senior', 'Skip a listing if any of these keywords appear.')}
            <label className={styles.checkbox}><input type="checkbox" checked={preferences.remoteOnly} onChange={event => change('remoteOnly', event.target.checked)} /><span>Only listings explicitly marked remote</span></label>
          </div><p className={styles.note}>Always verify graduation dates, sponsorship, citizenship, and other eligibility requirements on the employer posting. These are not automatically confirmed by this version.</p></section>
          <div className={styles.saveBar}><button className={styles.primary} type="submit">{busy ? 'Saving…' : 'Save preferences'}</button><button className={styles.secondary} type="button" onClick={() => void run('preview')}>{checking ? 'Checking…' : 'Check matches'}</button><span>Check matches saves your latest preferences first.</span></div>
        </fieldset>
      </form>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <section className={styles.panel}><div className={styles.sectionHeading}><div><h2>Your matches</h2><p>Last checked: {stamp(data.results?.checkedAt)}</p></div><button className={styles.textLink} disabled={busy} onClick={async () => { try { setData(await call('GET')); } catch (err) { setError((err as Error).message); } }}>Refresh status</button></div>
        {data.results ? <><p className={styles.note}>{data.results.checkedJobs} recent listings checked. Full descriptions available for {data.results.withRequirements}. {data.results.remainingChecks > 0 && `${data.results.remainingChecks} description checks remain and will continue on later runs.`} Searches cover up to 1,000 recent listings per track.</p>
          {data.results.matches.length ? <div className={styles.results}>{data.results.matches.map(match => <article key={match.id} className={styles.match}><div className={styles.matchTop}><span>{match.company}</span><span className={styles.badge}>{match.hasRequirements ? `${match.score}/100 keyword fit` : 'Company alert'}</span></div><a href={match.applicationUrl} target="_blank" rel="noopener noreferrer">{match.title}</a><p>{match.location}</p><div className={styles.reasons}>{match.reasons.map(reason => <span key={reason}>{reason}</span>)}</div>{match.matchedSkills.length > 0 && <p><strong>Skills found:</strong> {match.matchedSkills.join(', ')}</p>}{match.missingSkills.length > 0 && <p><strong>Mentioned in listing, absent from resume:</strong> {match.missingSkills.join(', ')}</p>}{!match.hasRequirements && <small>Full requirements unavailable. This is a company watchlist result.</small>}</article>)}</div> : <p className={styles.empty}>No matches with these preferences yet. Try broader roles, locations, or a lower fit threshold. Listings without full descriptions can still appear through company alerts.</p>}
        </> : <p className={styles.empty}>Save your resume or company preferences, enable a matching mode, then choose Check matches.</p>}
        <p className={styles.note}>Last digest sent: {stamp(data.delivery?.lastSentAt)}</p>
        {data.delivery?.uncertain && <div className={styles.error} role="alert"><p>{data.delivery.lastError || 'A previous delivery was interrupted. Check your inbox before clearing the hold to avoid a repeated email.'}</p><button className={styles.secondary} type="button" disabled={busy} onClick={() => void run('reset-delivery')}>I checked my inbox. Clear delivery hold.</button></div>}
      </section>
      <section className={`${styles.panel} ${styles.danger}`}><h2>Remove personal matching data</h2><p>Delete your saved resume text, preferences, matches, and delivery history. This also stops your alerts.</p>{confirmDelete ? <div className={styles.saveBar}><button className={styles.dangerButton} disabled={busy} onClick={async () => { setBusy(true); try { await call('DELETE'); const result = await call('GET'); setData(result); loadPreferences(result.preferences); setConfirmDelete(false); setNotice('Personal matching data deleted. Alerts are paused.'); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>Delete my matching data</button><button className={styles.secondary} onClick={() => setConfirmDelete(false)}>Cancel</button></div> : <button className={styles.textLink} onClick={() => setConfirmDelete(true)}>Delete matching data</button>}</section>
    </>}
  </section>;
}
