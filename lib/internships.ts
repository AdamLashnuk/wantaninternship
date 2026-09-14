export type InternshipSource = "greenhouse" | "lever" | "ashby" | "curated";

export type InternshipJob = {
  id: string;
  company: string;
  title: string;
  location: string;
  applyUrl: string;
  source: InternshipSource;
  firstSeenAt: string;
  postedAt?: string;
};

export type InternshipResponse = {
  jobs: InternshipJob[];
  live: boolean;
  updatedAt?: string;
};
