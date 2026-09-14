import type { Metadata } from "next";
import LatestDropsDirectory from "../../components/LatestDropsDirectory";
import ThemeToggle from "../../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Latest Software Internship Drops | WantAnInternship",
  description:
    "Browse recently discovered software and technical internships, updated automatically and linked directly to employers.",
};

export default function LatestDropsPage() {
  return (
    <main className="track-page drops-page" data-track="software">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/?track=software">
            WantAnInternship
          </a>

          <nav className="main-nav drops-page-nav" aria-label="Main navigation">
            <a href="/?track=software#directory">Directory</a>
            <a className="active" href="/latest-drops">
              Latest Drops
            </a>
            <a href="/tools">Career toolkit</a>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div className="container">
        <LatestDropsDirectory />
      </div>
    </main>
  );
}
