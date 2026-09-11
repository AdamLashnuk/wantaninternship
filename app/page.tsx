import Directory from "../components/Directory";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top">
            WantAnInternship
          </a>

          <nav className="main-nav" aria-label="Main navigation">
            <a href="#directory">Directory</a>
            <a href="/tools">Career toolkit</a>
            <a href="#research">Research</a>
            <a href="#government">Government</a>
            <a href="#submit">Submit</a>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div className="container" id="top">
        <section className="community-status">
          <p className="community-description">
            A curated collection of internship websites, GitHub repositories,
            job boards and student resources for internships, new-grad roles and
            research opportunities.
          </p>

          <p className="community-subtext">
            Built for students across majors, with deeper coverage for software
            engineering and technical recruiting.
          </p>

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

        <section className="tools-callout" aria-labelledby="tools-callout-title">
          <div className="tools-callout-content">
            <span className="tools-callout-eyebrow">Career toolkit</span>

            <h2 id="tools-callout-title">Prepare for the application process</h2>

            <p>
              Compare coding-practice platforms, AI mock interviewers, resume
              builders, application trackers and interview-preparation resources.
            </p>
          </div>

          <a className="tools-callout-link" href="/tools">
            Explore tools
            <span aria-hidden="true">→</span>
          </a>
        </section>

        <Directory />

        <section className="contribute-section" id="submit">
          <div className="contribute-content">
            <div>
              <h2>Know a resource we should add?</h2>

              <p>
                Send us a useful internship website, job board, GitHub repository,
                research program or student resource. You can also report a broken
                or outdated listing so the directory stays useful.
              </p>
            </div>

            <a
              className="email-button"
              href="mailto:wantaninternship@gmail.com?subject=Resource%20submission%20for%20WantAnInternship"
            >
              Submit a resource
            </a>
          </div>

          <div className="submission-details">
            <span>wantaninternship@gmail.com</span>

            <span>
              Include the resource name, link, description and supported majors.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
