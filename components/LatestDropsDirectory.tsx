"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import {
  filterInternships,
  formatLastRefresh,
  getRefreshStatus,
  type AreaFilter,
  type CategoryFilter,
  type OpportunityFilter,
} from "../lib/internship-filters";
import { formatOfficialPostDate } from "../lib/internship-dates";
import type { InternshipJob, InternshipResponse } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";
import styles from "./LatestDropsControls.module.css";

const CACHE_KEY = "wantaninternship:latest-drops:v6";
const CACHE_TTL = 5 * 60 * 1000;
const PAGE_SIZE = 100;

function getFallbackJobs(): InternshipJob[] {
  return trackContent.software.drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    opportunityType: "internship",
    softwareCategory: "swe",
    location: drop.location,
    locations: [drop.location],
    applicationUrl: drop.url,
    applyUrl: drop.url,
    source: "curated",
    firstSeenAt: "",
    active: true,
  }));
}

function sourceName(source: string) {
  const names: Record<string, string> = {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    "github:speedyapply": "SpeedyApply GitHub",
    "github:vanshb03": "vanshb03 GitHub",
    "github:simplify": "Simplify GitHub",
    curated: "Curated",
  };
  return names[source] ?? source;
}

type CachedPage = InternshipResponse & { cachedAt: number };

export default function LatestDropsDirectory() {
  const fallback = useMemo(getFallbackJobs, []);
  const [jobs, setJobs] = useState<InternshipJob[]>(fallback);
  const [keyword, setKeyword] = useState("");
  const [opportunity, setOpportunity] = useState<OpportunityFilter>("all");
  const [area, setArea] = useState<AreaFilter>("usa");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [nextCursor, setNextCursor] = useState<string>();
  const [totalJobs, setTotalJobs] = useState<number>();
  const [partial, setPartial] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as CachedPage | null;
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL && Array.isArray(cached.jobs)) {
        setJobs(cached.jobs);
        setIsLive(cached.live);
        setUpdatedAt(cached.updatedAt);
        setNextCursor(cached.nextCursor);
        setTotalJobs(cached.totalJobs);
        setPartial(Boolean(cached.partial));
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem(CACHE_KEY);
    }

    async function loadFirstPage() {
      try {
        const response = await fetch(`/api/internships?track=software&limit=${PAGE_SIZE}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Internship endpoint returned ${response.status}`);

        const payload = (await response.json()) as InternshipResponse;
        if (payload.jobs.length > 0) setJobs(payload.jobs);
        setIsLive(payload.live);
        setUpdatedAt(payload.updatedAt);
        setNextCursor(payload.nextCursor);
        setTotalJobs(payload.totalJobs);
        setPartial(Boolean(payload.partial));
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, cachedAt: Date.now() }));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load internships", error);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadFirstPage();
    return () => controller.abort();
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/internships?track=software&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`);
      if (!response.ok) throw new Error(`Internship endpoint returned ${response.status}`);
      const payload = (await response.json()) as InternshipResponse;
      setJobs((current) => {
        const byId = new Map(current.map((job) => [job.id, job]));
        payload.jobs.forEach((job) => byId.set(job.id, job));
        const merged = [...byId.values()];
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          ...payload,
          jobs: merged,
          live: true,
          updatedAt: payload.updatedAt ?? updatedAt,
          totalJobs: payload.totalJobs ?? totalJobs,
          cachedAt: Date.now(),
        }));
        return merged;
      });
      setNextCursor(payload.nextCursor);
      setUpdatedAt(payload.updatedAt ?? updatedAt);
      setTotalJobs(payload.totalJobs ?? totalJobs);
      setPartial(Boolean(payload.partial));
    } catch (error) {
      console.error("Unable to load more internships", error);
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredJobs = useMemo(
    () => filterInternships(jobs, { keyword, opportunity, area, category }),
    [jobs, keyword, opportunity, area, category],
  );
  const remainingJobs = typeof totalJobs === "number" ? Math.max(totalJobs - jobs.length, 0) : undefined;
  const nextBatchSize = remainingJobs === undefined ? PAGE_SIZE : Math.min(PAGE_SIZE, remainingJobs);
  const refresh = loading
    ? { label: "Checking refresh status…" }
    : !isLive
      ? { label: "Hourly refresh not connected" }
      : !updatedAt
        ? { label: "Waiting for first AWS refresh" }
        : getRefreshStatus(updatedAt, now);

  return (
    <section className="drops-directory" aria-labelledby="drops-directory-title">
      <div className="drops-page-intro">
        <span className="track-eyebrow">Software opportunities</span>
        <h1 id="drops-directory-title">Latest Internship Drops</h1>
        <p>
          Software internships and new-grad roles from direct employer feeds and
          trusted community lists, normalized and linked straight to the employer.
        </p>
        <div className={styles.statusRow} aria-live="polite">
          <span className={styles.refresh}>{refresh.label}</span>
          <span>{formatLastRefresh(updatedAt)}</span>
          {partial && <span>Some sources are retrying</span>}
        </div>
      </div>

      <div className={styles.filterPanel} aria-label="Internship filters">
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search company, role or location"
            aria-label="Keyword search"
          />
        </label>

        <select className={styles.select} value={opportunity} onChange={(event) => setOpportunity(event.target.value as OpportunityFilter)} aria-label="Opportunity type">
          <option value="all">All opportunities</option>
          <option value="internship">Internship</option>
          <option value="new-grad">New Grad</option>
        </select>

        <select className={styles.select} value={area} onChange={(event) => setArea(event.target.value as AreaFilter)} aria-label="Area">
          <option value="usa">USA</option>
          <option value="global">Global</option>
          <option value="remote">Remote</option>
        </select>

        <select className={styles.select} value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} aria-label="Software category">
          <option value="all">All Software</option>
          <option value="swe">SWE</option>
          <option value="data-ai-ml">Data / AI / ML</option>
          <option value="cloud-devops">Cloud / DevOps</option>
          <option value="cybersecurity">Cybersecurity</option>
        </select>
      </div>

      <div className={styles.summary}>
        <span>
          {loading
            ? "Checking for new opportunities…"
            : `Showing ${filteredJobs.length} matching role${filteredJobs.length === 1 ? "" : "s"} from ${jobs.length} loaded`}
        </span>
        {isLive && typeof totalJobs === "number"
          ? <span>{totalJobs.toLocaleString()} active roles in the database</span>
          : area === "global" && <span>Global includes USA and international roles</span>}
      </div>

      {!isLive && !loading && (
        <div className="drops-setup-note">
          Hourly AWS syncing is not connected. Showing a limited direct-employer
          fallback until the internship API is connected.
        </div>
      )}

      <div className="drops-results">
        {filteredJobs.map((job) => {
          const locations = job.locations?.length ? job.locations : [job.location];
          return (
            <article className="drops-result-card" key={job.id}>
              <CompanyLogo company={job.company} website={job.companyWebsite} applicationUrl={job.applicationUrl} className="drops-result-logo" />

              <div className="drops-result-content">
                <span>{job.company}</span>
                <h2>{job.title}</h2>
                <div className="drops-result-meta">
                  <span className={styles.locationList} title={locations.join(", ")}>{locations.join(" • ")}</span>
                  <span>{formatOfficialPostDate(job.postedAt)}</span>
                  <span>{job.opportunityType === "new-grad" ? "New Grad" : "Internship"}</span>
                </div>
                <div className={styles.source}>
                  Source: {job.sourceUrl ? <a href={job.sourceUrl} target="_blank" rel="noreferrer">{sourceName(job.source)}</a> : sourceName(job.source)}
                </div>
              </div>

              <a className="drops-apply-button" href={job.applicationUrl || job.applyUrl} target="_blank" rel="noreferrer">
                Apply <span aria-hidden="true">↗</span>
              </a>
            </article>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="empty-state drops-empty-state">
            No software opportunities matched these filters.
          </div>
        )}
      </div>

      {nextCursor && (
        <div className={styles.loadMoreWrap}>
          <button className={styles.loadMore} type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : `Load ${nextBatchSize || PAGE_SIZE} more roles`}
          </button>
        </div>
      )}

      <aside className={styles.attribution}>
        <p>
          Sources include direct Greenhouse, Lever and Ashby employer feeds plus discovery from{" "}
          <a href="https://github.com/speedyapply/2027-SWE-College-Jobs" target="_blank" rel="noreferrer">SpeedyApply</a>,{" "}
          <a href="https://github.com/vanshb03/Summer2027-Internships" target="_blank" rel="noreferrer">vanshb03</a> and{" "}
          <a href="https://github.com/SimplifyJobs/Summer2027-Internships" target="_blank" rel="noreferrer">SimplifyJobs</a>.
          GitHub sources are checked hourly on the backend; every Apply button uses the original employer listing.
        </p>
      </aside>
    </section>
  );
}
