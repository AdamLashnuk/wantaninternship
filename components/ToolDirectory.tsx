"use client";

import { useMemo, useState } from "react";
import {
  pricingOptions,
  toolCategories,
  tools,
  type CareerTool,
  type ToolCategory,
  type ToolPricing,
} from "../data/tools";

type CategoryFilter = (typeof toolCategories)[number];
type PricingFilter = (typeof pricingOptions)[number];

function pricingClass(pricing: ToolPricing) {
  return `pricing-badge pricing-${pricing.toLowerCase()}`;
}

function ToolCard({ tool }: { tool: CareerTool }) {
  return (
    <article className="tool-card">
      <div className="tool-card-topline">
        <span className="tool-category-badge">{tool.category}</span>
        <span className={pricingClass(tool.pricing)}>{tool.pricing}</span>
      </div>

      <div className="tool-card-heading">
        <h2>{tool.name}</h2>
        {tool.featured && <span className="recommended-badge">Recommended</span>}
      </div>

      <p className="tool-description">{tool.description}</p>

      <div className="tool-best-for">
        <span>Best for</span>
        <strong>{tool.bestFor}</strong>
      </div>

      <ul className="tool-feature-list" aria-label={`${tool.name} features`}>
        {tool.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="tool-card-footer">
        <p>{tool.pricingNote}</p>

        <a href={tool.url} target="_blank" rel="noreferrer">
          Visit {tool.name}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export default function ToolDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [pricing, setPricing] = useState<PricingFilter>("All pricing");

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tools.filter((tool) => {
      const searchableText = [
        tool.name,
        tool.description,
        tool.category,
        tool.pricing,
        tool.pricingNote,
        tool.bestFor,
        ...tool.features,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      const matchesCategory =
        category === "All" || tool.category === (category as ToolCategory);

      const matchesPricing =
        pricing === "All pricing" || tool.pricing === (pricing as ToolPricing);

      return matchesQuery && matchesCategory && matchesPricing;
    });
  }, [category, pricing, query]);

  const hasActiveFilters =
    query.length > 0 || category !== "All" || pricing !== "All pricing";

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setPricing("All pricing");
  };

  return (
    <section className="tool-directory" id="tools" aria-label="Career tools">
      <div className="tool-filter-panel">
        <label className="tool-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools, features or use cases..."
            aria-label="Search career tools"
          />
        </label>

        <select
          value={pricing}
          onChange={(event) => setPricing(event.target.value as PricingFilter)}
          aria-label="Filter tools by pricing"
        >
          {pricingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="tool-category-filters" aria-label="Tool categories">
          {toolCategories.map((option) => (
            <button
              className={category === option ? "active" : ""}
              key={option}
              type="button"
              onClick={() => setCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="tools-results-summary">
        <span>
          Showing <strong>{filteredTools.length}</strong>{" "}
          {filteredTools.length === 1 ? "tool" : "tools"}
        </span>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filteredTools.length > 0 ? (
        <div className="tool-grid">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="empty-state tools-empty-state">
          <h2>No matching tools</h2>
          <p>Try another search term or remove one of the filters.</p>
          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}