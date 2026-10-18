export const careerTracks = ["software", "engineering", "finance", "medicine"] as const;

export type CareerTrack = (typeof careerTracks)[number];

export type InternshipDrop = {
  company: string;
  website: string;
  role: string;
  location: string;
  url: string;
};

type TrackContent = {
  label: string;
  shortLabel: string;
  description: string;
  subtext: string;
  searchPlaceholder: string;
  majors: readonly string[];
  recommendations: readonly string[];
  drops: readonly InternshipDrop[];
};

export const trackContent: Record<CareerTrack, TrackContent> = {
  software: {
    label: "Software",
    shortLabel: "Software internships",
    description:
      "Find software engineering, data, cybersecurity and technical internships without digging through unrelated listings.",
    subtext:
      "Curated job boards, GitHub lists, startup opportunities and technical recruiting resources.",
    searchPlaceholder: "Search software websites, repositories or keywords...",
    majors: ["Computer Science", "Data Science", "Cybersecurity", "Engineering"],
    recommendations: [
      "Simplify",
      "Built In",
      "2027 Software Engineering Internship & New Grad Positions",
      "Summer 2027 Internships",
      "Wellfound",
    ],
    drops: [
      {
        company: "Microsoft",
        website: "https://www.microsoft.com",
        role: "Software & engineering internships",
        location: "United States",
        url: "https://careers.microsoft.com/v2/global/en/students",
      },
      {
        company: "Capital One",
        website: "https://www.capitalone.com",
        role: "Technology internship programs",
        location: "United States — multiple locations",
        url: "https://www.capitalonecareers.com/internships",
      },
      {
        company: "Duolingo",
        website: "https://www.duolingo.com",
        role: "University software roles",
        location: "Pittsburgh & New York",
        url: "https://careers.duolingo.com/",
      },
    ],
  },
  engineering: {
    label: "Engineering",
    shortLabel: "Engineering internships",
    description:
      "Find engineering internships and co-ops across mechanical, electrical, civil, chemical, aerospace and related disciplines.",
    subtext:
      "Fresh engineering roles, discipline-specific GitHub lists and student resources—kept separate from software-only listings and tools.",
    searchPlaceholder: "Search engineering websites, repositories or programs...",
    majors: ["Engineering"],
    recommendations: [
      "2027 Mechanical Engineering Internships",
      "Engineering Internships Summer 2027",
      "New Grad and Internships 2027",
      "SimplifyJobs Summer 2027 Internships",
      "NSF Research Experiences for Undergraduates",
    ],
    drops: [
      {
        company: "Boeing",
        website: "https://www.boeing.com",
        role: "Engineering internships and co-ops",
        location: "United States — multiple locations",
        url: "https://jobs.boeing.com/internships",
      },
      {
        company: "GE Aerospace",
        website: "https://www.geaerospace.com",
        role: "Engineering internships and co-ops",
        location: "United States — multiple locations",
        url: "https://careers.geaerospace.com/global/en/internships-co-ops",
      },
      {
        company: "Lockheed Martin",
        website: "https://www.lockheedmartin.com",
        role: "College engineering opportunities",
        location: "United States — multiple locations",
        url: "https://www.lockheedmartinjobs.com/college-students",
      },
    ],
  },
  finance: {
    label: "Finance",
    shortLabel: "Finance internships",
    description:
      "Find finance, banking, accounting and investment internships in one focused directory.",
    subtext:
      "Finance-first job boards, student programs and recruiting resources—without software interview tools mixed in.",
    searchPlaceholder: "Search finance websites, programs or keywords...",
    majors: ["Finance", "Business"],
    recommendations: [
      "eFinancialCareers",
      "Wall Street Oasis Jobs",
      "Handshake",
      "Forage",
      "LinkedIn Jobs",
    ],
    drops: [],
  },
  medicine: {
    label: "Medicine",
    shortLabel: "Medicine internships",
    description:
      "Find healthcare, biomedical research and public-health opportunities built for students.",
    subtext:
      "Medical and research programs stay separate from software job boards and coding-preparation tools.",
    searchPlaceholder: "Search medicine, healthcare or research resources...",
    majors: ["Healthcare", "Research"],
    recommendations: [
      "Health eCareers",
      "Public Health Jobs",
      "NSF Research Experiences for Undergraduates",
      "ORISE",
      "Pathways to Science",
    ],
    drops: [],
  },
};

export function isCareerTrack(value: string | null): value is CareerTrack {
  return careerTracks.includes(value as CareerTrack);
}
