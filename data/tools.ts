export const toolCategories = [
  "All",
  "Coding Practice",
  "AI Mock Interviews",
  "Interview Preparation",
  "Resume Tools",
  "Application Tracking",
] as const;

export const pricingOptions = [
  "All pricing",
  "Free",
  "Freemium",
  "Paid",
] as const;

export type ToolCategory = Exclude<(typeof toolCategories)[number], "All">;
export type ToolPricing = Exclude<(typeof pricingOptions)[number], "All pricing">;

export type CareerTool = {
  name: string;
  url: string;
  description: string;
  category: ToolCategory;
  pricing: ToolPricing;
  pricingNote: string;
  bestFor: string;
  features: string[];
  featured?: boolean;
};

export const tools: CareerTool[] = [
  {
    name: "LeetCode",
    url: "https://leetcode.com/",
    description:
      "A large coding-interview practice platform covering algorithms, data structures, databases and company-style technical questions.",
    category: "Coding Practice",
    pricing: "Freemium",
    pricingNote: "Many problems are free; Premium adds company questions and extra features.",
    bestFor: "Technical interview practice",
    features: ["Problem library", "Contests", "Company topics"],
    featured: true,
  },
  {
    name: "NeetCode",
    url: "https://neetcode.io/",
    description:
      "Structured coding-interview roadmaps with curated problem lists, video explanations and guided practice paths.",
    category: "Coding Practice",
    pricing: "Freemium",
    pricingNote: "Core roadmaps and videos are free; additional courses require Pro.",
    bestFor: "Following a clear study plan",
    features: ["NeetCode 150", "Video solutions", "Topic roadmaps"],
    featured: true,
  },
  {
    name: "HackerRank",
    url: "https://www.hackerrank.com/",
    description:
      "Practice coding, SQL and problem-solving skills in a browser-based environment commonly used for hiring assessments.",
    category: "Coding Practice",
    pricing: "Free",
    pricingNote: "Candidate practice challenges are available for free.",
    bestFor: "Assessment-style practice",
    features: ["Coding challenges", "SQL practice", "Skill certifications"],
  },
  {
    name: "CodeSignal",
    url: "https://codesignal.com/learn/",
    description:
      "Interactive technical practice and learning paths that resemble the coding assessments used by many employers.",
    category: "Coding Practice",
    pricing: "Freemium",
    pricingNote: "Some learning and practice content is free; expanded access may be paid.",
    bestFor: "Preparing for online assessments",
    features: ["Assessment practice", "Learning paths", "Browser IDE"],
  },
  {
    name: "Codewars",
    url: "https://www.codewars.com/",
    description:
      "Community-driven programming challenges organized by difficulty, with solutions in many different languages.",
    category: "Coding Practice",
    pricing: "Free",
    pricingNote: "Core coding challenges and community solutions are free.",
    bestFor: "Daily coding repetition",
    features: ["Kata challenges", "Many languages", "Community solutions"],
  },
  {
    name: "interviewing.io",
    url: "https://interviewing.io/",
    description:
      "Practice technical interviews with experienced engineers through mock interviews, recordings and structured feedback.",
    category: "AI Mock Interviews",
    pricing: "Paid",
    pricingNote: "Professional mock interview sessions are paid.",
    bestFor: "Realistic technical mock interviews",
    features: ["Live mock interviews", "Engineer feedback", "Interview recordings"],
    featured: true,
  },
  {
    name: "Yoodli",
    url: "https://yoodli.ai/",
    description:
      "An AI speech coach that provides feedback on pacing, filler words, clarity and delivery during interview practice.",
    category: "AI Mock Interviews",
    pricing: "Freemium",
    pricingNote: "A free plan is available, with additional coaching features on paid plans.",
    bestFor: "Improving spoken interview delivery",
    features: ["Speech feedback", "Filler-word tracking", "Practice recordings"],
    featured: true,
  },
  {
    name: "Final Round AI",
    url: "https://www.finalroundai.com/",
    description:
      "AI-powered interview preparation with mock interviews, question practice and personalized feedback.",
    category: "AI Mock Interviews",
    pricing: "Freemium",
    pricingNote: "Limited features may be available free; full access requires a paid plan.",
    bestFor: "AI-guided interview rehearsal",
    features: ["Mock interviews", "Question generation", "Performance feedback"],
  },
  {
    name: "Google Interview Warmup",
    url: "https://grow.google/certificates/interview-warmup/",
    description:
      "A free interview-practice tool that records your responses and highlights common talking points and patterns.",
    category: "AI Mock Interviews",
    pricing: "Free",
    pricingNote: "Available free through Google Career Certificates resources.",
    bestFor: "Low-pressure answer practice",
    features: ["Recorded answers", "Response insights", "Common interview questions"],
  },
  {
    name: "Pramp",
    url: "https://www.pramp.com/",
    description:
      "Peer-to-peer mock interviews for algorithms, system design, behavioral questions and other technical topics.",
    category: "Interview Preparation",
    pricing: "Free",
    pricingNote: "Peer mock interview sessions are free.",
    bestFor: "Practicing live with another candidate",
    features: ["Peer matching", "Live practice", "Multiple interview formats"],
    featured: true,
  },
  {
    name: "Exponent",
    url: "https://www.tryexponent.com/",
    description:
      "Interview courses, question banks and mock interview resources for software, product, data and business roles.",
    category: "Interview Preparation",
    pricing: "Freemium",
    pricingNote: "Some guides are free; full courses and premium resources require membership.",
    bestFor: "Role-specific interview preparation",
    features: ["Role-based courses", "Question banks", "Mock interviews"],
  },
  {
    name: "Tech Interview Handbook",
    url: "https://www.techinterviewhandbook.org/",
    description:
      "A free, open collection of technical interview study plans, coding guidance, behavioral advice and checklists.",
    category: "Interview Preparation",
    pricing: "Free",
    pricingNote: "The handbook and its core study resources are free.",
    bestFor: "Building an interview study plan",
    features: ["Study plans", "Coding guidance", "Behavioral advice"],
    featured: true,
  },
  {
    name: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    description:
      "A widely used open-source guide to scalable system design concepts, architecture patterns and interview questions.",
    category: "Interview Preparation",
    pricing: "Free",
    pricingNote: "Open-source GitHub repository.",
    bestFor: "System design interviews",
    features: ["Architecture concepts", "Practice questions", "Reference diagrams"],
  },
  {
    name: "Big Interview",
    url: "https://biginterview.com/",
    description:
      "A structured interview-training platform with lessons, practice questions and recorded mock interview exercises.",
    category: "Interview Preparation",
    pricing: "Paid",
    pricingNote: "Access is generally paid, though some universities provide student access.",
    bestFor: "Structured behavioral preparation",
    features: ["Video lessons", "Mock interviews", "Answer practice"],
  },
  {
    name: "Overleaf",
    url: "https://www.overleaf.com/",
    description:
      "A collaborative LaTeX editor with professional resume and CV templates that are especially useful for technical, academic and research applications.",
    category: "Resume Tools",
    pricing: "Freemium",
    pricingNote: "The core editor and many templates are free; premium collaboration features are paid.",
    bestFor: "Technical and academic resumes",
    features: ["LaTeX editor", "Resume templates", "Real-time collaboration"],
    featured: true,
  },
  {
    name: "Resume Worded",
    url: "https://resumeworded.com/",
    description:
      "Analyzes resumes and LinkedIn profiles, then provides suggestions for wording, impact, structure and recruiter readability.",
    category: "Resume Tools",
    pricing: "Freemium",
    pricingNote: "Basic feedback is limited; deeper analysis requires a paid plan.",
    bestFor: "Improving resume bullet points",
    features: ["Resume scoring", "Bullet feedback", "LinkedIn review"],
    featured: true,
  },
  {
    name: "Jobscan",
    url: "https://www.jobscan.co/",
    description:
      "Compares a resume with a job description and highlights keyword, formatting and applicant-tracking-system alignment.",
    category: "Resume Tools",
    pricing: "Freemium",
    pricingNote: "A limited number of scans may be free; expanded scanning is paid.",
    bestFor: "Tailoring resumes to job descriptions",
    features: ["ATS comparison", "Keyword matching", "Formatting checks"],
  },
  {
    name: "Teal Resume Builder",
    url: "https://www.tealhq.com/tools/resume-builder",
    description:
      "A resume builder designed around job applications, with guided sections, tailoring tools and role-specific keyword support.",
    category: "Resume Tools",
    pricing: "Freemium",
    pricingNote: "Core resume-building features are free; advanced tools require Teal+.",
    bestFor: "Building and tailoring multiple resumes",
    features: ["Resume builder", "Keyword assistance", "Multiple versions"],
  },
  {
    name: "Reactive Resume",
    url: "https://rxresu.me/",
    description:
      "An open-source resume builder with customizable layouts, easy editing and export options.",
    category: "Resume Tools",
    pricing: "Free",
    pricingNote: "The open-source resume builder is free to use.",
    bestFor: "Creating a clean resume quickly",
    features: ["Open source", "Custom layouts", "PDF export"],
  },
  {
    name: "Simplify Copilot",
    url: "https://simplify.jobs/copilot",
    description:
      "A browser extension that helps autofill job applications, organize applications and speed up repetitive form entry.",
    category: "Application Tracking",
    pricing: "Free",
    pricingNote: "Core autofill and application-tracking features are free.",
    bestFor: "Applying to many internships efficiently",
    features: ["Application autofill", "Job tracking", "Browser extension"],
    featured: true,
  },
  {
    name: "Huntr",
    url: "https://huntr.co/",
    description:
      "A visual job-application tracker with boards, contact tracking, notes, resume tools and application analytics.",
    category: "Application Tracking",
    pricing: "Freemium",
    pricingNote: "A free plan is available; advanced job-search features are paid.",
    bestFor: "Organizing an active job search",
    features: ["Application board", "Contact tracking", "Job notes"],
  },
  {
    name: "Teal Job Tracker",
    url: "https://www.tealhq.com/tools/job-tracker",
    description:
      "Tracks saved jobs, applications, interviews, contacts and follow-up tasks in one organized workspace.",
    category: "Application Tracking",
    pricing: "Freemium",
    pricingNote: "The core job tracker is free; advanced analysis and automation are paid.",
    bestFor: "Managing applications and follow-ups",
    features: ["Job tracking", "Follow-up reminders", "Contact management"],
  },
];