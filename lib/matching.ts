export type MatchingPreferences = {
  resumeText: string; resumeName: string; skills: string[]; roles: string[]; locations: string[];
  keywords: string[]; excludeKeywords: string[]; remoteOnly: boolean; track: 'software' | 'engineering' | 'both';
  minimumScore: number; matchEnabled: boolean; watchEnabled: boolean; watchlistMode: 'recommended' | 'custom' | 'both';
  companies: string[]; emailEnabled: boolean; frequency: 'daily' | 'hourly';
  deliveryChannel: 'email' | 'sms'; deliveryEmail: string; deliveryPhone: string; timesPerDay: number;
};
export type InternshipMatch = { id: string; company: string; title: string; location: string; applicationUrl: string; score: number; hasRequirements: boolean; matchedSkills: string[]; missingSkills: string[]; reasons: string[]; provisional?: boolean };
export type MatchingState = {
  allowed: boolean; featureVersion?: number; setupRequired?: boolean; error?: string; preferences?: MatchingPreferences;
  recommendedCompanies?: string[]; emailReady?: boolean; smsReady?: boolean; recipient?: string; verifiedEmail?: string; verifiedPhone?: string;
  request?: { requestId: string; mode: string; status: 'queued' | 'running' | 'complete' | 'failed'; message: string; requestedAt: string; updatedAt?: string } | null;
  results?: { checkedAt: string; matches: InternshipMatch[]; potentialMatches?: InternshipMatch[]; matchCount: number; checkedJobs: number; filteredJobs?: number; withRequirements: number; remainingChecks: number; unavailableRequirements?: number } | null;
  delivery?: { lastSentAt: string | null; lastError: string | null; uncertain: boolean; lastCheckedAt: string | null };
};
