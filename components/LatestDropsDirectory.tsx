"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import { isUsInternship } from "../lib/internship-location";
import type { InternshipJob, InternshipResponse } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";

function getFallbackJobs(): InternshipJob[] {
  return trackContent.software.drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    location: drop.location,
    locations: [drop.location],
    applyUrl: drop.url,
    source: "curated",
    firstSeenAt: "",
  }));
}

function relativeTime(value: string) {
  if (!value) return "Recently added";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently added";

  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return "Added within the last hour";
  if (hours < 24) return `Added about ${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `Added about ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function LatestDropsDirectory() {
  const fallback = useMemo(getFallbackJobs, []);
  const [jobs, setJobs] = useState<InternshipJob[]>(fallback);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<"usa" | "global">("usa");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      try {
        const response = await fetch("/api/internships?track=software&limit=100", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as InternshipResponse;
        if (payload.live && payload.jobs.length > 0) {
          setJobs(payload.jobs);
          setIsLive(true);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load internships", error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
    return () => controller.abort();
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (region === "usa" && !isUsInternship(job)) return false;
      if (!normalizedQuery) return true;

      return [job.company, job.title, ...(job.locations ?? [job.location])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [jobs, query, region]);

  return (
    <section className="drops-directory" aria-labelledby="drops-directory-title">
      <div className="drops-page-intro">
        <span className="track-eyebrow">Software opportunities</span>
        <h1 id="drops-directory-title">Latest Internship Drops</h1>
        <p>
          Recently discovered software, engineering, data and technical
          internships—free to browse and linked directly to the employer.
        </p>
      </div>

      <div className="drops-toolbar">
        <label className="drops-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, role or location..."
          />
        </label>
        <div className="drops-toolbar-right">
          <div className="drops-region-toggle" role="group" aria-label="Filter by region">
            <button
              className={region === "usa" ? "active" : ""}
              type="button"
              onClick={() => setRegion("usa")}
              aria-pressed={region === "usa"}
            >
              USA
            </button>
            <button
              className={region === "global" ? "active" : ""}
              type="button"
              onClick={() => setRegion("global")}
              aria-pressed={region === "global"}
            >
              Global
            </button>
          </div>
          <span className="drops-count">
            {loading
              ? "Checking for new internships…"
              : `Showing ${filteredJobs.length} ${region === "usa" ? "USA" : "global"} internship${filteredJobs.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {!isLive && !loading && (
        <div className="drops-setup-note">
          Live syncing is ready to connect. Showing curated roles until the AWS
          internship API is deployed.
        </div>
      )}

      <div className="drops-results">
        {filteredJobs.map((job) => (
          <article className="drops-result-card" key={job.id}>
            <CompanyLogo
              company={job.company}
              website={job.companyWebsite}
              className="drops-result-logo"
            />

            <div className="drops-result-content">
              <span>{job.company}</span>
              <h2>{job.title}</h2>
              <div className="drops-result-meta">
                <span>{job.location}</span>
                <span>{relativeTime(job.firstSeenAt)}</span>
              </div>
            </div>

            <a
              className="drops-apply-button"
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Apply <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}

        {filteredJobs.length === 0 && (
          <div className="empty-state drops-empty-state">
            No {region === "usa" ? "USA" : "global"} software internships
            matched your search.
          </div>
        )}
      </div>
    </section>
  );
}
