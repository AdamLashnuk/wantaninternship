"use client";

import { useEffect, useState } from "react";

function faviconUrl(website?: string) {
  if (!website) return null;

  try {
    const hostname = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return null;
  }
}

export default function CompanyLogo({
  company,
  website,
  className = "",
}: {
  company: string;
  website?: string;
  className?: string;
}) {
  const logo = faviconUrl(website);
  const [failed, setFailed] = useState(false);
  const initials = company
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => setFailed(false), [company, website]);

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
