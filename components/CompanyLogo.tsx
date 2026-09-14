"use client";

import { useEffect, useState } from "react";
import { resolveCompanyWebsite } from "../lib/company-brand";

function faviconUrl(company: string, website?: string, applicationUrl?: string) {
  const resolvedWebsite = resolveCompanyWebsite(company, website, applicationUrl);
  if (!resolvedWebsite) return null;
  const hostname = new URL(resolvedWebsite).hostname;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
}

export default function CompanyLogo({
  company,
  website,
  applicationUrl,
  className = "",
}: {
  company: string;
  website?: string;
  applicationUrl?: string;
  className?: string;
}) {
  const logo = faviconUrl(company, website, applicationUrl);
  const [failed, setFailed] = useState(false);
  const initials = company
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => setFailed(false), [company, website, applicationUrl]);

  return (
    <span className={`company-logo ${className}`.trim()}>
      <span className="company-logo-fallback" aria-hidden="true">
        {initials}
      </span>
      {logo && !failed && (
        <img
          src={logo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
