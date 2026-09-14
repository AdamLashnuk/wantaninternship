import { createHash } from "node:crypto";

const BLOCKED_HOSTS = /(^|\.)(github\.com|simplify\.jobs|speedyapply\.com|careerpuck\.com)$/i;
const TRACKING_KEYS = /^(utm_.+|ref|source|src|gh_src|gh_source|lever-source|campaign|campaignid|trk|trackingid|fbclid|gclid|ittk|tags)$/i;
const OPPORTUNITY = /\b(intern(ship)?|co[ -]?op|new grad(uate)?|recent grad(uate)?|entry[ -]?level|university grad(uate)?)\b/i;
const EXCLUDED = /\b(quant(itative)?|trader|trading|finance|investment banking|cyber(?:security)?|security engineer|infosec|hardware|firmware|embedded|electrical|mechanical|manufacturing|silicon|asic|fpga|product manager|product management|program manager)\b/i;
const SOFTWARE = /\b(software|developer|frontend|front-end|backend|back-end|full[ -]?stack|mobile|ios|android|web engineer|data engineer|data science|machine learning|artificial intelligence|ai engineer|ml engineer|cloud|devops|site reliability|sre|platform engineer|infrastructure engineer|systems software|computer science)\b/i;
const DATA = /\b(data engineer|data science|machine learning|artificial intelligence|ai engineer|ml engineer|deep learning|nlp)\b/i;
const CLOUD = /\b(cloud|devops|site reliability|sre|platform engineer|infrastructure engineer)\b/i;

export function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function canonicalizeApplicationUrl(raw = "") {
  try {
    const url = new URL(String(raw).trim());
    if (!/^https?:$/.test(url.protocol) || BLOCKED_HOSTS.test(url.hostname)) return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_KEYS.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return "";
  }
}

export function inferOpportunityType(title = "", fallback = "internship") {
  if (/\b(new grad(uate)?|recent grad(uate)?|entry[ -]?level|university grad(uate)?|graduate software)\b/i.test(title)) {
    return "new-grad";
  }
  if (/\b(intern(ship)?|co[ -]?op)\b/i.test(title)) return "internship";
  return fallback;
}

export function inferSoftwareCategory(title = "") {
  if (DATA.test(title)) return "data-ai-ml";
  if (CLOUD.test(title)) return "cloud-devops";
  return "swe";
}

export function isRelevantSoftware(job) {
  const title = String(job.title ?? "");
  const type = job.opportunityType ?? inferOpportunityType(title, "");
  return Boolean(
    job.company &&
    canonicalizeApplicationUrl(job.applicationUrl ?? job.applyUrl) &&
    (type === "internship" || type === "new-grad") &&
    (OPPORTUNITY.test(title) || job.opportunityType) &&
    SOFTWARE.test(title) &&
    !EXCLUDED.test(title),
  );
}

function cleanText(value = "") {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "; ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isoDate(value) {
  if (!value) return undefined;
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function locationsOf(value) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(/;|\n|<br\s*\/?\s*>/i);
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function baseJob({ company, companyWebsite, title, opportunityType, locations, applicationUrl, postedAt, source, sourceKey, sourceUrl, active = true, sourcePriority = 10 }) {
  const cleanUrl = canonicalizeApplicationUrl(applicationUrl);
  const allLocations = locationsOf(locations);
  return {
    company: cleanText(company),
    companyWebsite: canonicalizeWebsite(companyWebsite),
    title: cleanText(title),
    opportunityType: inferOpportunityType(title, opportunityType),
    softwareCategory: inferSoftwareCategory(title),
    locations: allLocations.length ? allLocations : ["Location not listed"],
    location: allLocations.length > 1 ? "Multiple locations" : (allLocations[0] ?? "Location not listed"),
    applicationUrl: cleanUrl,
    applyUrl: cleanUrl,
    postedAt: isoDate(postedAt),
    source,
    sourceKey,
    sourceUrl,
    active: Boolean(active),
    sourcePriority,
  };
}

function canonicalizeWebsite(raw = "") {
  try {
    const url = new URL(String(raw).trim());
    if (!/^https?:$/.test(url.protocol)) return undefined;
    url.hash = "";
    url.search = "";
    return url.origin;
  } catch {
    return undefined;
  }
}

export function parseListingsJson(text, config) {
  const parsed = JSON.parse(text);
  const listings = Array.isArray(parsed) ? parsed : (parsed.listings ?? parsed.jobs ?? []);
  return listings
    .filter((item) => item && item.active !== false && item.is_visible !== false && !/\b(quant|hardware|product|security|finance)\b/i.test(String(item.category ?? "")))
    .map((item) => baseJob({
      company: item.company_name ?? item.company ?? item.companyName,
      companyWebsite: item.company_url ?? item.companyWebsite ?? item.company_website,
      title: item.title ?? item.role ?? item.position,
      opportunityType: config.opportunityType ?? "internship",
      locations: item.locations ?? item.location,
      applicationUrl: item.url ?? item.application_url ?? item.apply_url ?? item.job_url,
      postedAt: item.date_posted ?? item.posted_at ?? item.postedAt ?? item.date_updated,
      source: config.label,
      sourceKey: config.key,
      sourceUrl: config.repository,
      active: item.active !== false,
      sourcePriority: 10,
    }))
    .filter(isRelevantSoftware);
}

export function parseSpeedyMarkdown(text, config) {
  const jobs = [];
  let section = "";
  let lastCompany = "";
  let lastCompanyWebsite = "";

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("### ")) {
      section = cleanText(line.slice(4)).toLowerCase();
      continue;
    }
    if (!line.startsWith("|") || /^\|[-:| ]+\|$/.test(line)) continue;
    if (section.includes("quant")) continue;

    const cells = line.split("|").slice(1, -1);
    if (cells.length < 5 || /company/i.test(cells[0]) && /position|role/i.test(cells[1])) continue;

    let companyLink = cells[0].match(/href="([^"]+)"/i)?.[1] ?? "";
    let company = cleanText(cells[0]);
    if (company === "↳") {
      company = lastCompany;
      companyLink = lastCompanyWebsite;
    } else {
      lastCompany = company;
      lastCompanyWebsite = companyLink;
    }
    const title = cleanText(cells[1]);
    const location = cleanText(cells[2]);
    const applicationUrl = cells[4].match(/href="([^"]+)"/i)?.[1] ?? cells[3].match(/href="([^"]+)"/i)?.[1] ?? "";
    const ageCell = cells.at(-1) ?? "";
    const ageDays = Number(ageCell.match(/(\d+)d/i)?.[1]);
    const postedAt = Number.isFinite(ageDays)
      ? new Date(new Date(config.collectedAt).getTime() - ageDays * 86_400_000).toISOString()
      : undefined;

    const job = baseJob({
      company,
      companyWebsite: companyLink,
      title,
      opportunityType: config.opportunityType,
      locations: [location],
      applicationUrl,
      postedAt,
      source: config.label,
      sourceKey: config.key,
      sourceUrl: config.repository,
      sourcePriority: 10,
    });
    if (isRelevantSoftware(job)) jobs.push(job);
  }
  return jobs;
}

function urlKey(job) {
  const url = canonicalizeApplicationUrl(job.applicationUrl ?? job.applyUrl);
  if (!url) return "";
  const parsed = new URL(url);
  const pathname = parsed.pathname
    .replace(/\/(apply|application)$/i, "")
    .replace(/^\/en-us\//i, "/")
    .replace(/\/+$/, "");
  return `url:${parsed.hostname.replace(/^www\./, "")}${pathname}${parsed.search}`;
}

export function listingKey(job) {
  return `listing:${normalizeText(job.company)}:${normalizeText(job.title)}`;
}

function mergePair(existing, incoming) {
  const winner = (incoming.sourcePriority ?? 0) > (existing.sourcePriority ?? 0) ? incoming : existing;
  const loser = winner === incoming ? existing : incoming;
  const locations = [...new Set([...(winner.locations ?? []), ...(loser.locations ?? [])].filter(Boolean))];
  const sources = [...new Set([...(winner.sources ?? [winner.source]), ...(loser.sources ?? [loser.source])])];
  const sourceKeys = [...new Set([...(winner.sourceKeys ?? [winner.sourceKey]), ...(loser.sourceKeys ?? [loser.sourceKey])])];
  return {
    ...loser,
    ...winner,
    companyWebsite: winner.companyWebsite ?? loser.companyWebsite,
    postedAt: winner.postedAt ?? loser.postedAt,
    locations,
    location: locations.length > 1 ? "Multiple locations" : (locations[0] ?? "Location not listed"),
    sources,
    sourceKeys,
    active: winner.active || loser.active,
  };
}

export function deduplicateJobs(jobs) {
  const records = new Set();
  const index = new Map();

  for (const job of jobs.filter(isRelevantSoftware)) {
    const keys = [urlKey(job), listingKey(job)].filter(Boolean);
    const existing = keys.map((key) => index.get(key)).find(Boolean);
    if (!existing) {
      const record = { ...job, sources: [job.source], sourceKeys: [job.sourceKey] };
      records.add(record);
      keys.forEach((key) => index.set(key, record));
      continue;
    }

    const merged = mergePair(existing, job);
    records.delete(existing);
    records.add(merged);
    for (const [key, value] of index.entries()) {
      if (value === existing) index.set(key, merged);
    }
    [urlKey(merged), listingKey(merged), ...keys].filter(Boolean).forEach((key) => index.set(key, merged));
  }

  return [...records].map((job) => {
    const identity = urlKey(job) || listingKey(job);
    return {
      ...job,
      id: createHash("sha256").update(identity).digest("hex"),
      sourcePriority: undefined,
    };
  });
}
