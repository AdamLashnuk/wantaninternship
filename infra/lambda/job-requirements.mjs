import { textOnly } from './matching-core.mjs';
// Only documented public ATS APIs are requested. Never fetch user-provided URLs.
export async function enrichRequirements(job, request = fetch, cache = new Map()) {
  if (textOnly(job.description).length >= 100) return job;
  let url;
  try { url = new URL(job.applicationUrl || job.applyUrl); } catch { return job; }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return job;
  const parts = url.pathname.split('/').filter(Boolean);
  const safe = value => /^[a-zA-Z0-9_-]+$/.test(value || '');
  let endpoint, select;
  if (['boards.greenhouse.io', 'job-boards.greenhouse.io'].includes(url.hostname) && safe(parts[0]) && parts[1] === 'jobs' && /^\d+$/.test(parts[2] || '')) {
    endpoint = `https://boards-api.greenhouse.io/v1/boards/${parts[0]}/jobs/${parts[2]}`;
    select = data => ({ description: textOnly(data.content) });
  } else if (['jobs.lever.co', 'jobs.eu.lever.co'].includes(url.hostname) && safe(parts[0]) && safe(parts[1])) {
    endpoint = `https://${url.hostname === 'jobs.eu.lever.co' ? 'api.eu.lever.co' : 'api.lever.co'}/v0/postings/${parts[0]}/${parts[1]}?mode=json`;
    select = data => ({ description: textOnly([data.descriptionPlain || data.description, ...(data.lists || []).map(v => `${v.text} ${v.content}`), data.additionalPlain || data.additional].join(' ')), workplaceType: data.workplaceType });
  } else if (url.hostname === 'jobs.ashbyhq.com' && safe(parts[0]) && safe(parts[1])) {
    endpoint = `https://api.ashbyhq.com/posting-api/job-board/${parts[0]}`;
    select = data => {
      const row = (data.jobs || []).find(row => [row.jobUrl, row.applyUrl].some(value => { try { return new URL(value).pathname.split('/')[2] === parts[1]; } catch { return false; } }));
      return row ? { description: textOnly(row.descriptionPlain || row.descriptionHtml), isRemote: row.isRemote === true, workplaceType: row.workplaceType } : {};
    };
  } else return job;
  try {
    if (!cache.has(endpoint)) cache.set(endpoint, (async () => {
      const response = await request(endpoint, { headers: { Accept: 'application/json', 'User-Agent': 'WantAnInternship/PersonalMatching' }, redirect: 'error', signal: AbortSignal.timeout(7000) });
      if (!response.ok) return null;
      // Stream with a bounded payload, including providers with large boards.
      const reader = response.body.getReader(); let bytes = 0; const chunks = [];
      while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 3_000_000) { await reader.cancel(); return null; } chunks.push(Buffer.from(value)); }
      return JSON.parse(Buffer.concat(chunks).toString());
    })());
    const data = await cache.get(endpoint);
    return data ? { ...job, ...select(data) } : job;
  } catch { return job; }
}
