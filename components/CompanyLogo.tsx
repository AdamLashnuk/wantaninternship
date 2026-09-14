"use client";

import { useEffect, useState } from "react";
import { getCompanyLogo } from "../data/companyLogos";

export default function CompanyLogo({
  company,
  className = "",
}: {
  company: string;
  className?: string;
}) {
  const logo = getCompanyLogo(company);
  const [failed, setFailed] = useState(false);
  const initials = company
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => setFailed(false), [company]);

  return (
    <span className={`company-logo ${className}`.trim()}>
      <span className="company-logo-fallback" aria-hidden="true">
        {initials}
      </span>
      {logo && !failed && (
        <img
          src={logo.src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
