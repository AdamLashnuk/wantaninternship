import Directory from "../components/Directory";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top">
            WantanInternship
          </a>

          <nav className="main-nav" aria-label="Main navigation">
            <a href="#websites">Websites</a>
            <a href="#repositories">Repositories</a>
            <a href="#startups">Startups</a>
            <a href="#research">Research</a>
            <a href="#submit">Submit</a>
          </nav>
        </div>
      </header>

      <div className="container" id="top">
        <section className="community-status">
          <p className="community-description">
            A curated collection of internship websites, GitHub repositories,
            job boards and student resources.
          </p>

          <p className="community-subtext">
            Built for students and maintained by the community.
          </p>

          <div className="community-status-meta">
            <span>
              <span className="status-dot" aria-hidden="true" />
              Actively maintained
            </span>

            <span>Free to use</span>
            <span>Community curated</span>
          </div>
        </section>

        <Directory />

        <section className="contribute-section" id="submit">
          <div className="contribute-content">
            <div>
              <h2>Have an internship website?</h2>

              <p>
                Own or know about a useful internship website, job board,
                GitHub repository or student resource? Send it to us and we may
                add it to the directory.
              </p>
            </div>

            <a
              className="email-button"
              href="mailto:hello@wantaninternship.com?subject=Resource%20submission%20for%20WantanInternship"
            >
              Submit a resource
            </a>
          </div>

          <div className="submission-details">
            <span>hello@wantaninternship.com</span>

            <span>
              Include the resource name, link, description and supported majors.
            </span>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>WantanInternship</span>
          <span>Built and maintained by Adam Lashnuk</span>
        </div>
      </footer>
    </main>
  );
}