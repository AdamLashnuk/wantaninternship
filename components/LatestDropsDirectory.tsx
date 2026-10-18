"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import {
  filterEngineeringOpportunities,
  filterInternships,
  formatLastRefresh,
  getRefreshStatus,
  type AreaFilter,
  type CategoryFilter,
  type DisciplineFilter,
  type OpportunityFilter,
  type PositionFilter,
} from "../lib/internship-filters";
import { formatOfficialPostDate } from "../lib/internship-dates";
import { sortInternshipsNewestFirst } from "../lib/internship-sorting";
import type { EngineeringDiscipline, InternshipJob, InternshipResponse, OpportunityTrack } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";
import styles from "./LatestDropsControls.module.css";

const CACHE_TTL = 5 * 60 * 1000;
const PAGE_SIZE = 250;

const disciplineOptions: { value: DisciplineFilter; label: string; shortLabel: string }[] = [
  { value: "all", label: "All Engineering", shortLabel: "All" },
  { value: "mechanical", label: "Mechanical Engineering", shortLabel: "Mechanical" },
  { value: "electrical", label: "Electrical & Electronics", shortLabel: "Electrical" },
  { value: "civil", label: "Civil & Construction", shortLabel: "Civil" },
  { value: "chemical", label: "Chemical & Process", shortLabel: "Chemical" },
  { value: "aerospace", label: "Aerospace Engineering", shortLabel: "Aerospace" },
  { value: "biomedical", label: "Biomedical Engineering", shortLabel: "Biomedical" },
  { value: "industrial-manufacturing", label: "Industrial & Manufacturing", shortLabel: "Industrial" },
  { value: "computer-hardware", label: "Computer & Hardware", shortLabel: "Computer / Hardware" },
  { value: "environmental", label: "Environmental Engineering", shortLabel: "Environmental" },
  { value: "materials", label: "Materials Engineering", shortLabel: "Materials" },
  { value: "nuclear", label: "Nuclear Engineering", shortLabel: "Nuclear" },
  { value: "robotics-mechatronics", label: "Robotics & Mechatronics", shortLabel: "Robotics" },
  { value: "other-engineering", label: "Other Engineering", shortLabel: "Other" },
];

function disciplineLabel(value?: EngineeringDiscipline) {
  return disciplineOptions.find((option) => option.value === value)?.label ?? "Engineering";
}

function getFallbackJobs(track: OpportunityTrack): InternshipJob[] {
  return trackContent[track].drops.map((drop, index) => ({
    id: `curated-${track}-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    opportunityType: "internship",
    positionType: "internship",
    softwareCategory: track === "software" ? "swe" : undefined,
    engineeringDiscipline: track === "engineering" ? "other-engineering" : undefined,
    track,
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
    "github:speedyapply-ai": "SpeedyApply AI GitHub",
    "github:vanshb03": "vanshb03 GitHub",
    "github:simplify": "Simplify GitHub",
    "github:sndsh404": "sndsh404 GitHub",
    "github:zshah101": "zshah101 GitHub",
    "github:simplify-engineering": "Simplify Engineering GitHub",
    "github:wonofakind-engineering": "WonOfAKind GitHub",
    "github:hiderrick-engineering": "hiderrick GitHub",
    "github:thebargon-engineering": "thebargon GitHub",
    curated: "Curated",
  };
  return names[source] ?? source;
}

type CachedPage = InternshipResponse & { cachedAt: number };

export default function LatestDropsDirectory({ track }: { track: OpportunityTrack }) {
  const cacheKey = `wantaninternship:latest-drops:${track}:v9`;
  const fallback = useMemo(() => getFallbackJobs(track), [track]);
  const [jobs, setJobs] = useState<InternshipJob[]>(fallback);
  const [keyword, setKeyword] = useState("");
  const [opportunity, setOpportunity] = useState<OpportunityFilter>("internship");
  const [area, setArea] = useState<AreaFilter>("usa");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [positionType, setPositionType] = useState<PositionFilter>("all");
  const [discipline, setDiscipline] = useState<DisciplineFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [nextCursor, setNextCursor] = useState<string>();
  const [totalJobs, setTotalJobs] = useState<number>();
  const [recentWeekJobs, setRecentWeekJobs] = useState<number>();
  const [retentionDays, setRetentionDays] = useState<number>();
  const [partial, setPartial] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setJobs(fallback);
    setIsLive(false);
    setLoading(true);

    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null") as CachedPage | null;
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL && Array.isArray(cached.jobs)) {
        setJobs(cached.jobs);
        setIsLive(cached.live);
        setUpdatedAt(cached.updatedAt);
        setNextCursor(cached.nextCursor);
        setTotalJobs(cached.totalJobs);
        setRecentWeekJobs(cached.recentWeekJobs);
        setRetentionDays(cached.retentionDays);
        setPartial(Boolean(cached.partial));
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem(cacheKey);
    }

    async function loadFirstPage() {
      try {
        const response = await fetch(`/api/internships?track=${track}&limit=${PAGE_SIZE}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Internship endpoint returned ${response.status}`);

        let payload = (await response.json()) as InternshipResponse;

        // Once the collector reports a bounded retention window, hydrate every
        // remaining page so search and dropdowns cover the complete recent feed.
        if (payload.retentionDays === 14 && payload.nextCursor) {
          const byId = new Map(payload.jobs.map((job) => [job.id, job]));
          const seenCursors = new Set<string>();
          let cursor: string | undefined = payload.nextCursor;
          let latestPage = payload;

          while (cursor && !seenCursors.has(cursor)) {
            seenCursors.add(cursor);
            const pageResponse = await fetch(
              `/api/internships?track=${track}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`,
              { signal: controller.signal },
            );
            if (!pageResponse.ok) throw new Error(`Internship endpoint returned ${pageResponse.status}`);
            latestPage = (await pageResponse.json()) as InternshipResponse;
            latestPage.jobs.forEach((job) => byId.set(job.id, job));
            cursor = latestPage.nextCursor;
          }

          payload = {
            ...payload,
            ...latestPage,
            jobs: [...byId.values()],
            nextCursor: cursor,
            updatedAt: latestPage.updatedAt ?? payload.updatedAt,
            totalJobs: latestPage.totalJobs ?? payload.totalJobs,
            recentWeekJobs: latestPage.recentWeekJobs ?? payload.recentWeekJobs,
            retentionDays: latestPage.retentionDays ?? payload.retentionDays,
          };
        }

        if (payload.jobs.length > 0) setJobs(payload.jobs);
        setIsLive(payload.live);
        setUpdatedAt(payload.updatedAt);
        setNextCursor(payload.nextCursor);
        setTotalJobs(payload.totalJobs);
        setRecentWeekJobs(payload.recentWeekJobs);
        setRetentionDays(payload.retentionDays);
        setPartial(Boolean(payload.partial));
        sessionStorage.setItem(cacheKey, JSON.stringify({ ...payload, cachedAt: Date.now() }));
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
  }, [cacheKey, fallback, track]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/internships?track=${track}&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`);
      if (!response.ok) throw new Error(`Internship endpoint returned ${response.status}`);
      const payload = (await response.json()) as InternshipResponse;
      setJobs((current) => {
        const byId = new Map(current.map((job) => [job.id, job]));
        payload.jobs.forEach((job) => byId.set(job.id, job));
        const merged = [...byId.values()];
        sessionStorage.setItem(cacheKey, JSON.stringify({
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
      setRecentWeekJobs(payload.recentWeekJobs ?? recentWeekJobs);
      setRetentionDays(payload.retentionDays ?? retentionDays);
      setPartial(Boolean(payload.partial));
    } catch (error) {
      console.error("Unable to load more internships", error);
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredJobs = useMemo(() => sortInternshipsNewestFirst(
    track === "engineering"
      ? filterEngineeringOpportunities(jobs, { keyword, positionType, area, discipline })
      : filterInternships(jobs, { keyword, opportunity, area, category }),
  ), [jobs, keyword, opportunity, area, category, positionType, discipline, track]);
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
        <span className="track-eyebrow">{track === "engineering" ? "Engineering opportunities" : "Software opportunities"}</span>
        <h1 id="drops-directory-title">Latest {track === "engineering" ? "Engineering" : "Internship"} Drops</h1>
        <p>
          {track === "engineering"
            ? "Engineering internships and co-ops across every major discipline, collected from trusted community lists and linked to the original posting."
            : "Software internships and new-grad roles from direct employer feeds and trusted community lists, normalized and linked straight to the employer."}
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

        {track === "engineering" ? (
          <select className={styles.select} value={positionType} onChange={(event) => setPositionType(event.target.value as PositionFilter)} aria-label="Engineering opportunity type">
            <option value="all">Internships & Co-ops</option>
            <option value="internship">Internships</option>
            <option value="co-op">Co-ops</option>
          </select>
        ) : (
          <select className={styles.select} value={opportunity} onChange={(event) => setOpportunity(event.target.value as OpportunityFilter)} aria-label="Opportunity type">
            <option value="internship">Internship</option>
            <option value="new-grad">New Grad</option>
            <option value="all">All opportunities</option>
          </select>
        )}

        <select className={styles.select} value={area} onChange={(event) => setArea(event.target.value as AreaFilter)} aria-label="Area">
          <option value="usa">USA</option>
          <option value="global">Global</option>
          <option value="remote">Remote</option>
        </select>

        {track === "engineering" ? (
          <select className={styles.select} value={discipline} onChange={(event) => setDiscipline(event.target.value as DisciplineFilter)} aria-label="Engineering discipline">
            {disciplineOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <select className={styles.select} value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} aria-label="Software category">
            <option value="all">All Software</option>
            <option value="swe">SWE</option>
            <option value="data-ai-ml">Data / AI / ML</option>
            <option value="cloud-devops">Cloud / DevOps</option>
            <option value="cybersecurity">Cybersecurity</option>
          </select>
        )}
      </div>

      {track === "engineering" && (
        <div className={styles.disciplinePanel} aria-label="Quick engineering discipline filters">
          <span className={styles.disciplineLabel}>Engineering discipline</span>
          <div className={styles.disciplineChips}>
            {disciplineOptions.map((option) => (
              <button
                className={`${styles.disciplineChip} ${discipline === option.value ? styles.disciplineChipActive : ""}`}
                key={option.value}
                type="button"
                onClick={() => setDiscipline(option.value)}
                aria-pressed={discipline === option.value}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.summary}>
        <span>
          {loading
            ? "Checking for new opportunities…"
            : `Showing ${filteredJobs.length} matching role${filteredJobs.length === 1 ? "" : "s"} from ${jobs.length} loaded · newest postings first`}
        </span>
        {isLive && typeof totalJobs === "number"
          ? (
              <span>
                {typeof recentWeekJobs === "number"
                  ? `${recentWeekJobs.toLocaleString()} posted in the past 7 days · `
                  : ""}
                {totalJobs.toLocaleString()} active roles from the past {retentionDays ?? 14} days
              </span>
            )
          : area === "global" && <span>Global includes USA and international roles</span>}
      </div>

      {!isLive && !loading && (
        <div className="drops-setup-note">
          Hourly AWS syncing is not connected. Showing a limited direct-employer
          fallback until the opportunity API is connected.
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
                  <span>{track === "engineering" ? (job.positionType === "co-op" ? "Co-op" : "Internship") : (job.opportunityType === "new-grad" ? "New Grad" : "Internship")}</span>
                  {track === "engineering" && <span>{disciplineLabel(job.engineeringDiscipline)}</span>}
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
            No {track} opportunities matched these filters.
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
        {track === "engineering" ? (
          <p>
            Engineering discovery comes from{" "}
            <a href="https://github.com/SimplifyJobs/Summer2027-Internships" target="_blank" rel="noreferrer">SimplifyJobs</a>,{" "}
            <a href="https://github.com/WonOfAKind/New-Grad-And-Internships-2027" target="_blank" rel="noreferrer">WonOfAKind</a>,{" "}
            <a href="https://github.com/hiderrick/Engineering-Internships-Summer-2027" target="_blank" rel="noreferrer">hiderrick</a> and{" "}
            <a href="https://github.com/thebargon/2027-Mechanical-Engineering-Internships" target="_blank" rel="noreferrer">thebargon</a>.
            Sources are checked hourly, normalized by discipline and deduplicated before display.
          </p>
        ) : (
          <p>
          Sources include direct Greenhouse, Lever and Ashby employer feeds plus discovery from{" "}
          <a href="https://github.com/speedyapply/2027-SWE-College-Jobs" target="_blank" rel="noreferrer">SpeedyApply</a>,{" "}
          <a href="https://github.com/vanshb03/Summer2027-Internships" target="_blank" rel="noreferrer">vanshb03</a> and{" "}
          <a href="https://github.com/SimplifyJobs/Summer2027-Internships" target="_blank" rel="noreferrer">SimplifyJobs</a>,{" "}
          <a href="https://github.com/sndsh404/summer-2027-internships" target="_blank" rel="noreferrer">sndsh404</a>,{" "}
          <a href="https://github.com/speedyapply/2027-AI-College-Jobs" target="_blank" rel="noreferrer">SpeedyApply AI</a> and{" "}
          <a href="https://github.com/zshah101/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships" target="_blank" rel="noreferrer">zshah101</a>.
          GitHub sources are checked hourly on the backend; every Apply button uses the original employer listing.
          </p>
        )}
      </aside>
    </section>
  );
}
