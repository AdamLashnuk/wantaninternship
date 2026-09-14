"use client";

import { useEffect, useState } from "react";
import Directory from "./Directory";
import LatestDrops from "./LatestDrops";
import ThemeToggle from "./ThemeToggle";
import {
  careerTracks,
  isCareerTrack,
  trackContent,
  type CareerTrack,
} from "../data/tracks";

const TRACK_STORAGE_KEY = "wantaninternship-career-track";

export default function HomeExperience() {
  const [track, setTrack] = useState<CareerTrack>("software");
  const content = trackContent[track];

  useEffect(() => {
    const urlTrack = new URLSearchParams(window.location.search).get("track");
    const storedTrack = window.localStorage.getItem(TRACK_STORAGE_KEY);
    const initialTrack = isCareerTrack(urlTrack)
      ? urlTrack
      : isCareerTrack(storedTrack)
        ? storedTrack
        : "software";

    setTrack(initialTrack);
  }, []);

  const changeTrack = (nextTrack: CareerTrack) => {
    setTrack(nextTrack);
    window.localStorage.setItem(TRACK_STORAGE_KEY, nextTrack);

    const url = new URL(window.location.href);
    url.searchParams.set("track", nextTrack);
    window.history.replaceState({}, "", url);
  };

  return (
    <main className="track-page" data-track={track}>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top">
            WantAnInternship
          </a>

          <label className="track-selector">
            <span className="track-selector-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M7 7h11l-3-3M17 17H6l3 3M18 7l-3 3M6 17l3-3" />
              </svg>
            </span>
            <span className="track-selector-content">
              <span className="track-selector-label">Career switcher</span>
              <select
                value={track}
                onChange={(event) => changeTrack(event.target.value as CareerTrack)}
                aria-label="Choose a career field"
              >
                {careerTracks.map((trackName) => (
                  <option key={trackName} value={trackName}>
                    {trackContent[trackName].label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <nav className="main-nav" aria-label="Main navigation">
            <a href="#directory">Directory</a>
            {track === "software" && (
              <a className="latest-drops-nav-button" href="/latest-drops">
                Latest Drops
              </a>
            )}
            {track === "software" && <a href="/tools">Career toolkit</a>}
            <a href="#submit">Submit</a>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div
        className={`container home-layout ${track === "software" ? "" : "home-layout-single"}`}
        id="top"
      >
        <div className="home-main-column">
          <section className="community-status">
            <span className="track-eyebrow">{content.label} internships</span>
            <h1 className="community-description">{content.description}</h1>
            <p className="community-subtext">{content.subtext}</p>

            <div className="community-status-meta">
              <span>
                <span className="status-dot" aria-hidden="true" />
                Actively maintained
              </span>
              <span>Free to use</span>
              <span>Community curated</span>
              <span>No account required</span>
            </div>
          </section>

          {track === "software" && (
            <section
              className="tools-callout"
              aria-labelledby="tools-callout-title"
            >
              <div className="tools-callout-content">
                <span className="tools-callout-eyebrow">Software career toolkit</span>
                <h2 id="tools-callout-title">Prepare for technical interviews</h2>
                <p>
                  Compare coding-practice platforms, AI mock interviewers, resume
                  builders, application trackers and technical interview resources.
                </p>
              </div>

              <a className="tools-callout-link" href="/tools">
                Explore tools
                <span aria-hidden="true">→</span>
              </a>
            </section>
          )}

          <Directory track={track} />

          <section className="contribute-section" id="submit">
            <div className="contribute-content">
              <div>
                <h2>Know a {content.label.toLowerCase()} resource we should add?</h2>
                <p>
                  Send us a useful internship website, job board, program or
                  student resource. You can also report a broken or outdated listing.
                </p>
              </div>

              <a
                className="email-button"
                href={`mailto:wantaninternship@gmail.com?subject=${content.label}%20resource%20submission%20for%20WantAnInternship`}
              >
                Submit a resource
              </a>
            </div>

            <div className="submission-details">
              <span>wantaninternship@gmail.com</span>
              <span>Include the resource name, link and a short description.</span>
            </div>
          </section>
        </div>

        {track === "software" && (
          <div className="latest-drops-column">
            <LatestDrops />
          </div>
        )}
      </div>
    </main>
  );
}
