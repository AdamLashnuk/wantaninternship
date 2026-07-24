import Directory from "../components/Directory";
import { resources } from "../data/resources";

export default function Home() {
  const githubCount = resources.filter((r) => r.category === "GitHub").length;
  const categories = new Set(resources.map((r) => r.category)).size;

  return (
    <main>
      <nav className="nav shell">
        <a className="logo" href="#top"><span className="logo-icon">ID</span><span>InternDock</span></a>
        <div className="nav-links"><a href="#directory">Directory</a><a href="#playbook">Playbook</a><a href="#submit">Submit</a></div>
        <a className="nav-cta" href="#directory">Explore resources</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="announcement"><span>New</span> Summer 2027 repositories are live <b>→</b></div>
          <h1>Every place you should be searching for <em>internships.</em></h1>
          <p>Stop relying on one job board. Discover the best internship platforms, GitHub repositories, startup boards, research programs, and government portals—all in one place.</p>
          <div className="hero-actions"><a className="primary-btn" href="#directory">Find resources <span>→</span></a><a className="secondary-btn" href="#playbook">See the playbook</a></div>
          <div className="proof"><div className="avatars"><span>S</span><span>H</span><span>G</span><span>W</span></div><p><strong>Curated for students,</strong><br/>not scraped for clicks.</p></div>
        </div>
        <div className="hero-panel" aria-label="Example internship stack">
          <div className="panel-head"><div><span className="tiny-label">YOUR SEARCH STACK</span><h3>Software Engineering · 2027</h3></div><span className="live-dot">● LIVE</span></div>
          <div className="stack-item"><span className="rank">01</span><div className="mini-logo purple">S</div><div><strong>Simplify</strong><small>Check daily · High volume</small></div><span className="arrow">↗</span></div>
          <div className="stack-item"><span className="rank">02</span><div className="mini-logo dark">GH</div><div><strong>Summer 2027 GitHub</strong><small>Check daily · Early listings</small></div><span className="arrow">↗</span></div>
          <div className="stack-item"><span className="rank">03</span><div className="mini-logo blue">in</div><div><strong>LinkedIn Jobs</strong><small>Alerts on · Network weekly</small></div><span className="arrow">↗</span></div>
          <div className="stack-item"><span className="rank">04</span><div className="mini-logo orange">Y</div><div><strong>YC Startup Jobs</strong><small>Check weekly · Startups</small></div><span className="arrow">↗</span></div>
          <div className="panel-foot"><span>4 of 8 recommended channels</span><div><i></i><i></i><i></i><i></i><i className="muted"></i><i className="muted"></i><i className="muted"></i><i className="muted"></i></div></div>
        </div>
      </section>

      <section className="stats-strip"><div className="shell stats"><div><strong>{resources.length}</strong><span>Curated resources</span></div><div><strong>{githubCount}</strong><span>GitHub repositories</span></div><div><strong>{categories}</strong><span>Search categories</span></div><div><strong>100%</strong><span>Free to explore</span></div></div></section>

      <div className="shell"><Directory /></div>

      <section className="playbook" id="playbook"><div className="shell">
        <div className="section-heading light"><div><span className="section-kicker">The playbook</span><h2>Search smarter, not just harder.</h2></div><p>A strong internship hunt uses several channels with different rhythms—not 100 applications on the same platform.</p></div>
        <div className="steps">
          <article><span>01</span><h3>Start with aggregators</h3><p>Use Simplify, LinkedIn, Handshake, and Indeed for broad daily coverage and saved searches.</p></article>
          <article><span>02</span><h3>Catch roles early</h3><p>Check community GitHub repositories before listings spread to every major job board.</p></article>
          <article><span>03</span><h3>Go directly to companies</h3><p>Build a target list and revisit company career pages for roles aggregators may miss.</p></article>
          <article><span>04</span><h3>Track every application</h3><p>Record the role, date, resume version, referral, stage, and next action immediately.</p></article>
        </div>
      </div></section>

      <section className="submit shell" id="submit"><div><span className="section-kicker">Community powered</span><h2>Know a resource we missed?</h2><p>InternDock gets better when students share useful boards, repositories, programs, and niche communities.</p></div><a href="mailto:hello@interndock.dev?subject=InternDock resource submission">Submit a resource <span>↗</span></a></section>

      <footer><div className="shell footer-inner"><a className="logo" href="#top"><span className="logo-icon">ID</span><span>InternDock</span></a><p>Built to make internship hunting less scattered.</p><span>© 2026 InternDock</span></div></footer>
    </main>
  );
}
