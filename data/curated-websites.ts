// Owner-selected websites, ordered by approximate broad name recognition.
export const curatedWebsiteNames = [
  "LinkedIn Jobs",
  "Indeed",
  "Glassdoor",
  "Google Jobs",
  "ZipRecruiter",
  "Monster",
  "CareerBuilder",
  "Handshake",
  "Dice",
  "Built In",
  "Levels.fyi Jobs",
  "Simplify",
  "WayUp",
  "RippleMatch",
  "eFinancialCareers",
  "Remote OK",
  "Virtual Internships",
  "Extern",
  "Intern Dock",
] as const;

const recognitionRank = new Map<string, number>(curatedWebsiteNames.map((name, index) => [name, index]));
export function compareCuratedWebsites(a: { name: string }, b: { name: string }) {
  return (recognitionRank.get(a.name) ?? Infinity) - (recognitionRank.get(b.name) ?? Infinity) || a.name.localeCompare(b.name);
}
