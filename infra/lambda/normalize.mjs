import { createHash } from "node:crypto";

const BLOCKED_HOSTS = /(^|\.)(github\.com|simplify\.jobs|speedyapply\.com|careerpuck\.com)$/i;
const WEBSITE_BLOCKED_HOSTS = /(^|\.)(github\.com|simplify\.jobs|speedyapply\.com|careerpuck\.com|greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|myworkdaysite\.com|ats\.rippling\.com|smartrecruiters\.com|workable\.com|icims\.com)$/i;
const TRACKING_KEYS = /^(utm_.+|ref|source|src|gh_src|gh_source|lever-source|campaign|campaignid|trk|trackingid|fbclid|gclid|ittk|tags)$/i;
const OPPORTUNITY = /\b(intern(ship)?|co[ -]?op|new grad(uate)?|recent grad(uate)?|entry[ -]?level|early[ -]?career|university grad(uate)?)\b/i;
const EXCLUDED = /\b(quant(itative)?|trader|trading|finance|investment banking|brokerage|risk analyst|crypto(?:currency)? operations?|business operations|financial operations|compliance|accounting|hardware|firmware|embedded|electrical|mechanical|manufacturing|silicon|asic|fpga|product manager|product management|program manager)\b/i;
const SOFTWARE = /\b(software(?: engineer(?:ing)?| developer| development| intern(?:ship)?| co[ -]?op)|swe|developer|frontend|front-end|backend|back-end|full[ -]?stack|mobile|ios|android|web (?:engineer|developer)|data (?:engineer(?:ing)?|scientist|science|analyst|analytics)|analytics engineer|machine learning|artificial intelligence|ai|ml|cloud|devops|site reliability|sre|platform engineer|infrastructure engineer|systems software|computer science|cyber(?:security)?|cyber security|information security|application security|cloud security|product security|security (?:engineer(?:ing)?|analyst|operations|research|intern(?:ship)?)|infosec|secops)\b/i;
const DATA = /\b(data (?:engineer(?:ing)?|scientist|science|analyst|analytics)|analytics engineer|machine learning|artificial intelligence|ai|ml|deep learning|nlp)\b/i;
const CLOUD = /\b(cloud|devops|site reliability|sre|platform engineer|infrastructure engineer)\b/i;
const SECURITY = /\b(cyber(?:security)?|cyber security|information security|application security|cloud security|product security|security (?:engineer(?:ing)?|analyst|operations|research|intern(?:ship)?)|infosec|secops)\b/i;
const SENIOR = /\b(senior|staff|principal|director|architect|manager|lead|head of|vice president)\b|\bsr\.?(?=\s|,|$)|\bvp\b/i;
const ENGINEERING = /\b(engineer(?:ing)?|mechanical|electrical|electronics?|civil|construction|chemical|process|aerospace|aeronautical|biomedical|bioengineering|industrial|manufacturing|environmental|materials?|metallurgy|nuclear|robotics?|mechatronics|hardware|embedded|firmware|semiconductor|asic|fpga|propulsion|avionics|thermal|fluid|structural|geotechnical|controls?|automation|quality|reliability|test)\b/i;
const SOFTWARE_ROLE = /\b(software (?:engineer(?:ing)?|developer)|web developer|front[ -]?end|back[ -]?end|full[ -]?stack|data (?:scientist|engineer|analyst)|machine learning|artificial intelligence|ai\/ml|cybersecurity|information security|product manager)\b/i;

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
  if (/\b(new grad(uate)?|recent grad(uate)?|entry[ -]?level|early[ -]?career|university grad(uate)?|graduate software)\b/i.test(title)) {
    return "new-grad";
  }
  if (/\b(intern(ship)?|co[ -]?op)\b/i.test(title)) return "internship";
  return fallback;
}

export function hasOpportunitySignal(title = "") {
  return OPPORTUNITY.test(title);
}

export function inferSoftwareCategory(title = "") {
  if (SECURITY.test(title)) return "cybersecurity";
  if (DATA.test(title)) return "data-ai-ml";
  if (CLOUD.test(title)) return "cloud-devops";
  return "swe";
}

export function inferPositionType(value = "") {
  return /\bco[ -]?op(?:erative)?\b/i.test(value) ? "co-op" : "internship";
}

export function inferEngineeringDiscipline(title = "", hints = []) {
  const value = [title, ...(Array.isArray(hints) ? hints : [hints])].join(" ");
  if (/\b(biomedical|bioengineering|biomechanical|medical device|clinical engineering)\b/i.test(value)) return "biomedical";
  if (/\b(aerospace|aeronautical|astronautical|propulsion|avionics|flight dynamics|airframe|spacecraft|satellite|rocket)\b/i.test(value)) return "aerospace";
  if (/\b(civil|construction|structural|geotechnical|transportation engineering|surveying|land development)\b/i.test(value)) return "civil";
  if (/\b(chemical|process engineering|petrochemical|polymer|refining)\b/i.test(value)) return "chemical";
  if (/\b(environmental|sustainability|wastewater|water resources|air quality)\b/i.test(value)) return "environmental";
  if (/\b(materials?|metallurg(?:y|ical)|ceramics?|composites?)\b/i.test(value)) return "materials";
  if (/\b(nuclear|reactor|radiation engineering)\b/i.test(value)) return "nuclear";
  if (/\b(robotics?|mechatronics|autonomous systems?)\b/i.test(value)) return "robotics-mechatronics";
  if (/\b(industrial|manufacturing|production|operations engineering|quality engineering|supplier quality|continuous improvement|lean engineering)\b/i.test(value)) return "industrial-manufacturing";
  if (/\b(electrical|electronics?|circuit|analog|mixed[ -]?signal|radio frequency|\brf\b|power systems?|controls?|instrumentation)\b/i.test(value)) return "electrical";
  if (/\b(computer engineering|hardware|embedded|firmware|semiconductor|silicon|asic|fpga|computer architecture)\b/i.test(value)) return "computer-hardware";
  if (/\b(mechanical|thermal|fluid|hvac|cad|mechanical design|chassis|powertrain)\b/i.test(value)) return "mechanical";
  return "other-engineering";
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
    !SENIOR.test(title) &&
    !EXCLUDED.test(title),
  );
}

export function isRelevantEngineering(job) {
  const title = String(job.title ?? "");
  const type = job.opportunityType ?? inferOpportunityType(title, "");
  const discipline = job.engineeringDiscipline ?? inferEngineeringDiscipline(title);
  const hasSpecificEngineeringSignal = discipline !== "other-engineering";
  return Boolean(
    job.company &&
    canonicalizeApplicationUrl(job.applicationUrl ?? job.applyUrl) &&
    type === "internship" &&
    (OPPORTUNITY.test(title) || job.positionType) &&
    ENGINEERING.test(title) &&
    !SENIOR.test(title) &&
    !SOFTWARE_ROLE.test(title) &&
    (hasSpecificEngineeringSignal || /\bengineer(?:ing)?\b/i.test(title)),
  );
}

export function isRelevantOpportunity(job) {
  return job.track === "engineering" ? isRelevantEngineering(job) : isRelevantSoftware(job);
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

function linkOf(value = "") {
  const htmlLink = String(value).match(/href="([^"]+)"/i)?.[1];
  if (htmlLink) return htmlLink;
  const markdownLinks = [...String(value).matchAll(/\]\((https?:\/\/[^)\s]+)\)/gi)];
  return markdownLinks.at(-1)?.[1] ?? "";
}

function baseJob({ company, companyWebsite, title, opportunityType, positionType, track = "software", disciplineHints = [], locations, applicationUrl, postedAt, source, sourceKey, sourceUrl, active = true, sourcePriority = 10 }) {
  const cleanUrl = canonicalizeApplicationUrl(applicationUrl);
  const allLocations = locationsOf(locations);
  const cleanTitle = cleanText(title);
  return {
    company: cleanText(company),
    companyWebsite: resolveCompanyWebsite(company, companyWebsite, cleanUrl),
    title: cleanTitle,
    opportunityType: inferOpportunityType(title, opportunityType),
    softwareCategory: inferSoftwareCategory(title),
    engineeringDiscipline: track === "engineering" ? inferEngineeringDiscipline(cleanTitle, disciplineHints) : undefined,
    positionType: positionType ?? inferPositionType(cleanTitle),
    track,
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
    if (!/^https?:$/.test(url.protocol) || WEBSITE_BLOCKED_HOSTS.test(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function brandToken(value = "") {
  return normalizeText(value)
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co|group|holdings|technologies|technology)\b/g, "")
    .replace(/\s+/g, "");
}

function atsCompanySlug(url) {
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  if (/greenhouse\.io$/.test(host) || /lever\.co$/.test(host) || /ashbyhq\.com$/.test(host) || /smartrecruiters\.com$/.test(host) || /workable\.com$/.test(host)) {
    return parts[0];
  }
  if (/myworkdayjobs\.com$/.test(host)) return host.split(".")[0];
  if (/myworkdaysite\.com$/.test(host)) {
    const recruiting = parts.findIndex((part) => part.toLowerCase() === "recruiting");
    return recruiting >= 0 ? parts[recruiting + 1] : undefined;
  }
  if (/ats\.rippling\.com$/.test(host)) {
    return parts.find((part) => !/^[a-z]{2}-[a-z]{2}$/i.test(part) && part.toLowerCase() !== "jobs");
  }
  if (/icims\.com$/.test(host)) return host.split(".")[0].replace(/^careers?-?/, "");
  return undefined;
}

function inferredWebsite(company, applicationUrl) {
  try {
    const url = new URL(String(applicationUrl).trim());
    if (!/^https?:$/.test(url.protocol)) return undefined;
    if (!WEBSITE_BLOCKED_HOSTS.test(url.hostname)) return url.origin;

    const slug = atsCompanySlug(url);
    if (slug?.includes(".")) return canonicalizeWebsite(`https://${slug}`);
    const companyKey = brandToken(company);
    const slugKey = brandToken(slug);
    if (slug && slugKey.length >= 3 && (companyKey.includes(slugKey) || slugKey.includes(companyKey))) {
      return canonicalizeWebsite(`https://${slug.toLowerCase()}.com`);
    }
    if (companyKey.length >= 3 && companyKey.length <= 40) {
      return canonicalizeWebsite(`https://${companyKey}.com`);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function resolveCompanyWebsite(company, website, applicationUrl) {
  return canonicalizeWebsite(website) ?? inferredWebsite(company, applicationUrl);
}

export function parseListingsJson(text, config) {
  const parsed = JSON.parse(text);
  const listings = Array.isArray(parsed) ? parsed : (parsed.listings ?? parsed.jobs ?? parsed.roles ?? []);
  return listings
    .filter((item) => {
      if (!item || item.active === false || item.is_visible === false || /^(closed|inactive)$/i.test(String(item.status ?? ""))) return false;
      const category = String(item.category ?? item.discipline ?? "");
      return config.track === "engineering"
        ? !/\b(software|data science|ai|machine learning|quant|product management|finance|business)\b/i.test(category)
        : !/\b(quant|hardware|product management|finance|operations|risk)\b/i.test(category);
    })
    .map((item) => {
      const roleType = String(item.role_type ?? item.opportunity_type ?? "");
      const opportunityType = /new grad/i.test(roleType) ? "new-grad" : config.opportunityType ?? "internship";
      return baseJob({
      company: item.company_name ?? item.company ?? item.companyName,
      companyWebsite: item.company_url ?? item.companyUrl ?? item.companyWebsite ?? item.company_website,
      title: item.title ?? item.role ?? item.position,
      opportunityType,
      positionType: inferPositionType(`${item.title ?? item.role ?? item.position ?? ""} ${roleType}`),
      track: config.track ?? "software",
      disciplineHints: item.disciplines ?? item.discipline ?? item.category ?? [],
      locations: item.locations ?? item.location,
      applicationUrl: item.url ?? item.application_url ?? item.apply_url ?? item.job_url,
      postedAt: item.date_posted ?? item.posted_at ?? item.postedAt,
      source: config.label,
      sourceKey: config.key,
      sourceUrl: config.repository,
      active: item.active !== false,
      sourcePriority: 10,
      });
    })
    .filter(isRelevantOpportunity);
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

    let companyLink = linkOf(cells[0]);
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
    const applicationUrl = linkOf(cells[4]) || linkOf(cells[3]);
    const ageCell = cells.at(-1) ?? "";
    const ageDays = Number(ageCell.match(/(\d+)d/i)?.[1]);
    const postedAt = Number.isFinite(ageDays)
      ? new Date(new Date(config.collectedAt).getTime() - ageDays * 86_400_000).toISOString()
      : isoDate(cleanText(ageCell));

    const job = baseJob({
      company,
      companyWebsite: companyLink,
      title,
      opportunityType: config.opportunityType,
      positionType: inferPositionType(title),
      track: config.track ?? "software",
      disciplineHints: [section],
      locations: [location],
      applicationUrl,
      postedAt,
      source: config.label,
      sourceKey: config.key,
      sourceUrl: config.repository,
      sourcePriority: 10,
    });
    if (isRelevantOpportunity(job)) jobs.push(job);
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
  const trackPrefix = job.track === "engineering" ? "engineering:" : "";
  return `${trackPrefix}url:${parsed.hostname.replace(/^www\./, "")}${pathname}${parsed.search}`;
}

export function listingKey(job) {
  const trackPrefix = job.track === "engineering" ? "engineering:" : "";
  return `${trackPrefix}listing:${normalizeText(job.company)}:${normalizeText(job.title)}`;
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

  for (const job of jobs.filter(isRelevantOpportunity)) {
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
