import AccountMenu from "../../../components/AccountMenu";
import Link from "next/link";
import HomeLatestDrops from "../../../components/HomeLatestDrops";
import styles from "./page.module.css";
import ThemeToggle from "../../../components/ThemeToggle";
import { resources } from "../../../data/resources";
import { careerTracks, trackContent } from "../../../data/tracks";

const lanes = careerTracks.map((track) => ({
  track,
  name: trackContent[track].label,
  mark: track === "software" ? "</>" : "⚙",
  summary: track === "software" ? "Developer-focused sources" : "Mechanical, electrical, civil and more",
  sources: resources
    .filter((resource) => resource.section === "Website" &&
      !new URL(resource.url).hostname.endsWith("github.com") &&
      (resource.majors.includes("All Majors") ||
        resource.majors.some((major) => trackContent[track].majors.includes(major))))
    .sort((a, b) => Number(trackContent[track].recommendations.includes(b.name)) -
      Number(trackContent[track].recommendations.includes(a.name)))
    .slice(0, 4),
}));

export default function OpportunityRadarMockup() {
  return (
    <main className={`track-page ${styles.page}`} data-track="software">
      <a className={styles.skip} href="#latest">Skip to latest internships</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">WantAn<span>Internship</span></Link>
          <nav aria-label="Main navigation">
            <Link href="/directory">Directory</Link><Link className={styles.latestButton} href="/latest-drops">Latest Drops</Link><Link href="/tools">Career toolkit</Link><Link href="/directory#submit">Submit</Link>
          </nav>
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <h1>Catch the opening while it&apos;s <span>fresh.</span></h1>
        </section>

        <HomeLatestDrops />

        <section className={styles.lanes} id="sources" aria-label="Browse internship sources by career track">
          {lanes.map((lane) => <article className={styles.lane} key={lane.name}>
            <header><span className={styles.laneMark} aria-hidden="true">{lane.mark}</span><div><h2>{lane.name}</h2><p>{lane.summary}</p></div><Link href={`/directory?track=${lane.track}#directory`}>Browse all <b aria-hidden="true">→</b></Link></header>
            <ul>{lane.sources.map((source, index) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><span><i aria-hidden="true">{source.name.charAt(0)}</i>{source.name}</span><small>{index < 2 ? "Live" : "Regularly updated"}</small><b aria-hidden="true">↗</b></a></li>)}</ul>
          </article>)}
        </section>
      </div>
    </main>
  );
}
