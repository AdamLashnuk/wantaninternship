'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from './AccountProvider';
import type { InternshipMatch, MatchingPreferences, MatchingState } from '../lib/matching';
import { cleanResumeText, resumeSkills, resumeSkillOptions } from '../lib/resume-profile';
import SettingsDropdown, { type Choice } from './SettingsDropdown';
import styles from './MatchingSettings.module.css';
const options = (values: string[]): Choice[] => values.map(value => ({ value, label: value }));
const stamp = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not yet';
const sections = [{ id:'resume', title:'Your resume', detail:'Upload & parse', step:'01' }, { id:'companies', title:'Company alerts', detail:'Companies & preferences', step:'02' }, { id:'delivery', title:'Delivery preferences', detail:'Email or phone', step:'03' }];
const roleOptions = ['Software Engineer','Machine Learning','Data Science','Frontend','Backend','Full Stack','Cloud','DevOps','Cybersecurity','Product','Mechanical','Electrical','Civil','Aerospace','Robotics','Manufacturing','Hardware'];
const locationOptions = ['Remote','Pittsburgh','New York','San Francisco','Seattle','Boston','Austin','Chicago','Washington','Atlanta','Los Angeles','USA','Canada','United Kingdom'];
export default function MatchingSettings() {
  const { user, loading } = useAccount(); const router = useRouter(); const path = usePathname();
  const section = path.endsWith('/companies') ? 'companies' : path.endsWith('/delivery') ? 'delivery' : 'resume';
  const [data, setData] = useState<MatchingState | null>(null); const [p, setP] = useState<MatchingPreferences | null>(null);
  const [busy, setBusy] = useState(''); const [checking, setChecking] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false); const [code, setCode] = useState(''); const [codeSent, setCodeSent] = useState(''); const [confirmDelete, setConfirmDelete] = useState(false);
  const poll = useRef<ReturnType<typeof setTimeout> | null>(null); const disposed = useRef(false); const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { disposed.current = false; return () => { disposed.current = true; if (poll.current) clearTimeout(poll.current); }; }, []);
  async function call(method = 'GET', body?: unknown): Promise<MatchingState & { requestId?: string; preferences?: MatchingPreferences; text?: string; name?: string; sent?: boolean; verified?: boolean }> {
    const response = await fetch('/api/settings', { method, headers: {'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {}), cache:'no-store' });
    const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Unable to complete this request.'); return value;
  }
  useEffect(() => {
    if (!loading && !user) { router.replace('/login?next=/settings/resume'); return; }
    if (!user) return;
    let active = true; setData(null); setP(null);
    call().then(value => { if (!active) return; setData(value); if (value.preferences) setP({ ...value.preferences, deliveryChannel:value.preferences.deliveryChannel || 'email', deliveryEmail:value.preferences.deliveryEmail || value.recipient || '', deliveryPhone:value.preferences.deliveryPhone || '', timesPerDay:value.preferences.timesPerDay || (value.preferences.frequency === 'hourly' ? 24 : 1) }); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [user?.id, loading, router]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  function change<K extends keyof MatchingPreferences>(key: K, value: MatchingPreferences[K]) { setP(prev => prev ? {...prev,[key]:value} : prev); setDirty(true); setNotice(''); setError(''); }
  async function save(next = p) { if (!next) return; const result = await call('PUT', next); if (result.preferences) setP(result.preferences); setDirty(false); return result; }
  async function action(name: string, fn: () => Promise<void>) { setBusy(name); setError(''); setNotice(''); try { await fn(); } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); } finally { if (!disposed.current) setBusy(''); } }
  async function upload(file?: File) {
    if (!file) return;
    await action('parse', async () => {
      if (file.size > 2 * 1024 * 1024) throw new Error('Use a resume smaller than 2 MB.');
      let text: string;
      if (file.name.toLowerCase().endsWith('.pdf')) { const { extractPdfInBrowser } = await import('../lib/resume-browser'); text = await extractPdfInBrowser(file); }
      else {
        const form = new FormData(); form.append('resume',file);
        const response = await fetch('/api/settings/resume',{method:'POST',body:form});
        const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to read this resume.'); text = result.text;
      }
      text = cleanResumeText(text);
      setP(prev => prev ? {...prev,resumeText:text,resumeName:file.name.slice(0,120),skills:[...new Set([...prev.skills,...resumeSkills(text)])].slice(0,50)} : prev);
      setDirty(true); setNotice('Resume parsed. Review the extracted text, then save your resume.');
    });
  }
  async function run(mode: 'preview' | 'test') {
    await action(mode, async () => {
      await save(); const previous = data?.results?.checkedAt;
      const response = await call('POST',{action:mode}); const id = response.requestId;
      setChecking(true); setNotice(mode === 'test' ? 'Sending a test to your selected destination…' : 'Looking for internships that fit your preferences…');
      if (poll.current) clearTimeout(poll.current); let attempts = 0;
      const refresh = async () => {
        try {
          const value = await call(); if (disposed.current) return; setData(value);
          if (id && value.request?.requestId === id && ['complete','failed'].includes(value.request.status)) {
            setChecking(false); if (value.request.status === 'failed') { setError(value.request.message); setNotice(''); } else setNotice(mode === 'test' ? 'Test alert sent. Check your selected inbox or phone.' : 'Check complete. Your results are below.'); return;
          }
          if (!id && value.results?.checkedAt && value.results.checkedAt !== previous) { setChecking(false); setNotice('Check complete. Your results are below.'); return; }
          if (id && value.request?.requestId === id && value.request.status === 'running') setNotice(value.request.message);
        } catch { /* Keep polling a transient status failure. */ }
        if (disposed.current) return;
        if (++attempts < 80) poll.current = setTimeout(refresh,3000);
        else { setChecking(false); setError('This check is taking longer than expected. Refresh its status below; it may still be running.'); setNotice(''); }
      };
      poll.current = setTimeout(refresh,1500);
    });
  }
  useEffect(() => { setNotice(''); setError(''); }, [section]);
  if (!user) return <p role="status">Loading your settings…</p>;
  const ready = Boolean(p && p.resumeText.trim().length >= 50);
  const skills = p ? resumeSkills(p.resumeText) : [];
  const channelReady = p?.deliveryChannel === 'sms' ? data?.smsReady : data?.emailReady;
  const address = p?.deliveryChannel === 'sms' ? p.deliveryPhone : p?.deliveryEmail;
  const verified = Boolean(address && (p?.deliveryChannel === 'sms' ? data?.verifiedPhone === address.replace(/[\s().-]/g,'') : data?.verifiedEmail?.toLowerCase() === address.toLowerCase()));
  const single = (label: string, value: string, choices: Choice[], onChange: (v:string) => void, hint?: string, disabled = false) => <SettingsDropdown label={label} value={[value]} options={choices} onChange={v => onChange(v[0])} hint={hint} disabled={disabled} />;
  function matchCards(matches: InternshipMatch[], provisional = false) { return <div className={styles.results}>{matches.map(match => <article key={`${provisional?'candidate':'match'}-${match.id}`} className={styles.match}><div className={styles.matchTop}><span>{match.company}</span><span className={styles.badge}>{provisional ? 'Requirements unavailable' : match.hasRequirements ? `${match.score}% keyword fit` : 'Company alert'}</span></div><a href={match.applicationUrl} target="_blank" rel="noopener noreferrer">{match.title}</a><p>{match.location}</p><div className={styles.reasons}>{match.reasons.map(reason => <span key={reason}>{reason}</span>)}</div>{match.matchedSkills.length > 0 && <small>Skills found: {match.matchedSkills.join(', ')}</small>}{!provisional && match.missingSkills.length > 0 && <small>Not found on your resume: {match.missingSkills.join(', ')}</small>}</article>)}</div>; }
  return <section className={styles.root}>
    <div className={styles.heading}><div><span className={styles.kicker}>Make it yours</span><h1>Settings<span>.</span></h1><p>The right opportunities. Your kind of notifications.</p></div><Link href="/applications" className={styles.textLink}>View applications</Link></div>
    <nav className={styles.tabs} aria-label="Settings pages">{sections.map(item => <Link key={item.id} href={`/settings/${item.id}`} aria-current={section === item.id ? 'page' : undefined}><span className={styles.tabNumber}>{item.step}</span><span><b>{item.title}</b><small>{item.detail}</small></span><i aria-hidden="true" /></Link>)}</nav>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {!data && !error && <div className={styles.loading} role="status">Loading your preferences…</div>}
    {(data?.allowed === false || (!data && error)) && <div className={styles.panel}><h2>Settings are not connected yet</h2><p>{data?.error || 'We could not reach your saved preferences. Please try again shortly.'}</p></div>}
    {data?.allowed && p && <div className={styles.pageBody} key={section}>
      {section === 'resume' && <>
        <div className={styles.pageIntro}><span className={styles.eyebrow}>01 / Your resume</span><h2>A good match starts here.</h2><p>Upload your resume once. Review what we read before using it for internship matching.</p></div>
        <div className={styles.workspace}><div className={styles.mainColumn}>
          <section className={`${styles.panel} ${styles.uploadPanel}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) void upload(event.dataTransfer.files[0]); }}>
            <span className={styles.fileMark} aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M10 4h9l6 6v18H7V4h3Zm9 0v7h6M12 17h8M12 22h6"/></svg></span>
            <h3>{busy === 'parse' ? 'Reading your resume…' : p.resumeName || 'Drop your resume here'}</h3><p>{busy === 'parse' ? 'Extracting the text and recognizing your skills.' : 'PDF, DOCX or TXT. Up to 2 MB.'}</p>
            <input ref={fileInput} type="file" tabIndex={-1} accept=".pdf,.docx,.txt" aria-label="Upload resume" className={styles.fileInput} onChange={event => { void upload(event.target.files?.[0]); event.target.value=''; }} />
            <button type="button" className={styles.primary} disabled={Boolean(busy)} onClick={() => fileInput.current?.click()}>{busy === 'parse' ? <><span className={styles.spinner}/>Parsing resume</> : ready ? 'Replace resume' : 'Choose your resume'}</button><small>PDF text is extracted in your browser. The original file is not stored.</small>
          </section>
          <section className={styles.panel}><div className={styles.sectionHeading}><div><h3>Review the extracted text</h3><p>You can edit it here or paste your resume instead.</p></div><span className={ready ? styles.goodBadge : styles.badge}>{ready ? 'Text ready' : 'Awaiting resume'}</span></div><label className={styles.field}><span className={styles.srOnly}>Resume text</span><textarea value={p.resumeText} rows={11} maxLength={30000} onChange={event => change('resumeText',event.target.value)} placeholder="Your resume text will appear here…" /></label></section>
          <SettingsDropdown label="Skills to emphasize" value={p.skills} options={options(resumeSkillOptions)} multiple custom onChange={v => change('skills',v)} placeholder="Choose skills or add your own" hint="Skills are recognized automatically when you upload. Add any we missed." />
          <div className={styles.saveBar}><button className={styles.primary} disabled={Boolean(busy) || !ready} onClick={() => void action('save', async () => { await save(p); setNotice('Resume saved. Set your company preferences next.'); })}>{busy === 'save' ? 'Saving…' : 'Save resume'}</button><span>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span><Link href="/settings/companies" className={styles.textLink}>Company preferences</Link></div>
        </div><aside className={styles.sidePanel}><span className={styles.eyebrow}>Resume overview</span><h3>{ready ? 'Ready to review.' : 'Your experience, understood.'}</h3><p>{ready ? 'Check the text and recognized skills, then save. Matching runs from the Company alerts page.' : 'A text-based PDF or DOCX works best. Scanned images need OCR before uploading.'}</p><div className={styles.stat}><span>Readable words</span><b>{p.resumeText.trim() ? p.resumeText.trim().split(/\s+/).length : '—'}</b></div><div className={styles.stat}><span>Recognized skills</span><b>{skills.length}</b></div>{skills.length > 0 && <div className={styles.chips}>{skills.slice(0,12).map(skill => <span key={skill}>{skill}</span>)}</div>}<p className={styles.fine}>Only the extracted text and your preferences are saved to your account. Contact details are optional; remove them before saving if you prefer.</p></aside></div>
      </>}
      {section === 'companies' && <>
        <div className={styles.pageIntro}><span className={styles.eyebrow}>02 / Company alerts</span><h2>Follow your next opportunity.</h2><p>Pick the companies, roles and locations you care about. Check matches here whenever you like.</p></div>
        <section className={styles.panel}><div className={styles.grid}>
          {single('Alert mode',p.matchEnabled ? p.watchEnabled ? 'both' : 'resume' : p.watchEnabled ? 'companies' : 'paused',[{value:'both',label:'Resume matches + company alerts',description:'Either kind of match can trigger an alert.'},{value:'resume',label:'Resume matches only',description:'Requires readable resume text and job requirements.'},{value:'companies',label:'Company alerts only',description:'New postings from the companies you follow.'},{value:'paused',label:'Paused',description:'Keep your preferences; no automatic alerts.'}],v => { if (['resume','both'].includes(v) && !ready) { setError('Upload and save your resume first.'); return; } setP({...p,matchEnabled:['resume','both'].includes(v),watchEnabled:['companies','both'].includes(v)});setDirty(true);setNotice(''); },'A preview also works while automatic alerts are paused.')}
          {single('Company list',p.watchlistMode,[{value:'recommended',label:'Recommended companies'},{value:'custom',label:'My companies'},{value:'both',label:'Recommended + my companies'}],v => change('watchlistMode',v as MatchingPreferences['watchlistMode']))}
        </div>
        {p.watchlistMode !== 'recommended' && <SettingsDropdown label="Companies to follow" value={p.companies} options={options(data.recommendedCompanies || [])} multiple custom onChange={v => change('companies',v)} placeholder="Search companies or add your own" hint="Choose employers from the current internship feed. Adding a company does not start a new scraper." />}
        {p.watchlistMode !== 'custom' && <details className={styles.details}><summary>View recommended companies <span>{data.recommendedCompanies?.length || 0}</span></summary><div className={styles.chips}>{data.recommendedCompanies?.map(company => <span key={company}>{company}</span>)}</div></details>}
        </section>
        <section className={styles.panel}><div className={styles.sectionHeading}><div><h3>What are you looking for?</h3><p>These preferences apply to both types of alerts.</p></div></div><div className={styles.grid}>
          {single('Career field',p.track,[{value:'software',label:'Software & tech'},{value:'engineering',label:'Engineering'},{value:'both',label:'Software + engineering'}],v => change('track',v as MatchingPreferences['track']))}
          <SettingsDropdown label="Roles" value={p.roles} options={options(roleOptions)} multiple custom onChange={v => change('roles',v)} placeholder="Any internship role" hint="Any selected role can match. Clear the selection for all roles." />
          <SettingsDropdown label="Locations" value={p.locations} options={options(locationOptions)} multiple custom onChange={v => change('locations',v)} placeholder="Anywhere" hint="Search cities or add a location. Clear for all locations." />
          {single('Work arrangement',p.remoteOnly ? 'remote' : 'any',[{value:'any',label:'On-site, hybrid or remote'},{value:'remote',label:'Remote only'}],v => change('remoteOnly',v === 'remote'))}
          <SettingsDropdown label="Must include" value={p.keywords} options={options(resumeSkillOptions)} multiple custom onChange={v => change('keywords',v)} placeholder="No required keywords" hint="Every selected keyword must appear in the title or available description." />
          <SettingsDropdown label="Exclude" value={p.excludeKeywords} options={options(['Senior','Staff','Principal','PhD','Graduate','Unpaid'])} multiple custom onChange={v => change('excludeKeywords',v)} placeholder="Nothing excluded" hint="A posting is skipped if it contains any selected keyword." />
        </div></section>
        <section className={styles.panel}><div className={styles.grid}>{single('Resume match preference',String(p.minimumScore),[{value:'20',label:'Explore more · 20% keyword fit',description:'A broader starting point with some overlap.'},{value:'40',label:'Flexible · 40% keyword fit',description:'Include roles where you can grow.'},{value:'60',label:'Balanced · 60% keyword fit',description:'A useful balance of fit and opportunity.'},{value:'75',label:'Focused · 75% keyword fit',description:'Prioritize stronger skills overlap.'},{value:'90',label:'Very focused · 90% keyword fit',description:'Only the closest keyword matches.'}],v => change('minimumScore',Number(v)),'Keyword fit is a guide, not a hiring probability. Full requirements are needed for confirmed resume matches.')}<div className={styles.inlineNote}><b>Make it a useful shortlist.</b><p>Start broad, then narrow your choices. Unknown requirements appear separately for review and never trigger resume-match alerts.</p></div></div></section>
        <div className={styles.saveBar}><button className={styles.primary} disabled={Boolean(busy) || checking} onClick={() => void run('preview')}>{checking ? <><span className={styles.spinner}/>Checking matches</> : 'Check matches'}</button><button className={styles.secondary} disabled={Boolean(busy) || checking} onClick={() => void action('save',async () => { await save();setNotice('Company preferences saved.'); })}>Save preferences</button><span>{dirty ? 'Your changes will be saved before checking.' : data.results ? `Last checked ${stamp(data.results.checkedAt)}` : 'No check yet'}</span></div>
        <section className={styles.panel} aria-busy={checking}><div className={styles.sectionHeading}><div><h3>Your shortlist</h3><p>{checking ? data.request?.status === 'running' ? data.request.message : 'Your check is queued…' : 'Confirmed matches and company alerts.'}</p></div><button className={styles.textLink} onClick={() => void action('refresh',async () => { setData(await call()); })}>Refresh status</button></div>
          {data.results ? <><div className={styles.stats}><div><b>{data.results.checkedJobs}</b><span>Listings checked</span></div><div><b>{data.results.filteredJobs ?? '—'}</b><span>Fit your filters</span></div><div><b>{data.results.matchCount}</b><span>Matches</span></div></div>{data.results.matches.length ? matchCards(data.results.matches) : <div className={styles.empty}><h4>No confirmed matches yet.</h4><p>{data.results.filteredJobs === 0 ? 'Your filters ruled out the available listings. Try clearing locations, roles or required keywords.' : data.results.withRequirements === 0 ? 'The available postings do not have full descriptions yet. Review the potential opportunities below or use company alerts.' : 'Try broader roles or locations, or choose a more flexible match preference.'}</p></div>}
          {(data.results.potentialMatches?.length || 0) > 0 && <><div className={styles.sectionHeading}><div><h3>Worth a closer look</h3><p>These fit your filters, but full requirements are unavailable. Open the posting to check your fit.</p></div></div>{matchCards(data.results.potentialMatches!,true)}</>}
          {data.results.remainingChecks > 0 && <p className={styles.fine}>{data.results.remainingChecks} supported descriptions remain to check on later runs.</p>}<p className={styles.fine}>Always confirm graduation, sponsorship and other eligibility requirements on the employer’s posting.</p></> : <div className={styles.empty}><h4>Ready when you are.</h4><p>Choose your preferences, then check matches. This does not send a notification.</p></div>}
        </section>
      </>}
      {section === 'delivery' && <>
        <div className={styles.pageIntro}><span className={styles.eyebrow}>03 / Delivery preferences</span><h2>A heads-up, your way.</h2><p>Choose email or your phone. One destination, with a frequency that works for you.</p></div>
        <div className={styles.workspace}><div className={styles.mainColumn}><section className={styles.panel}>
          {single('Send my alerts to',p.deliveryChannel,[{value:'email',label:'Email / Gmail',description:'A digest with application links and match details.'},{value:'sms',label:'My phone',description:'A short text with a link to your new matches.'}],v => { setP({...p,deliveryChannel:v as 'email'|'sms',emailEnabled:false});setDirty(true);setCode('');setCodeSent('');setNotice('Delivery is paused until you verify the destination and turn it on.'); })}
          <label className={styles.field}><span className={styles.label}>{p.deliveryChannel === 'sms' ? 'Phone number' : 'Email address'}</span><input type={p.deliveryChannel === 'sms' ? 'tel' : 'email'} autoComplete={p.deliveryChannel === 'sms' ? 'tel' : 'email'} value={address || ''} onChange={event => { setP({...p,[p.deliveryChannel === 'sms' ? 'deliveryPhone' : 'deliveryEmail']:event.target.value,emailEnabled:false});setDirty(true);setCodeSent('');setCode(''); }} placeholder={p.deliveryChannel === 'sms' ? '+1 412 555 1234' : 'you@gmail.com'} maxLength={p.deliveryChannel === 'sms' ? 24 : 254} /><small className={styles.hint}>{verified ? 'Verified destination' : 'Verify this destination before turning on delivery.'}</small></label>
          {!channelReady && <p className={styles.setupNotice}>{p.deliveryChannel === 'sms' ? 'Phone delivery is not connected yet. You can save your number; texts will stay off until SMS is enabled.' : 'Email delivery needs a verified sender. You can save your email and frequency now; sending stays off until it is connected.'}</p>}
          {p.deliveryChannel === 'sms' && <p className={styles.fine}>By choosing “Verify & allow texts,” you agree to receive the internship alerts you request at this number. Message and data rates may apply. Pause alerts here at any time. Reply STOP to opt out through your carrier.</p>}
          {!verified && <button type="button" className={styles.secondary} disabled={Boolean(busy) || !channelReady || !address} onClick={() => void action('verify',async () => { const response = await call('POST',{action:'request-verification',channel:p.deliveryChannel,address,smsConsent:p.deliveryChannel === 'sms'});if (response.verified) setData(await call()); else { setCodeSent(address || '');setNotice('Verification code sent. It expires in 10 minutes.'); } })}>{busy === 'verify' ? 'Sending code…' : p.deliveryChannel === 'sms' ? 'Verify & allow texts' : 'Send verification code'}</button>}
          {codeSent === address && codeSent && !verified && <div className={styles.verifyRow}><label className={styles.field}><span className={styles.label}>Verification code</span><input value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} onChange={e => setCode(e.target.value.replace(/\D/g,''))} placeholder="6-digit code" /></label><button className={styles.secondary} disabled={Boolean(busy) || code.length !== 6} onClick={() => void action('verify-code',async () => { await call('POST',{action:'verify-delivery',channel:p.deliveryChannel,address,code});setData(await call());setNotice('Destination verified. You can turn delivery on now.');setCode(''); })}>Verify code</button></div>}
          <div className={styles.divider}/>
          {single('How many times per day?',String(p.timesPerDay),[1,2,3,4,6,12,24].map(n => ({value:String(n),label:n === 1 ? 'Once a day' : n === 24 ? 'Hourly · up to 24 times a day' : `Up to ${n} times a day`,description:n === 1 ? 'One daily digest, only when there are new matches.' : `At least ${24/n} ${n === 24 ? 'hour' : 'hours'} between alerts.`})),v => change('timesPerDay',Number(v)),'New matches only. No empty digests or repeated listings. The feed is checked hourly.')}
          {single('Notification status',p.emailEnabled ? 'on' : 'off',[{value:'on',label:'On · send new matches'},{value:'off',label:'Paused · keep matching without alerts'}],v => { if (v === 'on' && (!verified || !channelReady)) { setError('Connect delivery and verify your destination first.'); return; }change('emailEnabled',v === 'on'); })}
          <div className={styles.saveBar}><button className={styles.primary} disabled={Boolean(busy) || checking} onClick={() => void action('save',async () => { await save();setNotice('Delivery preferences saved. Only your selected channel will receive alerts.'); })}>{busy === 'save' ? 'Saving…' : 'Save delivery preferences'}</button><button className={styles.secondary} disabled={Boolean(busy) || checking || !channelReady || !verified} onClick={() => void run('test')}>{checking ? 'Sending test…' : p.deliveryChannel === 'sms' ? 'Send test text' : 'Send test email'}</button></div>
        </section></div><aside className={styles.sidePanel}><span className={styles.eyebrow}>Your delivery plan</span><h3>{p.deliveryChannel === 'sms' ? 'Straight to your phone.' : 'One useful email.'}</h3><p>We use your selected channel only. Switching to your phone stops email alerts, and switching to email stops texts.</p><div className={styles.stat}><span>Delivery</span><b>{p.emailEnabled ? 'On' : 'Paused'}</b></div><div className={styles.stat}><span>Maximum per day</span><b>{p.timesPerDay}</b></div><div className={styles.stat}><span>Last digest</span><small>{stamp(data.delivery?.lastSentAt)}</small></div><Link href="/settings/companies" className={styles.textLink}>Edit companies & preferences</Link></aside></div>
        {data.delivery?.uncertain && <section className={styles.panel}><h3>A delivery needs review</h3><p>{data.delivery.lastError || 'Check your selected inbox or phone before clearing the hold, to avoid duplicate alerts.'}</p><button className={styles.secondary} disabled={Boolean(busy)} onClick={() => void action('reset',async () => { await call('POST',{action:'reset-delivery'});setData(await call());setNotice('Delivery hold cleared.'); })}>I checked. Clear the delivery hold.</button></section>}
        <details className={`${styles.panel} ${styles.danger}`}><summary>Remove my matching data</summary><p>Delete your saved resume, preferences and delivery history. This pauses your alerts.</p>{confirmDelete ? <div className={styles.saveBar}><button className={styles.dangerButton} disabled={Boolean(busy)} onClick={() => void action('delete',async () => { await call('DELETE');const value = await call();setData(value);setP(value.preferences || null);setDirty(false);setConfirmDelete(false);setNotice('Matching data deleted. Alerts are paused.'); })}>Delete matching data</button><button className={styles.secondary} onClick={() => setConfirmDelete(false)}>Cancel</button></div> : <button className={styles.textLink} onClick={() => setConfirmDelete(true)}>Delete matching data</button>}</details>
      </>}
    </div>}
  </section>;
}
