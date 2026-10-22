export type MatchingPreferences = {
  resumeText: string; resumeName: string; skills: string[]; roles: string[]; locations: string[];
  keywords: string[]; excludeKeywords: string[]; remoteOnly: boolean; track: 'software' | 'engineering' | 'both';
  minimumScore: number; matchEnabled: boolean; watchEnabled: boolean; watchlistMode: 'recommended' | 'custom' | 'both';
  companies: string[]; emailEnabled: boolean; frequency: 'daily' | 'hourly';
};
export type InternshipMatch = { id: string; company: string; title: string; location: string; applicationUrl: string; score: number; hasRequirements: boolean; matchedSkills: string[]; missingSkills: string[]; reasons: string[] };
export type MatchingState = { allowed: boolean; setupRequired?: boolean; error?: string; preferences?: MatchingPreferences; recommendedCompanies?: string[]; emailReady?: boolean; recipient?: string; results?: { checkedAt: string; matches: InternshipMatch[]; matchCount: number; checkedJobs: number; withRequirements: number; remainingChecks: number } | null; delivery?: { lastSentAt: string | null; lastError: string | null; uncertain: boolean; lastCheckedAt: string | null } };
