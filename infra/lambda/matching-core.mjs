import { createHash } from 'node:crypto';
export const recommendedCompanies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'NVIDIA', 'Adobe', 'Salesforce', 'Stripe', 'Duolingo', 'PNC', 'BNY', 'Capital One', 'Cloudflare', 'Datadog', 'AMD', 'Intel', 'Qualcomm', 'Texas Instruments', 'Siemens', 'Bosch', 'GE Vernova', 'Caterpillar', 'RTX'];
export const defaultPreferences = { resumeText: '', resumeName: '', skills: [], roles: ['Software Engineer', 'Machine Learning', 'Data Science'], locations: [], keywords: [], excludeKeywords: [], remoteOnly: false, track: 'software', minimumScore: 60, matchEnabled: false, watchEnabled: false, watchlistMode: 'recommended', companies: [], emailEnabled: false, frequency: 'daily' };
export class SettingsError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const list = (value, field) => {
  if (!Array.isArray(value) || value.length > 50 || value.some(v => typeof v !== 'string' || v.length > 100)) throw new SettingsError(`Use up to 50 short entries for ${field}.`);
  return [...new Set(value.map(v => v.trim()).filter(Boolean))];
};
export function validatePreferences(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SettingsError('Invalid settings.');
  const result = { ...defaultPreferences };
  for (const key of ['resumeText', 'resumeName']) {
    if (typeof value[key] !== 'string' || value[key].length > (key === 'resumeText' ? 30000 : 120)) throw new SettingsError(key === 'resumeText' ? 'Keep resume text under 30,000 characters.' : 'Resume filename is too long.');
    result[key] = value[key].trim();
  }
  for (const key of ['skills', 'roles', 'locations', 'keywords', 'excludeKeywords', 'companies']) result[key] = list(value[key], key);
  for (const key of ['remoteOnly', 'matchEnabled', 'watchEnabled', 'emailEnabled']) {
    if (typeof value[key] !== 'boolean') throw new SettingsError('Invalid notification preference.');
    result[key] = value[key];
  }
  for (const [key, allowed] of Object.entries({ track: ['software', 'engineering', 'both'], frequency: ['daily', 'hourly'], watchlistMode: ['recommended', 'custom', 'both'] })) {
    if (!allowed.includes(value[key])) throw new SettingsError(`Choose a valid ${key}.`);
    result[key] = value[key];
  }
  if (!Number.isInteger(value.minimumScore) || value.minimumScore < 10 || value.minimumScore > 100) throw new SettingsError('Choose a match threshold between 10 and 100.');
  result.minimumScore = value.minimumScore;
  if (result.matchEnabled && result.resumeText.length < 50) throw new SettingsError('Add your resume before enabling resume matching.');
  if (result.watchEnabled && result.watchlistMode === 'custom' && !result.companies.length) throw new SettingsError('Add at least one company to your watchlist.');
  return result;
}
export function textOnly(value = '') {
  return String(value).replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim().slice(0, 16000);
}
const skillNames = ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'SQL', 'R', 'Go', 'Rust', 'React', 'Next.js', 'Node.js', 'HTML', 'CSS', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux', 'TensorFlow', 'PyTorch', 'scikit-learn', 'pandas', 'NumPy', 'Spark', 'Tableau', 'Power BI', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'Flask', 'Django', 'Spring', 'MATLAB', 'SolidWorks', 'AutoCAD', 'CATIA', 'Simulink', 'Verilog', 'VHDL', 'FPGA', 'PCB', 'CAD', 'Figma'];
function contains(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
}
export function extractSkills(text) { return skillNames.filter(skill => contains(text, skill)); }
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = value => normalize(value).split(' ').filter(v => v.length > 2 && !['intern', 'internship', 'summer', '2026', '2027', '2028', 'the', 'and', 'with', 'for'].includes(v));
export function matchesFilters(job, p) {
  const title = String(job.title || '');
  const description = textOnly(job.description);
  const locations = (job.locations?.length ? job.locations : [job.location || '']).join('; ');
  const text = `${title} ${description}`;
  if (job.active === false || job.opportunityType === 'new-grad' || !/intern|co[ -]?op/i.test(title)) return false;
  if (p.track !== 'both' && (job.track || 'software') !== p.track) return false;
  if (p.roles.length && !p.roles.some(role => {
    if (/^(swe|software engineer(?:ing)?)$/i.test(role)) return /\b(swe|software (?:engineer|engineering|developer))\b/i.test(title);
    if (/^(ai(?:\/ml)?|ml|machine learning)$/i.test(role)) return /\b(ai|ml|machine learning|artificial intelligence)\b/i.test(title);
    if (/^data scien(?:ce|tist)$/i.test(role)) return /\bdata scien(?:ce|tist)\b/i.test(title);
    const tokens = words(role === 'SWE' ? 'software engineer' : role);
    return tokens.length && tokens.every(word => normalize(title).includes(word));
  })) return false;
  if (p.locations.length && !p.locations.some(value => normalize(locations).includes(normalize(value)))) return false;
  if (p.remoteOnly && !/\bremote\b/i.test(locations) && job.workplaceType !== 'Remote' && job.isRemote !== true) return false;
  if (p.keywords.length && !p.keywords.every(word => contains(text, word))) return false;
  if (p.excludeKeywords.some(word => contains(text, word))) return false;
  return true;
}
function companyMatches(company, watched) {
  const actual = normalize(company).replace(/\b(inc|llc|ltd|corp|corporation)\b/g, '').trim();
  const target = normalize(watched);
  return actual === target || actual.startsWith(`${target} `);
}
export function evaluateJob(job, p) {
  if (!matchesFilters(job, p)) return null;
  const description = textOnly(job.description);
  const hasRequirements = description.length >= 100;
  const jobSkills = extractSkills(hasRequirements ? description : job.title);
  const resume = `${p.resumeText} ${p.skills.join(' ')}`;
  const matchedSkills = jobSkills.filter(skill => contains(resume, skill));
  const missingSkills = jobSkills.filter(skill => !contains(resume, skill));
  // This is an explainable keyword fit score, never a hiring probability.
  const skillScore = jobSkills.length ? matchedSkills.length / jobSkills.length : 0;
  const titleWords = words(job.title);
  const titleOverlap = titleWords.filter(word => normalize(resume).includes(word)).length / Math.max(1, titleWords.length);
  const score = Math.min(hasRequirements ? 95 : 55, Math.round(20 + 60 * skillScore + 20 * Math.min(1, titleOverlap)));
  const companies = p.watchlistMode === 'recommended' ? recommendedCompanies : p.watchlistMode === 'custom' ? p.companies : [...recommendedCompanies, ...p.companies];
  const watched = p.watchEnabled && companies.some(company => companyMatches(job.company, company));
  // Resume alerts require a full description; sparse listings can still trigger a company alert.
  const resumeMatch = p.matchEnabled && hasRequirements && matchedSkills.length > 0 && score >= p.minimumScore;
  if (!watched && !resumeMatch) return null;
  let url;
  try { const parsed = new URL(job.applicationUrl || job.applyUrl); if (!['http:', 'https:'].includes(parsed.protocol)) return null; url = parsed.toString(); } catch { return null; }
  return { id: job.id, company: String(job.company || ''), title: String(job.title || ''), location: String(job.location || 'Location not listed'), applicationUrl: url, postedAt: job.postedAt || null, firstSeenAt: job.firstSeenAt || null, score, hasRequirements, matchedSkills, missingSkills, reasons: [resumeMatch ? 'Resume and filters match' : '', watched ? 'Company watchlist' : ''].filter(Boolean), sourceUpdatedAt: job.sourceUpdatedAt || null };
}
export function rankMatches(jobs, p) {
  const seen = new Set();
  return jobs.map(job => evaluateJob(job, p)).filter(Boolean).sort((a, b) => b.score - a.score || Date.parse(b.postedAt || b.firstSeenAt || '') - Date.parse(a.postedAt || a.firstSeenAt || '')).filter(job => { if (seen.has(job.applicationUrl)) return false; seen.add(job.applicationUrl); return true; });
}
export function deliveryKey(items) { return createHash('sha256').update(items.map(j => j.id).sort().join('|')).digest('hex'); }
export function digest(items, origin) {
  const safeOrigin = new URL(origin).origin;
  return { subject: `${items.length} new internship${items.length === 1 ? '' : 's'} for you`, text: `Your WantAnInternship alerts\n\n${items.map(j => `${j.company} - ${j.title}\n${j.location}\n${j.reasons.join(' · ')}${j.hasRequirements ? `\nKeyword fit: ${j.score}/100. Skills found: ${j.matchedSkills.join(', ') || 'None'}.` : '\nFull requirements unavailable; company alert only.'}\n${j.applicationUrl}`).join('\n\n')}\n\nFit scores are based on resume keywords, not hiring odds. Review education, work authorization, and other requirements on the employer posting.\n\nManage or pause emails: ${safeOrigin}/settings\n` };
}
