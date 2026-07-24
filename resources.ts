export type Resource = {
  name: string;
  url: string;
  description: string;
  category: "Student" | "General" | "Tech" | "Startup" | "Remote" | "Government" | "Research" | "GitHub";
  regions: string[];
  tags: string[];
  featured?: boolean;
  free?: boolean;
};

export const resources: Resource[] = [
  { name: "Simplify", url: "https://simplify.jobs/internships", description: "Internship search, application autofill, recommendations, and tracking in one student-friendly platform.", category: "Student", regions: ["US", "Canada", "Remote"], tags: ["All majors", "Autofill", "Tracker"], featured: true, free: true },
  { name: "Handshake", url: "https://joinhandshake.com/", description: "College-focused recruiting platform with opportunities targeted to specific schools and student groups.", category: "Student", regions: ["US", "Global"], tags: ["Campus", "All majors", "Career fairs"], featured: true, free: true },
  { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/", description: "Large job marketplace combining internship listings, company research, alumni discovery, and networking.", category: "General", regions: ["Global"], tags: ["Networking", "All majors", "Alerts"], featured: true, free: true },
  { name: "Indeed", url: "https://www.indeed.com/", description: "Broad job search engine with a high volume of internship listings across locations and industries.", category: "General", regions: ["Global"], tags: ["High volume", "All majors", "Alerts"], free: true },
  { name: "Wellfound", url: "https://wellfound.com/jobs", description: "Startup-focused job marketplace where candidates can discover early-stage companies and often see compensation details.", category: "Startup", regions: ["Global", "Remote"], tags: ["Startups", "Tech", "Direct apply"], featured: true, free: true },
  { name: "Y Combinator Jobs", url: "https://www.ycombinator.com/jobs", description: "Open roles at startups backed by Y Combinator, including technical, product, design, and business internships.", category: "Startup", regions: ["US", "Global", "Remote"], tags: ["Startups", "High growth", "Tech"], free: true },
  { name: "WayUp", url: "https://www.wayup.com/", description: "Early-career platform centered on internships and entry-level roles for students and recent graduates.", category: "Student", regions: ["US"], tags: ["Early career", "All majors"], free: true },
  { name: "RippleMatch", url: "https://ripplematch.com/", description: "Candidate-matching platform that recommends early-career opportunities based on student profiles.", category: "Student", regions: ["US"], tags: ["Matching", "Early career"], free: true },
  { name: "Built In", url: "https://builtin.com/jobs/internships", description: "Technology-company listings with strong city, role, company-size, and remote-work filters.", category: "Tech", regions: ["US", "Remote"], tags: ["Tech", "Startups", "Company profiles"], free: true },
  { name: "Levels.fyi Jobs", url: "https://www.levels.fyi/jobs", description: "Technology roles paired with company and compensation context from the Levels.fyi ecosystem.", category: "Tech", regions: ["Global"], tags: ["Tech", "Compensation"], free: true },
  { name: "Dice", url: "https://www.dice.com/", description: "Technology-specific job board covering software, data, security, cloud, infrastructure, and related roles.", category: "Tech", regions: ["US"], tags: ["Tech", "Cybersecurity", "Data"], free: true },
  { name: "Remote OK", url: "https://remoteok.com/remote-internship-jobs", description: "Remote-first job board that occasionally includes internships and junior roles from global companies.", category: "Remote", regions: ["Global", "Remote"], tags: ["Remote", "Tech"], free: true },
  { name: "We Work Remotely", url: "https://weworkremotely.com/", description: "Established remote job board covering programming, design, support, sales, and marketing roles.", category: "Remote", regions: ["Global", "Remote"], tags: ["Remote", "Multiple fields"], free: true },
  { name: "USAJOBS Internships", url: "https://intern.usajobs.gov/", description: "Official federal internship portal for opportunities across United States government agencies.", category: "Government", regions: ["US"], tags: ["Federal", "Public service", "Official"], featured: true, free: true },
  { name: "GoGovernment Internship Finder", url: "https://gogovernment.org/federal-internship-finder/", description: "Centralized finder for professional and academic opportunities across federal agencies.", category: "Government", regions: ["US"], tags: ["Federal", "Guidance", "Students"], free: true },
  { name: "NSF REU Search", url: "https://www.nsf.gov/crssprgm/reu/reu_search.jsp", description: "Official directory of Research Experiences for Undergraduates in science and engineering fields.", category: "Research", regions: ["US"], tags: ["STEM", "Research", "Funded"], featured: true, free: true },
  { name: "Pathways to Science", url: "https://www.pathwaystoscience.org/", description: "Database of STEM research, internship, scholarship, and fellowship programs for students.", category: "Research", regions: ["US"], tags: ["STEM", "Research", "Fellowships"], free: true },
  { name: "Summer 2027 Tech Internships", url: "https://github.com/vanshb03/Summer2027-Internships", description: "Community-maintained list of Summer 2027 software, tech, product, and quantitative internships.", category: "GitHub", regions: ["US", "Canada", "Remote"], tags: ["Summer 2027", "Tech", "Community"], featured: true, free: true },
  { name: "Summer 2027 Internships — sndsh404", url: "https://github.com/sndsh404/summer-2027-internships", description: "Regularly updated list of software, data, ML, hardware, quant, and product internships in the US.", category: "GitHub", regions: ["US"], tags: ["Summer 2027", "Tech", "Open source"], free: true },
  { name: "Simplify New Grad Positions", url: "https://github.com/SimplifyJobs/New-Grad-Positions", description: "Community list of entry-level and new-graduate technical positions for students nearing graduation.", category: "GitHub", regions: ["US", "Canada", "Remote"], tags: ["New grad", "Tech", "Community"], free: true },
  { name: "Canadian Tech Internships", url: "https://github.com/jenndryden/Canadian-Tech-Internships-Summer-2026", description: "A focused repository for students searching for technology internships across Canada.", category: "GitHub", regions: ["Canada"], tags: ["Canada", "Tech", "Community"], free: true },
  { name: "European Tech Internships", url: "https://github.com/LorenzoLaCorte/summer-internships", description: "Community-curated internship opportunities across European technology companies.", category: "GitHub", regions: ["Europe"], tags: ["Europe", "Tech", "Community"], free: true },
  { name: "Glassdoor", url: "https://www.glassdoor.com/Job/internship-jobs-SRCH_KO0,10.htm", description: "Job listings supported by employee reviews, interview experiences, and salary information.", category: "General", regions: ["Global"], tags: ["Reviews", "Salary", "All majors"], free: true },
  { name: "Google Jobs", url: "https://www.google.com/search?q=internships+near+me&ibp=htl;jobs", description: "Search aggregator that surfaces internship postings from company sites and job platforms.", category: "General", regions: ["Global"], tags: ["Aggregator", "All majors"], free: true }
];
