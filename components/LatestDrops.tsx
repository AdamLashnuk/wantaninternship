import { trackContent, type CareerTrack } from "../data/tracks";

export default function LatestDrops({ track }: { track: CareerTrack }) {
  const content = trackContent[track];

  return (
    <aside className="latest-drops" aria-labelledby="latest-drops-title">
      <div className="latest-drops-heading">
        <span className="latest-drops-pulse" aria-hidden="true" />
        <div>
          <p>Fresh opportunities</p>
          <h2 id="latest-drops-title">Latest Internship Drops</h2>
        </div>
      </div>

      <div className="latest-drop-list">
        {content.drops.map((drop) => (
          <a
            className="latest-drop"
            href={drop.url}
            key={`${drop.company}-${drop.role}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="latest-drop-company">{drop.company}</span>
            <strong>{drop.role}</strong>
            <span className="latest-drop-location">{drop.location}</span>
            <span className="latest-drop-link" aria-hidden="true">
              View roles ↗
            </span>
          </a>
        ))}
      </div>

      <p className="latest-drops-note">
        Curated employer pages for {content.shortLabel.toLowerCase()}. Verify
        deadlines on the employer site.
      </p>
    </aside>
  );
}
