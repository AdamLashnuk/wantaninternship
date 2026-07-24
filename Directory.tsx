"use client";

import { useMemo, useState } from "react";
import { resources, type Resource } from "../data/resources";

const categories = ["All", "Student", "General", "Tech", "Startup", "Remote", "Government", "Research", "GitHub"] as const;

function ResourceCard({ resource }: { resource: Resource }) {
  const letter = resource.name.charAt(0).toUpperCase();
  return (
    <article className="resource-card">
      <div className="card-top">
        <div className="brand-mark">{letter}</div>
        <div className="card-title-wrap">
          <div className="eyebrow">{resource.category}</div>
          <h3>{resource.name}</h3>
        </div>
        {resource.featured && <span className="featured-pill">Top pick</span>}
      </div>
      <p>{resource.description}</p>
      <div className="tag-list">
        {resource.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="card-footer">
        <span className="regions">{resource.regions.join(" · ")}</span>
        <a href={resource.url} target="_blank" rel="noreferrer">Visit resource <span aria-hidden>↗</span></a>
      </div>
    </article>
  );
}

export default function Directory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [region, setRegion] = useState("All regions");

  const filtered = useMemo(() => resources.filter((resource) => {
    const haystack = `${resource.name} ${resource.description} ${resource.category} ${resource.tags.join(" ")} ${resource.regions.join(" ")}`.toLowerCase();
    const matchesSearch = haystack.includes(query.toLowerCase());
    const matchesCategory = category === "All" || resource.category === category;
    const matchesRegion = region === "All regions" || resource.regions.includes(region);
    return matchesSearch && matchesCategory && matchesRegion;
  }), [query, category, region]);

  return (
    <section className="directory" id="directory">
      <div className="section-heading">
        <div>
          <span className="section-kicker">The directory</span>
          <h2>Build your internship search stack.</h2>
        </div>
        <p>Use several channels at once. Every resource here has a clear purpose, audience, and region.</p>
      </div>

      <div className="search-panel">
        <label className="search-box">
          <span>⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search GitHub lists, job boards, research..." />
        </label>
        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
          <option>All regions</option><option>US</option><option>Canada</option><option>Europe</option><option>Global</option><option>Remote</option>
        </select>
      </div>

      <div className="category-row" aria-label="Resource categories">
        {categories.map((item) => (
          <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>

      <div className="result-row"><strong>{filtered.length}</strong> resources found</div>
      <div className="resource-grid">
        {filtered.map((resource) => <ResourceCard key={resource.name} resource={resource} />)}
      </div>
      {filtered.length === 0 && <div className="empty-state"><h3>No exact matches yet.</h3><p>Try another search or clear one of the filters.</p></div>}
    </section>
  );
}
