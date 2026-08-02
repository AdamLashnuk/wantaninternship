import ThemeToggle from "../../components/ThemeToggle";
import ToolDirectory from "../../components/ToolDirectory";

export default function ToolsPage() {
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/">
            WantanInternship
          </a>

          <nav className="main-nav tools-page-nav" aria-label="Tools navigation">
            <a href="/">Internship directory</a>
            <a href="#tools">Browse tools</a>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div className="container" id="top">
        <section className="tools-hero">
          <a className="back-link" href="/">
            <span aria-hidden="true">←</span>
            Back to internships
          </a>

          <p className="tools-hero-kicker">Student career toolkit</p>

          <h1>Tools to help you prepare, apply and interview</h1>

          <p className="tools-hero-description">
            Compare coding-practice platforms, mock interview tools, resume
            resources and application organizers. Each listing shows its pricing
            model so you can quickly find free and paid options.
          </p>

          <div className="community-status-meta tools-hero-meta">
            <span>Detailed descriptions</span>
            <span>Pricing labels</span>
            <span>Searchable categories</span>
          </div>
        </section>

        <ToolDirectory />

        <section className="contribute-section tools-submit-section">
          <div className="contribute-content">
            <div>
              <h2>Know another useful tool?</h2>

              <p>
                Send us the name, website, pricing model and a short description.
                We may include it in a future update.
              </p>
            </div>

            <a
              className="email-button"
              href="https://mail.google.com/mail/?view=cm&fs=1&to=wantaninternship@gmail.com&su=Tool%20submission%20for%20WantanInternship"
              target="_blank"
              rel="noreferrer"
            >
              Submit a tool
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}