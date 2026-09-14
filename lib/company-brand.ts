const INTERMEDIARY_HOSTS = /(^|\.)(github\.com|simplify\.jobs|speedyapply\.com|careerpuck\.com|greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|myworkdaysite\.com|ats\.rippling\.com|smartrecruiters\.com|workable\.com|icims\.com)$/i;

function cleanWebsite(raw?: string) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || INTERMEDIARY_HOSTS.test(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function brandToken(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co|group|holdings|technologies|technology)\b/g, "")
    .replace(/\s+/g, "");
}

function atsCompanySlug(url: URL) {
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

function inferFromApplication(company: string, applicationUrl?: string) {
  if (!applicationUrl) return undefined;
  try {
    const url = new URL(applicationUrl);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    if (!INTERMEDIARY_HOSTS.test(url.hostname)) return url.origin;

    const slug = atsCompanySlug(url);
    if (slug?.includes(".")) return cleanWebsite(`https://${slug}`);
    const companyKey = brandToken(company);
    const slugKey = brandToken(slug);
    if (slug && slugKey.length >= 3 && (companyKey.includes(slugKey) || slugKey.includes(companyKey))) {
      return cleanWebsite(`https://${slug.toLowerCase()}.com`);
    }
    if (companyKey.length >= 3 && companyKey.length <= 40) {
      return cleanWebsite(`https://${companyKey}.com`);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function resolveCompanyWebsite(company: string, website?: string, applicationUrl?: string) {
  return cleanWebsite(website) ?? inferFromApplication(company, applicationUrl);
}
