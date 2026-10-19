import AccountMenu from "../../components/AccountMenu";
import type { Metadata } from "next";
import LatestDropsDirectory from "../../components/LatestDropsDirectory";
import ThemeToggle from "../../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Latest Internship & Engineering Drops | WantAnInternship",
  description:
    "Browse recently discovered software and engineering internships and co-ops, updated automatically and linked directly to employers.",
};

export default async function LatestDropsPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const params = await searchParams;
  const track = params.track === "engineering" ? "engineering" : "software";
  return (
    <main className="track-page drops-page" data-track={track}>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href={`/?track=${track}`}>
            WantAnInternship
          </a>

          <nav className="main-nav drops-page-nav" aria-label="Main navigation">
            <a href={`/directory?track=${track}#directory`}>Directory</a>
            <a className="latest-drops-nav-button active" aria-current="page" href={`/latest-drops?track=${track}`}>
              Latest Drops
            </a>
            {track === "software" && <a href="/tools">Career toolkit</a>}
          </nav>

          <ThemeToggle />

          <span className="position-context-label">
            {track === "engineering" ? "Engineering Positions" : "Tech Positions"}
          </span>
          <AccountMenu />
        </div>
      </header>

      <div className="container">
        <nav className="drops-track-switcher" aria-label="Opportunity field">
          <a className={track === "software" ? "active" : ""} href="/latest-drops?track=software">Software</a>
          <a className={track === "engineering" ? "active" : ""} href="/latest-drops?track=engineering">Engineering</a>
        </nav>
        <LatestDropsDirectory track={track} />
      </div>
    </main>
  );
}
