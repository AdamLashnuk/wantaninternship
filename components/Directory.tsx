"use client";

import { useMemo, useState } from "react";
import {
  majors,
  resourceSections,
  resources,
  type Major,
  type Resource,
  type ResourceSection,
} from "../data/resources";

const sectionFilters = [
  "All",
  "Website",
  "GitHub Repository",
  "Tool",
  "Startup",
  "Research",
  "Government",
] as const;

type SectionFilter = (typeof sectionFilters)[number];

function isRecentlyUpdated(date: string) {
  const updatedDate = new Date(`${date}T00:00:00`);
  const today = new Date();

  const difference = today.getTime() - updatedDate.getTime();
  const daysSinceUpdate = difference / (1000 * 60 * 60 * 24);

  return daysSinceUpdate >= 0 && daysSinceUpdate <= 45;
}

function formatUpdatedDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function ResourceRow({ resource }: { resource: Resource }) {
  const recentlyUpdated = isRecentlyUpdated(resource.updatedAt);

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

          {recentlyUpdated && (
            <span className="updated-badge">Recently updated</span>
          )}

          {resource.featured && (
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
        <span>{resource.type}</span>
        <span>Updated {formatUpdatedDate(resource.updatedAt)}</span>

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
}: {
  section: ResourceSection;
  resources: Resource[];
}) {
  if (sectionResources.length === 0) {
    return null;
  }

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
        {sectionResources.map((resource) => (
          <ResourceRow key={`${section.type}-${resource.name}`} resource={resource} />
        ))}
      </div>
    </section>
  );
}

export default function Directory() {
  const [query, setQuery] = useState("");
  const [major, setMajor] = useState<Major | "All majors">("All majors");
  const [sectionFilter, setSectionFilter] =
    useState<SectionFilter>("All");
  const [recentOnly, setRecentOnly] = useState(false);

  const selectableMajors = useMemo(
    () => majors.filter((majorName) => majorName !== "All Majors"),
    [],
  );

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource) => {
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
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesMajor =
        major === "All majors" ||
        resource.majors.includes("All Majors") ||
        resource.majors.includes(major);

      const matchesSection =
        sectionFilter === "All" || resource.section === sectionFilter;

      const matchesRecentlyUpdated =
        !recentOnly || isRecentlyUpdated(resource.updatedAt);

      return (
        matchesQuery &&
        matchesMajor &&
        matchesSection &&
        matchesRecentlyUpdated
      );
    });
  }, [query, major, sectionFilter, recentOnly]);

  const groupedResources = useMemo(
    () =>
      resourceSections.map((section) => ({
        section,
        resources: filteredResources.filter(
          (resource) => resource.section === section.type,
        ),
      })),
    [filteredResources],
  );

  const hasActiveFilters =
    query.length > 0 ||
    major !== "All majors" ||
    sectionFilter !== "All" ||
    recentOnly;

  const clearFilters = () => {
    setQuery("");
    setMajor("All majors");
    setSectionFilter("All");
    setRecentOnly(false);
  };

  return (
    <div className="directory">
      <section className="filter-panel" aria-label="Resource filters">
        <div className="search-row">
          <label className="search-input">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search websites, tools, repositories or keywords..."
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
        </div>

        <div className="filter-row">
          <div className="filter-buttons">
            {sectionFilters.map((filter) => (
              <button
                className={sectionFilter === filter ? "active" : ""}
                key={filter}
                type="button"
                onClick={() => setSectionFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="recent-toggle">
            <input
              type="checkbox"
              checked={recentOnly}
              onChange={(event) => setRecentOnly(event.target.checked)}
            />

            <span>Recently updated only</span>
          </label>
        </div>
      </section>

      <div className="results-summary">
        <span>
          Showing <strong>{filteredResources.length}</strong> resources
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
          />
        ))
      ) : (
        <div className="empty-state">
          <h2>No matching resources</h2>

          <p>Try changing your search or removing one of the filters.</p>

          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
