import Link from "next/link";
import { pageMetadata } from "../../lib/seo";
export const metadata = pageMetadata("Software Internships & Co-ops | WantAnInternship", "Find software internships and co-ops, browse fresh opportunities, and explore curated internship websites with WantAnInternship.", "/software-internships");
export default function Page() { return <main className="search-landing">
  <Link href="/">WantAnInternship</Link>
  <h1>Find your next software internship.</h1>
  <p>Explore software engineering, frontend, backend, data science, AI and machine learning, cybersecurity, and cloud roles. WantAnInternship brings fresh postings and recommended websites together so you can spend more time applying.</p>
  <div className="search-actions"><Link href="/latest-drops?track=software">Browse latest internships</Link><Link href="/directory?track=software">Explore recommended websites</Link></div>
  <h2>Find opportunities that fit</h2><p>Use the latest drops page to browse software opportunities and available filters. Check each listing for its location, internship or co-op format, and the employer’s eligibility requirements before applying.</p>
  <h2>Keep your applications organized</h2><p>Create an account to save opportunities and track your applications. Some features require a subscription; you can review current access and trial details on the subscription page.</p>
  <h2>Check the details before you apply</h2><p>Posting dates can be unavailable, so some dates reflect when a role was discovered. Open the application link to confirm that a position is still accepting applications and review graduation dates, skills and work authorization requirements.</p>
  <p><Link href="/tools">Explore resume and interview tools</Link> · <Link href="/subscription">Subscription details</Link></p>
  <footer className="seo-footer"><Link href="/">Home</Link><Link href="/privacy">Privacy & analytics</Link></footer>
</main>; }
