"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./DirectoryEnhancements.module.css";
import {
  majors,
  resourceSections,
  resources,
  type Major,
  type Resource,
  type ResourceSection,
} from "../data/resources";
import { trackContent, type CareerTrack } from "../data/tracks";

const sectionFilters = [
  "All",
  "Website",
  "GitHub Repository",
  "Tool",
  "Startup",
  "Research",
  "Government",
] as const;

const opportunityFilters = [
  "All opportunities",
  "Internships",
  "New grad",
  "Research",
] as const;

type SectionFilter = (typeof sectionFilters)[number];
type OpportunityFilter = (typeof opportunityFilters)[number];

const SAVED_RESOURCES_KEY = "wantaninternship-saved-resources";

function isRecentlyVerified(date: string) {
  const updatedDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  const difference = today.getTime() - updatedDate.getTime();
  const daysSinceUpdate = difference / (1000 * 60 * 60 * 24);

  return daysSinceUpdate >= 0 && daysSinceUpdate <= 45;
}

function formatVerifiedDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function resourceOpportunityTypes(resource: Resource) {
  const searchable = [
    resource.name,
    resource.description,
    resource.type,
    resource.section,
    ...resource.keywords,
  ]
    .join(" ")
    .toLowerCase();

  const types = new Set<Exclude<OpportunityFilter, "All opportunities">>();

  if (
    searchable.includes("new grad") ||
    searchable.includes("new graduate") ||
    searchable.includes("entry level") ||
    searchable.includes("entry-level")
  ) {
    types.add("New grad");
  }

  if (
    resource.section === "Research" ||
    searchable.includes("research") ||
    searchable.includes("reu")
  ) {
    types.add("Research");
  }

  if (
    searchable.includes("intern") ||
    resource.type === "Internship platform" ||
    resource.section === "Website" ||
    resource.section === "Startup" ||
    resource.section === "Government"
  ) {
    types.add("Internships");
  }

  return types;
}

function ResourceRow({
  resource,
  isSaved,
  isRecommended,
  onToggleSaved,
}: {
  resource: Resource;
  isSaved: boolean;
  isRecommended: boolean;
  onToggleSaved: (resource: Resource) => void;
}) {
  const recentlyVerified = isRecentlyVerified(resource.updatedAt);

  return (
    <article className="resource-row">
      <div className="resource-main">
        <div className="resource-title-line">
          <a
            className="resource-name"
            href={resource.url}
            target="_blank"
            rel="noreferrer"
          >
            {resource.name}
          </a>

          {recentlyVerified && (
            <span className="updated-badge">Verified recently</span>
          )}

          {isRecommended && (
            <span className="recommended-badge">Recommended</span>
          )}
        </div>

        <p>{resource.description}</p>

        <div className="tag-row">
          {resource.majors.map((majorName) => (
            <span className="tag major-tag" key={majorName}>
              {majorName}
            </span>
          ))}

          {resource.regions.map((region) => (
            <span className="tag" key={region}>
              {region}
            </span>
          ))}
        </div>
      </div>

      <div className="resource-details">
        <button
          className={`${styles.saveButton} ${isSaved ? styles.saveButtonActive : ""}`}
          type="button"
          onClick={() => onToggleSaved(resource)}
          aria-pressed={isSaved}
          aria-label={`${isSaved ? "Remove" : "Save"} ${resource.name}`}
        >
          <span aria-hidden="true">{isSaved ? "★" : "☆"}</span>
          {isSaved ? "Saved" : "Save"}
        </button>
        <span>{resource.type}</span>
        <span>Verified {formatVerifiedDate(resource.updatedAt)}</span>

        <a href={resource.url} target="_blank" rel="noreferrer">
          Visit
        </a>
      </div>
    </article>
  );
}

function DirectorySection({
  section,
  resources: sectionResources,
  savedUrls,
  recommendedNames,
  onToggleSaved,
  collapsed,
  onShowAll,
}: {
  section: ResourceSection;
  resources: Resource[];
  savedUrls: Set<string>;
  recommendedNames: Set<string>;
  onToggleSaved: (resource: Resource) => void;
  collapsed: boolean;
  onShowAll: () => void;
}) {
  if (sectionResources.length === 0) {
    return null;
  }

  const visibleResources = collapsed
    ? sectionResources.slice(0, 10)
    : sectionResources;

  return (
    <section className="directory-section" id={section.anchor}>
      <div className="section-header">
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>

        <span className="resource-count">
          {sectionResources.length}{" "}
          {sectionResources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      <div className="resource-list">
        {visibleResources.map((resource) => (
          <ResourceRow
            key={`${section.type}-${resource.name}`}
            resource={resource}
            isSaved={savedUrls.has(resource.url)}
            isRecommended={recommendedNames.has(resource.name)}
            onToggleSaved={onToggleSaved}
          />
        ))}
      </div>

      {collapsed && sectionResources.length > 10 && (
        <button className={styles.showAllButton} type="button" onClick={onShowAll}>
          View all {sectionResources.length} {section.title.toLowerCase()}
        </button>
      )}
    </section>
  );
}

export default function Directory({ track }: { track: CareerTrack }) {
  const [query, setQuery] = useState("");
  const [major, setMajor] = useState<Major | "All majors">("All majors");
  const [region, setRegion] = useState("All regions");
  const [opportunity, setOpportunity] =
    useState<OpportunityFilter>("All opportunities");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("All");
  const [recentOnly, setRecentOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const trackSettings = trackContent[track];
  const recommendedNames = useMemo(
    () => new Set(trackSettings.recommendations),
    [trackSettings.recommendations],
  );

  useEffect(() => {
    setQuery("");
    setMajor("All majors");
    setRegion("All regions");
    setOpportunity("All opportunities");
    setSectionFilter("All");
    setRecentOnly(false);
    setSavedOnly(false);
    setExpandedSections(new Set());
  }, [track]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_RESOURCES_KEY);
      if (stored) {
        setSavedUrls(new Set(JSON.parse(stored) as string[]));
      }
    } catch {
      setSavedUrls(new Set());
    }
  }, []);

  const selectableMajors = useMemo(
    () =>
      majors.filter(
        (majorName) =>
          majorName !== "All Majors" && trackSettings.majors.includes(majorName),
      ),
    [trackSettings.majors],
  );

  const trackResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (resource.section === "Tool") {
          return track === "software";
        }

        return (
          resource.majors.includes("All Majors") ||
          resource.majors.some((majorName) =>
            trackSettings.majors.includes(majorName),
          )
        );
      }),
    [track, trackSettings.majors],
  );

  const selectableRegions = useMemo(
    () =>
      Array.from(
        new Set(trackResources.flatMap((resource) => resource.regions)),
      ).sort((a, b) => a.localeCompare(b)),
    [trackResources],
  );

  const toggleSaved = (resource: Resource) => {
    setSavedUrls((current) => {
      const next = new Set(current);
      if (next.has(resource.url)) {
        next.delete(resource.url);
      } else {
        next.add(resource.url);
      }

      try {
        localStorage.setItem(SAVED_RESOURCES_KEY, JSON.stringify([...next]));
      } catch {
        // Saving is a convenience feature; filtering still works without storage.
      }

      return next;
    });
  };

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trackResources
      .filter((resource) => {
        const searchableText = [
          resource.name,
          resource.description,
          resource.section,
          resource.type,
          ...resource.majors,
          ...resource.regions,
          ...resource.keywords,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

        const matchesMajor =
          major === "All majors" ||
          resource.majors.includes("All Majors") ||
          resource.majors.includes(major);

        const matchesRegion =
          region === "All regions" || resource.regions.includes(region);

        const matchesOpportunity =
          opportunity === "All opportunities" ||
          resourceOpportunityTypes(resource).has(opportunity);

        const matchesSection =
          sectionFilter === "All" || resource.section === sectionFilter;

        const matchesRecentlyVerified =
          !recentOnly || isRecentlyVerified(resource.updatedAt);

        const matchesSaved = !savedOnly || savedUrls.has(resource.url);

        return (
          matchesQuery &&
          matchesMajor &&
          matchesRegion &&
          matchesOpportunity &&
          matchesSection &&
          matchesRecentlyVerified &&
          matchesSaved
        );
      })
      .sort(
        (a, b) =>
          Number(recommendedNames.has(b.name)) -
            Number(recommendedNames.has(a.name)) ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          b.updatedAt.localeCompare(a.updatedAt) ||
          a.name.localeCompare(b.name),
      );
  }, [
    query,
    major,
    region,
    opportunity,
    sectionFilter,
    recentOnly,
    savedOnly,
    savedUrls,
    trackResources,
    recommendedNames,
  ]);

  const groupedResources = useMemo(
    () =>
      resourceSections
        .filter(
          (section) =>
            (section.type !== "Tool" ||
              (track === "software" && sectionFilter === "Tool")) &&
            (track !== "finance" || section.type !== "Research"),
        )
        .map((section) => ({
          section,
          resources: filteredResources.filter(
            (resource) => resource.section === section.type,
          ),
        })),
    [filteredResources, sectionFilter, track],
  );

  const hasActiveFilters =
    query.length > 0 ||
    major !== "All majors" ||
    region !== "All regions" ||
    opportunity !== "All opportunities" ||
    sectionFilter !== "All" ||
    recentOnly ||
    savedOnly;

  const clearFilters = () => {
    setQuery("");
    setMajor("All majors");
    setRegion("All regions");
    setOpportunity("All opportunities");
    setSectionFilter("All");
    setRecentOnly(false);
    setSavedOnly(false);
    setExpandedSections(new Set());
  };

  return (
    <div className="directory" id="directory">
      <section className="filter-panel" aria-label="Resource filters">
        <div className={styles.filterGrid}>
          <label className="search-input">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={trackSettings.searchPlaceholder}
              aria-label="Search internship resources"
            />
          </label>

          <select
            value={major}
            onChange={(event) =>
              setMajor(event.target.value as Major | "All majors")
            }
            aria-label="Filter by major"
          >
            <option value="All majors">All majors</option>
            {selectableMajors.map((majorName) => (
              <option key={majorName} value={majorName}>
                {majorName}
              </option>
            ))}
          </select>

          <select
            value={opportunity}
            onChange={(event) =>
              setOpportunity(event.target.value as OpportunityFilter)
            }
            aria-label="Filter by opportunity type"
          >
            {opportunityFilters.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            aria-label="Filter by region"
          >
            <option value="All regions">All regions</option>
            {selectableRegions.map((regionName) => (
              <option key={regionName} value={regionName}>
                {regionName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <div className="filter-buttons">
            {sectionFilters
              .filter((filter) => track === "software" || filter !== "Tool")
              .map((filter) => (
              <button
                className={sectionFilter === filter ? "active" : ""}
                key={filter}
                type="button"
                onClick={() => setSectionFilter(filter)}
              >
                {filter === "Tool" ? "Career tools" : filter}
              </button>
              ))}
          </div>

          <div className={styles.toggleGroup}>
            <label className="recent-toggle">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(event) => setSavedOnly(event.target.checked)}
              />
              <span>Saved only</span>
            </label>

            <label className="recent-toggle">
              <input
                type="checkbox"
                checked={recentOnly}
                onChange={(event) => setRecentOnly(event.target.checked)}
              />
              <span>Verified recently</span>
            </label>
          </div>
        </div>
      </section>

      <div className="results-summary">
        <span>
          Showing <strong>{filteredResources.length}</strong> resources
          {savedUrls.size > 0 && (
            <span className={styles.savedCount}> · {savedUrls.size} saved</span>
          )}
        </span>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filteredResources.length > 0 ? (
        groupedResources.map(({ section, resources: sectionResources }) => (
          <DirectorySection
            key={section.type}
            section={section}
            resources={sectionResources}
            savedUrls={savedUrls}
            recommendedNames={recommendedNames}
            onToggleSaved={toggleSaved}
            collapsed={
              !hasActiveFilters &&
              !expandedSections.has(section.type) &&
              sectionResources.length > 10
            }
            onShowAll={() =>
              setExpandedSections((current) => {
                const next = new Set(current);
                next.add(section.type);
                return next;
              })
            }
          />
        ))
      ) : (
        <div className="empty-state">
          <h2>No matching resources</h2>
          <p>
            {savedOnly
              ? "You do not have any saved resources matching these filters yet."
              : "Try changing your search or removing one of the filters."}
          </p>
          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
