export const applicationStatuses = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
export type SavedApplication = {
  id: string; company: string; title: string; location: string; applicationUrl: string;
  status: ApplicationStatus; savedAt: string; updatedAt: string; notes: string;
};
export const pendingApplicationKey = "wai-pending-application";
