export type OpportunityType = "internship" | "new-grad";
export type SoftwareCategory = "swe" | "data-ai-ml" | "cloud-devops" | "cybersecurity";

export type InternshipJob = {
  id: string;
  company: string;
  companyWebsite?: string;
  title: string;
  opportunityType: OpportunityType;
  softwareCategory: SoftwareCategory;
  location: string;
  locations?: string[];
  applicationUrl: string;
  applyUrl?: string;
  source: string;
  sources?: string[];
  sourceUrl?: string;
  firstSeenAt: string;
  postedAt?: string;
  active: boolean;
};

export type InternshipResponse = {
  jobs: InternshipJob[];
  live: boolean;
  updatedAt?: string;
  nextRefreshAt?: string;
  nextCursor?: string;
  sourceCounts?: Record<string, number>;
  totalJobs?: number;
  recentWeekJobs?: number;
  retentionDays?: number;
  partial?: boolean;
};
