export const applicationStatuses = [
  "saved",
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationRow = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  status: ApplicationStatus;
  applied_at: string | null;
  next_step: string | null;
  next_step_at: string | null;
  notes: string | null;
  source_job_id: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};
