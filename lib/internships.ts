export type OpportunityType = "internship" | "new-grad";
export type SoftwareCategory = "swe" | "data-ai-ml" | "cloud-devops" | "cybersecurity";
export type OpportunityTrack = "software" | "engineering";
export type PositionType = "internship" | "co-op";
export type EngineeringDiscipline =
  | "mechanical"
  | "electrical"
  | "civil"
  | "chemical"
  | "aerospace"
  | "biomedical"
  | "industrial-manufacturing"
  | "computer-hardware"
  | "environmental"
  | "materials"
  | "nuclear"
  | "robotics-mechatronics"
  | "other-engineering";

export type InternshipJob = {
  id: string;
  company: string;
  companyWebsite?: string;
  title: string;
  opportunityType: OpportunityType;
  positionType?: PositionType;
  softwareCategory?: SoftwareCategory;
  engineeringDiscipline?: EngineeringDiscipline;
  track?: OpportunityTrack;
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
  track?: OpportunityTrack;
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
