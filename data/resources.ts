export const majors = [
    "All Majors",
  "Computer Science",
  "Data Science",
  "Cybersecurity",
  "Engineering",
  "Business",
  "Finance",
  "Design",
  "Marketing",
  "Healthcare",
  "Research",
] as const;

export type Major = (typeof majors)[number];

export type ResourceType =
  | "Internship platform"
  | "Job board"
  | "University platform"
  | "GitHub list"
  | "Startup job board"
  | "Research directory"
  | "Government portal"
  | "Coding practice"
  | "Interview preparation"
  | "AI mock interview"
  | "Resume tool";

export type SectionType =
  | "Website"
  | "GitHub Repository"
  | "Tool"
  | "Startup"
  | "Research"
  | "Government";

export type Resource = {
  name: string;
  url: string;
  description: string;
  type: ResourceType;
  section: SectionType;
  majors: Major[];
  regions: string[];
  keywords: string[];
  updatedAt: string;
  featured?: boolean;
};

export type ResourceSection = {
  title: string;
  description: string;
  type: SectionType;
  anchor: string;
};

export const resourceSections: ResourceSection[] = [
  {
    title: "Internship Websites",
    description:
      "General and student-focused websites for discovering internship opportunities.",
    type: "Website",
    anchor: "websites",
  },
  {
    title: "GitHub Repositories",
    description:
      "Community-maintained repositories containing internship and new graduate listings.",
    type: "GitHub Repository",
    anchor: "repositories",
  },
  {
    title: "Career & Interview Tools",
    description:
      "Coding practice, mock interviews, resume feedback and technical interview preparation resources.",
    type: "Tool",
    anchor: "tools",
  },
  {
    title: "Startup Opportunities",
    description:
      "Job boards focused on startups, venture-backed companies and smaller teams.",
    type: "Startup",
    anchor: "startups",
  },
  {
    title: "Research Programs",
    description:
      "Resources for finding university, laboratory and academic research opportunities.",
    type: "Research",
    anchor: "research",
  },
  {
    title: "Government Opportunities",
    description:
      "Government internship portals and public-sector student programs.",
    type: "Government",
    anchor: "government",
  },
];

export const resources: Resource[] = [
  {
    name: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs/",
    description:
      "Large job platform that combines internship listings, company research, alumni discovery and professional networking.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global", "Remote"],
    keywords: ["networking", "job alerts", "alumni", "company"],
    updatedAt: "2026-07-12",
    featured: true,
  },
  {
    name: "Indeed",
    url: "https://www.indeed.com/",
    description:
      "General-purpose job board with a large number of internship listings across many industries and locations.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global", "Remote"],
    keywords: ["general jobs", "internships", "job alerts"],
    updatedAt: "2026-06-25",
  },
  {
    name: "Glassdoor",
    url: "https://www.glassdoor.com/Job/internship-jobs-SRCH_KO0,10.htm",
    description:
      "Internship listings paired with company reviews, salary information and candidate interview experiences.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global"],
    keywords: ["salary", "company reviews", "interviews"],
    updatedAt: "2026-06-20",
  },
  {
    name: "Google Jobs",
    url: "https://www.google.com/search?q=internships+jobs",
    description:
      "Aggregates internship listings from company career pages and job boards directly within Google Search.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global", "Remote"],
    keywords: ["Google", "aggregator", "company careers", "job search"],
    updatedAt: "2026-07-24",
  },
  {
    name: "ZipRecruiter",
    url: "https://www.ziprecruiter.com/Jobs/Internship",
    description:
      "Large job marketplace with internship alerts, recommendations and opportunities across many industries.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["United States", "Remote"],
    keywords: ["job alerts", "general jobs", "internships"],
    updatedAt: "2026-07-21",
  },
  {
    name: "Monster",
    url: "https://www.monster.com/jobs/search?q=internship",
    description:
      "General job-search platform with internship and entry-level opportunities across a wide range of industries.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global"],
    keywords: ["general jobs", "entry level", "internships"],
    updatedAt: "2026-07-10",
  },
  {
    name: "CareerBuilder",
    url: "https://www.careerbuilder.com/jobs-internship",
    description:
      "General employment platform containing internships and early-career positions across the United States.",
    type: "Job board",
    section: "Website",
    majors: ["All Majors"],
    regions: ["United States"],
    keywords: ["general jobs", "early career", "internships"],
    updatedAt: "2026-07-08",
  },
  {
    name: "Handshake",
    url: "https://joinhandshake.com/",
    description:
      "College recruiting platform featuring internships, career fairs and opportunities targeted to specific universities.",
    type: "University platform",
    section: "Website",
    majors: ["All Majors"],
    regions: ["United States", "Global"],
    keywords: ["college", "university", "career fair", "campus recruiting"],
    updatedAt: "2026-07-18",
    featured: true,
  },
  {
    name: "Dice",
    url: "https://www.dice.com/",
    description:
      "Technology job board with software development, data, cybersecurity and engineering opportunities.",
    type: "Job board",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["United States", "Remote"],
    keywords: ["technology", "cybersecurity", "developer", "data"],
    updatedAt: "2026-06-10",
  },
  {
    name: "Built In",
    url: "https://builtin.com/jobs/internships",
    description:
      "Technology-focused job board covering software, data, design, product, cybersecurity and startup roles.",
    type: "Job board",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Design",
      "Marketing",
    ],
    regions: ["United States", "Remote"],
    keywords: ["technology", "software", "startup", "product"],
    updatedAt: "2026-07-15",
  },
  {
    name: "SimplifyJobs Summer 2027 Internships",
    url: "https://github.com/SimplifyJobs/Summer2027-Internships",
    description:
      "Community-maintained list of software engineering, data science, product, hardware and related internships.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Design",
    ],
    regions: ["United States", "Canada"],
    keywords: ["summer", "software engineering", "SWE", "daily updates"],
    updatedAt: "2026-07-24",
    featured: true,
  },
  {
    name: "Summer 2027 Internships",
    url: "https://github.com/vanshb03/Summer2027-Internships",
    description:
      "Internship repository focused on Summer 2027 opportunities for students in technical fields.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["United States", "Canada"],
    keywords: ["2027", "summer internships", "software engineering"],
    updatedAt: "2026-07-23",
    featured: true,
  },
  {
    name: "New Grad Positions",
    url: "https://github.com/SimplifyJobs/New-Grad-Positions",
    description:
      "Community-maintained collection of full-time opportunities for upcoming and recent university graduates.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Design",
    ],
    regions: ["United States", "Canada"],
    keywords: ["new graduate", "entry level", "full time"],
    updatedAt: "2026-07-24",
  },
  {
    name: "SpeedyApply College Jobs",
    url: "https://github.com/speedyapply/2026-SWE-College-Jobs",
    description:
      "Technical internship and new graduate listings organized for university students.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["United States", "Canada"],
    keywords: ["software", "college", "internship", "new grad"],
    updatedAt: "2026-07-20",
  },
  {
    name: "Canadian Tech Internships",
    url: "https://github.com/jenndryden/Canadian-Tech-Internships-Summer-2026",
    description:
      "Internship listings focused on Canadian software, engineering and technology opportunities.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["Canada"],
    keywords: ["Canada", "technology", "software internship"],
    updatedAt: "2026-07-05",
  },
  {
    name: "2027 Software Engineering Internship & New Grad Positions",
    url: "https://github.com/speedyapply/2027-SWE-College-Jobs",
    description:
      "Daily-updated collection of 2027 software engineering internships and new graduate roles for college students.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["United States", "Canada"],
    keywords: ["2027", "software engineering", "internship", "new grad"],
    updatedAt: "2026-08-02",
    featured: true,
  },
  {
    name: "Summer 2027 and Off-Season Tech Internships",
    url: "https://github.com/sndsh404/summer-2027-internships",
    description:
      "Regularly updated list of Summer 2027 and off-season software, data, machine learning, hardware and product internships.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["United States"],
    keywords: ["2027", "off-season", "AI", "machine learning", "SWE"],
    updatedAt: "2026-08-02",
  },
  {
    name: "2027 Mechanical Engineering Internships",
    url: "https://github.com/thebargon/2027-Mechanical-Engineering-Internships",
    description:
      "Structured tracker for mechanical, manufacturing, aerospace, thermal and closely related internships and co-ops.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: ["Engineering"],
    regions: ["United States"],
    keywords: ["mechanical", "manufacturing", "aerospace", "thermal", "co-op"],
    updatedAt: "2026-10-17",
    featured: true,
  },
  {
    name: "Engineering Internships Summer 2027",
    url: "https://github.com/hiderrick/Engineering-Internships-Summer-2027",
    description:
      "Frequently refreshed engineering list covering mechanical, electrical, hardware, robotics, manufacturing and aerospace roles.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: ["Engineering"],
    regions: ["United States", "Canada"],
    keywords: ["engineering", "hardware", "robotics", "manufacturing", "2027"],
    updatedAt: "2026-10-17",
    featured: true,
  },
  {
    name: "New Grad and Internships 2027",
    url: "https://github.com/WonOfAKind/New-Grad-And-Internships-2027",
    description:
      "Large structured board with engineering roles tagged across mechanical, electrical, aerospace, manufacturing and other disciplines.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: ["Engineering"],
    regions: ["United States", "Canada"],
    keywords: ["mechanical", "electrical", "aerospace", "industrial", "new grad"],
    updatedAt: "2026-10-16",
    featured: true,
  },
  {
    name: "LeetCode",
    url: "https://leetcode.com/",
    description:
      "Large coding-practice platform with algorithm problems, company-tagged questions, contests and interview study plans.",
    type: "Coding practice",
    section: "Tool",
    majors: ["Computer Science", "Data Science", "Engineering"],
    regions: ["Global", "Online"],
    keywords: ["algorithms", "data structures", "coding interview", "DSA"],
    updatedAt: "2026-08-02",
    featured: true,
  },
  {
    name: "NeetCode",
    url: "https://neetcode.io/",
    description:
      "Structured coding-interview roadmaps, video explanations, courses, practice problems and AI-driven interview practice.",
    type: "Interview preparation",
    section: "Tool",
    majors: ["Computer Science", "Data Science", "Engineering"],
    regions: ["Global", "Online"],
    keywords: ["NeetCode 150", "roadmap", "coding interview", "algorithms"],
    updatedAt: "2026-08-02",
    featured: true,
  },
  {
    name: "HackerRank",
    url: "https://www.hackerrank.com/",
    description:
      "Coding challenges and skill certifications covering algorithms, SQL, programming languages and interview preparation.",
    type: "Coding practice",
    section: "Tool",
    majors: ["Computer Science", "Data Science", "Engineering"],
    regions: ["Global", "Online"],
    keywords: ["coding challenges", "SQL", "certification", "assessment"],
    updatedAt: "2026-08-02",
  },
  {
    name: "CodeSignal",
    url: "https://codesignal.com/",
    description:
      "Technical assessment and coding-practice platform commonly used for internship and early-career hiring screens.",
    type: "Coding practice",
    section: "Tool",
    majors: ["Computer Science", "Data Science", "Engineering"],
    regions: ["Global", "Online"],
    keywords: ["technical assessment", "coding screen", "GCA", "practice"],
    updatedAt: "2026-08-02",
  },
  {
    name: "interviewing.io",
    url: "https://interviewing.io/",
    description:
      "Anonymous technical mock interviews with engineers plus an AI interviewer for coding and system-design practice.",
    type: "AI mock interview",
    section: "Tool",
    majors: ["Computer Science", "Data Science", "Engineering"],
    regions: ["Global", "Online"],
    keywords: ["mock interview", "AI interviewer", "system design", "FAANG"],
    updatedAt: "2026-08-02",
    featured: true,
  },
  {
    name: "Exponent Practice",
    url: "https://www.tryexponent.com/practice",
    description:
      "Peer-to-peer mock interview practice for software engineering, product, system design and other technology roles.",
    type: "Interview preparation",
    section: "Tool",
    majors: [
      "Computer Science",
      "Data Science",
      "Engineering",
      "Business",
      "Design",
    ],
    regions: ["Global", "Online"],
    keywords: ["peer mock interview", "system design", "product interview"],
    updatedAt: "2026-08-02",
  },
  {
    name: "Yoodli",
    url: "https://yoodli.ai/",
    description:
      "AI communication coach for practicing behavioral interviews, presentations and spoken answers with feedback.",
    type: "AI mock interview",
    section: "Tool",
    majors: ["All Majors"],
    regions: ["Global", "Online"],
    keywords: ["behavioral interview", "communication", "speech", "AI feedback"],
    updatedAt: "2026-08-02",
  },
  {
    name: "Big Interview",
    url: "https://biginterview.com/",
    description:
      "Interview-learning platform with practice questions, video mock interviews and structured preparation lessons.",
    type: "Interview preparation",
    section: "Tool",
    majors: ["All Majors"],
    regions: ["Global", "Online"],
    keywords: ["behavioral interview", "video interview", "practice questions"],
    updatedAt: "2026-08-02",
  },
  {
    name: "Resume Worded",
    url: "https://resumeworded.com/",
    description:
      "Resume and LinkedIn feedback tool that scores documents and suggests targeted improvements for job applications.",
    type: "Resume tool",
    section: "Tool",
    majors: ["All Majors"],
    regions: ["Global", "Online"],
    keywords: ["resume review", "ATS", "LinkedIn", "resume score"],
    updatedAt: "2026-08-02",
  },
  {
    name: "Wellfound",
    url: "https://wellfound.com/jobs",
    description:
      "Startup hiring platform featuring internships and full-time opportunities at early-stage and venture-backed companies.",
    type: "Startup job board",
    section: "Startup",
    majors: [
      "Computer Science",
      "Data Science",
      "Engineering",
      "Business",
      "Finance",
      "Design",
      "Marketing",
    ],
    regions: ["Global", "Remote"],
    keywords: ["startup", "venture capital", "remote"],
    updatedAt: "2026-07-16",
    featured: true,
  },
  {
    name: "Y Combinator Jobs",
    url: "https://www.ycombinator.com/jobs",
    description:
      "Job board containing opportunities at companies funded by the Y Combinator startup accelerator.",
    type: "Startup job board",
    section: "Startup",
    majors: [
      "Computer Science",
      "Data Science",
      "Engineering",
      "Business",
      "Design",
      "Marketing",
    ],
    regions: ["Global", "Remote"],
    keywords: ["YC", "startup", "venture backed"],
    updatedAt: "2026-07-21",
    featured: true,
  },
  {
    name: "Hacker News Who Is Hiring",
    url: "https://news.ycombinator.com/jobs",
    description:
      "Technology and startup job listings shared through the Hacker News community.",
    type: "Startup job board",
    section: "Startup",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
    ],
    regions: ["Global", "Remote"],
    keywords: ["hacker news", "startup", "software"],
    updatedAt: "2026-07-01",
  },
  {
    name: "NSF Research Experiences for Undergraduates",
    url: "https://www.nsf.gov/crssprgm/reu/",
    description:
      "Directory of funded research programs where undergraduate students work with university research teams.",
    type: "Research directory",
    section: "Research",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Healthcare",
      "Research",
    ],
    regions: ["United States"],
    keywords: ["REU", "undergraduate research", "NSF", "summer research"],
    updatedAt: "2026-07-10",
    featured: true,
  },
  {
    name: "Pathways to Science",
    url: "https://www.pathwaystoscience.org/",
    description:
      "Searchable directory of STEM internships, scholarships, fellowships and research programs.",
    type: "Research directory",
    section: "Research",
    majors: [
      "Computer Science",
      "Data Science",
      "Engineering",
      "Healthcare",
      "Research",
    ],
    regions: ["United States"],
    keywords: ["STEM", "research", "fellowships", "scholarships"],
    updatedAt: "2026-06-28",
  },
  {
    name: "ORISE",
    url: "https://orise.orau.gov/internships-fellowships/index.html",
    description:
      "Internships, fellowships and research opportunities with national laboratories and federal agencies.",
    type: "Research directory",
    section: "Research",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Healthcare",
      "Research",
    ],
    regions: ["United States"],
    keywords: ["laboratory", "federal research", "science", "fellowship"],
    updatedAt: "2026-07-14",
  },
  {
    name: "USAJOBS Students and Recent Graduates",
    url: "https://help.usajobs.gov/working-in-government/unique-hiring-paths/students",
    description:
      "Official portal for United States federal internships, Pathways programs and recent graduate opportunities.",
    type: "Government portal",
    section: "Government",
    majors: ["All Majors"],
    regions: ["United States"],
    keywords: ["federal", "government", "Pathways", "public sector"],
    updatedAt: "2026-07-09",
    featured: true,
  },
  {
    name: "Virtual Student Federal Service",
    url: "https://vsfs.state.gov/",
    description:
      "Remote internship program allowing students to support United States government agencies and diplomatic missions.",
    type: "Government portal",
    section: "Government",
    majors: [
      "All Majors",
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Business",
      "Design",
      "Marketing",
    ],
    regions: ["United States", "Remote"],
    keywords: ["virtual", "federal", "government", "remote"],
    updatedAt: "2026-07-03",
  },
  {
    name: "Levels.fyi Jobs",
    url: "https://www.levels.fyi/jobs",
    description:
      "Technology job board paired with company compensation and career-level information.",
    type: "Job board",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Design",
    ],
    regions: ["Global", "Remote"],
    keywords: ["technology", "compensation", "software engineering"],
    updatedAt: "2026-07-22",
  },
  {
    name: "Simplify",
    url: "https://simplify.jobs/internships",
    description:
      "Student-focused internship platform with job discovery, autofill, application tracking and personalized recommendations.",
    type: "Internship platform",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Engineering",
      "Business",
      "Finance",
    ],
    regions: ["United States", "Canada", "Remote"],
    keywords: ["autofill", "application tracker", "summer internship", "student"],
    updatedAt: "2026-07-22",
    featured: true,
  },
  {
    name: "WayUp",
    url: "https://www.wayup.com/",
    description:
      "Internship and entry-level job board built specifically for college students and recent graduates.",
    type: "Internship platform",
    section: "Website",
    majors: ["All Majors"],
    regions: ["United States"],
    keywords: ["students", "new grad", "early career"],
    updatedAt: "2026-06-30",
  },
  {
    name: "RippleMatch",
    url: "https://ripplematch.com/",
    description:
      "Early-career recruiting platform that matches students with internships and entry-level opportunities.",
    type: "Internship platform",
    section: "Website",
    majors: [
      "All Majors",
      "Computer Science",
      "Engineering",
      "Business",
      "Finance",
      "Marketing",
    ],
    regions: ["United States"],
    keywords: ["matching", "early career", "college students"],
    updatedAt: "2026-07-08",
  },
  {
    name: "eFinancialCareers",
    url: "https://www.efinancialcareers.com/",
    description:
      "Finance-focused job board covering banking, trading, investment management, quantitative finance and fintech.",
    type: "Job board",
    section: "Website",
    majors: [
      "Finance",
      "Business",
      "Computer Science",
      "Data Science",
    ],
    regions: ["Global"],
    keywords: ["investment banking", "quant", "trading", "fintech"],
    updatedAt: "2026-07-19",
    featured: true,
  },
  {
    name: "Remote OK",
    url: "https://remoteok.com/remote-internship-jobs",
    description:
      "Remote job board with opportunities in software, design, data, marketing and other online roles.",
    type: "Job board",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Cybersecurity",
      "Business",
      "Design",
      "Marketing",
    ],
    regions: ["Global", "Remote"],
    keywords: ["remote", "work from home", "technology"],
    updatedAt: "2026-07-23",
  },
  {
    name: "Virtual Internships",
    url: "https://www.virtualinternships.com/",
    description:
      "Platform connecting students with structured remote internship opportunities at organizations around the world.",
    type: "Internship platform",
    section: "Website",
    majors: ["All Majors"],
    regions: ["Global", "Remote"],
    keywords: ["virtual", "remote internship", "international"],
    updatedAt: "2026-07-20",
  },
  {
    name: "Extern",
    url: "https://www.extern.com/",
    description:
      "Remote externship platform offering project-based professional experiences with companies and organizations.",
    type: "Internship platform",
    section: "Website",
    majors: [
      "Computer Science",
      "Data Science",
      "Business",
      "Finance",
      "Design",
      "Marketing",
      "Healthcare",
      "Research",
    ],
    regions: ["United States", "Remote"],
    keywords: ["externship", "remote project", "professional experience"],
    updatedAt: "2026-07-21",
  },
  {
    name: "Intern Dock",
    url: "https://www.interndock.com/",
    description:
      "Student-focused internship platform with a searchable job board, application tracker and AI-powered career tools.",
    type: "Internship platform",
    section: "Website",
    majors: ["All Majors"],
    regions: ["United States", "Remote"],
    keywords: [
      "internship tracker",
      "job board",
      "application tracking",
      "AI career tools",
    ],
    updatedAt: "2026-08-02",
    featured: true,
  },
  {
    name: "Behance Jobs",
    url: "https://www.behance.net/joblist",
    description:
      "Creative job board featuring design, branding, illustration, photography and user-experience opportunities.",
    type: "Job board",
    section: "Website",
    majors: ["Design", "Marketing"],
    regions: ["Global", "Remote"],
    keywords: ["creative", "graphic design", "UX", "portfolio"],
    updatedAt: "2026-07-12",
  },
  {
    name: "Dribbble Jobs",
    url: "https://dribbble.com/jobs",
    description:
      "Design-focused job board for product design, user experience, graphic design and other creative roles.",
    type: "Job board",
    section: "Website",
    majors: ["Design", "Marketing"],
    regions: ["Global", "Remote"],
    keywords: ["design", "UX", "UI", "creative"],
    updatedAt: "2026-07-13",
  },
  {
    name: "InternPreneur",
    url: "https://internpreneur.net/",
    description:
      "International platform connecting students seeking internships with startups and business owners.",
    type: "Startup job board",
    section: "Startup",
    majors: [
      "Computer Science",
      "Data Science",
      "Engineering",
      "Business",
      "Finance",
      "Design",
      "Marketing",
    ],
    regions: ["Global", "Remote"],
    keywords: ["startup", "international", "remote"],
    updatedAt: "2026-07-23",
  },
  {
    name: "2027 Quant Internships",
    url: "https://github.com/northwesternfintech/2027QuantInternships",
    description:
      "Community-maintained repository focused on Summer 2027 quantitative finance internship opportunities.",
    type: "GitHub list",
    section: "GitHub Repository",
    majors: [
      "Finance",
      "Computer Science",
      "Data Science",
      "Engineering",
    ],
    regions: ["United States", "Global"],
    keywords: ["quant", "trading", "finance", "2027"],
    updatedAt: "2026-07-23",
    featured: true,
  },
];
