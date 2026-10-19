import Link from "next/link";
import styles from "./page.module.css";

const drops = [
  ["2h ago", "Software Engineering Intern", "Stripe", "San Francisco, CA", "Stripe Careers"],
  ["3h ago", "Product Intern", "Figma", "New York, NY", "Figma Careers"],
  ["4h ago", "Data Science Intern", "Netflix", "Los Gatos, CA (Hybrid)", "Netflix Jobs"],
  ["5h ago", "Machine Learning Intern", "OpenAI", "San Francisco, CA", "OpenAI Careers"],
  ["6h ago", "Product Design Intern", "Canva", "Remote", "Canva Careers"],
  ["7h ago", "Quantitative Research Intern", "Jane Street", "New York, NY", "Jane Street"],
];

const lanes = [
  { name: "Software", mark: "</>", summary: "Developer-focused sources", sources: ["Simplify Jobs", "Pitt CSC", "Levels.fyi", "Wellfound"] },
  { name: "Finance", mark: "▥", summary: "Banking, markets, and quant", sources: ["eFinancialCareers", "Wall Street Oasis", "2027 Quant Internships", "Handshake"] },
  { name: "Medicine", mark: "+", summary: "Clinical and research paths", sources: ["Health eCareers", "Public Health Jobs", "NIH Pathways", "Handshake"] },
];

export default function OpportunityRadarMockup() {
  return (
    <main className={styles.page}>
      <a className={styles.skip} href="#latest">Skip to latest internships</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">WantAn<span>Internship</span></Link>
          <nav aria-label="Mockup navigation">
            <a href="#sources">Directory</a><Link href="/latest-drops">Latest Drops</Link><Link href="/tools">Career toolkit</Link><a href="#submit">Submit</a>
          </nav>
          <p>Free. No account. Direct to the source.</p>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <h1>Catch the opening while it&apos;s <span>fresh.</span></h1>
          <p>A free, no-account directory of internships from trusted sources, so you can go directly to the opportunity.</p>
        </section>

        <form className={styles.search} action="/latest-drops">
          <label><span className={styles.srOnly}>Search internships</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input name="q" placeholder="Search internships, companies, or keywords…" /></label>
          <label><span className={styles.srOnly}>Location</span><select name="location" defaultValue=""><option value="">Location</option><option>Remote</option><option>United States</option></select></label>
          <label><span className={styles.srOnly}>Internship type</span><select name="type" defaultValue=""><option value="">Internship type</option><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
          <button type="submit">Search internships <span aria-hidden="true">→</span></button>
        </form>

        <div className={styles.popular}><strong>Popular:</strong>{["Software Engineering", "Product", "Data Science", "Finance", "Medicine", "Remote"].map((item) => <button key={item} type="button">{item}</button>)}</div>

        <section className={styles.drops} id="latest">
          <div className={styles.sectionHead}><div><i aria-hidden="true"/><h2>Latest internship drops</h2><span>Newly posted from trusted sources</span></div><Link href="/latest-drops">View all latest drops <b aria-hidden="true">→</b></Link></div>
          <div className={styles.table} role="table" aria-label="Latest internship drops">
            <div className={styles.tableHead} role="row"><span>Posted</span><span>Role</span><span>Company</span><span>Location</span><span>Type</span><span>Source</span></div>
            {drops.map(([time, role, company, location, source]) => (
              <a className={styles.dropRow} href="#" role="row" key={role}>
                <time>{time}</time><strong>{role}</strong><span>{company}</span><span>{location}</span><span className={styles.type}>Internship</span><span className={styles.source}><i aria-hidden="true"/>Verified · {source}<b aria-hidden="true">↗</b></span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.lanes} id="sources" aria-label="Browse internship sources by career track">
          {lanes.map((lane) => <article className={styles.lane} key={lane.name}>
            <header><span className={styles.laneMark} aria-hidden="true">{lane.mark}</span><div><h2>{lane.name}</h2><p>{lane.summary}</p></div><Link href={`/?track=${lane.name.toLowerCase()}#directory`}>Browse all <b aria-hidden="true">→</b></Link></header>
            <ul>{lane.sources.map((source, index) => <li key={source}><span><i aria-hidden="true">{source.charAt(0)}</i>{source}</span><small>{index < 2 ? "Live" : "Regularly updated"}</small><b aria-hidden="true">↗</b></li>)}</ul>
          </article>)}
        </section>
      </div>
    </main>
  );
}
