import {
  applicationStatuses,
  type ApplicationRow,
  type ApplicationStatus,
} from "../types/applications";

export const APPLICATION_STORAGE_KEY = "wantaninternship:applications:v1";

function isApplication(value: unknown): value is ApplicationRow {
  if (!value || typeof value !== "object") return false;
  const application = value as Partial<ApplicationRow>;

  return (
    typeof application.id === "string" &&
    typeof application.company === "string" &&
    typeof application.role === "string" &&
    typeof application.status === "string" &&
    applicationStatuses.includes(application.status as ApplicationStatus) &&
    typeof application.created_at === "string" &&
    typeof application.updated_at === "string"
  );
}

function normalizeApplication(application: ApplicationRow): ApplicationRow {
  return {
    ...application,
    location: application.location ?? null,
    applied_at: application.applied_at ?? null,
    next_step: application.next_step ?? null,
    next_step_at: application.next_step_at ?? null,
    notes: application.notes ?? null,
    source_job_id: application.source_job_id ?? null,
    source_url: application.source_url ?? null,
  };
}

function writeApplications(applications: ApplicationRow[]) {
  window.localStorage.setItem(
    APPLICATION_STORAGE_KEY,
    JSON.stringify(applications),
  );
}

export function loadApplications(): ApplicationRow[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(APPLICATION_STORAGE_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(stored)
      ? stored.filter(isApplication).map(normalizeApplication)
      : [];
  } catch {
    return [];
  }
}

export function saveApplication(application: ApplicationRow) {
  const current = loadApplications();
  const duplicateIndex = application.source_job_id
    ? current.findIndex(
        (item) => item.source_job_id === application.source_job_id,
      )
    : -1;

  if (duplicateIndex >= 0) {
    const existing = current[duplicateIndex];
    current[duplicateIndex] = {
      ...application,
      id: existing.id,
      created_at: existing.created_at,
    };
  } else {
    current.unshift(application);
  }

  writeApplications(current);
}

export function getApplication(id: string) {
  return loadApplications().find((application) => application.id === id) ?? null;
}

export function updateApplication(application: ApplicationRow) {
  const current = loadApplications();
  const index = current.findIndex((item) => item.id === application.id);
  if (index < 0) return false;

  current[index] = application;
  writeApplications(current);
  return true;
}

export function deleteApplication(id: string) {
  const current = loadApplications();
  const remaining = current.filter((application) => application.id !== id);
  if (remaining.length === current.length) return false;

  writeApplications(remaining);
  return true;
}
