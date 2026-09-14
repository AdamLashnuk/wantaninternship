export const careerTracks = ["software", "finance", "medicine"] as const;

export type CareerTrack = (typeof careerTracks)[number];

export type InternshipDrop = {
  company: string;
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
        role: "Software & engineering internships",
        location: "United States",
        url: "https://careers.microsoft.com/v2/global/en/students",
      },
      {
        company: "Capital One",
        role: "Technology internship programs",
        location: "Multiple locations",
        url: "https://www.capitalonecareers.com/internships",
      },
      {
        company: "Duolingo",
        role: "University software roles",
        location: "Pittsburgh & New York",
        url: "https://careers.duolingo.com/",
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
