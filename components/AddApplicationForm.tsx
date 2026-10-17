"use client";

import { useState, type FormEvent } from "react";
import { saveApplication } from "../lib/application-storage";
import type {
  ApplicationRow,
  ApplicationStatus,
} from "../types/applications";
import styles from "./AddApplicationForm.module.css";

export type ApplicationFormDefaults = {
  company: string;
  role: string;
  location: string;
  status: ApplicationStatus;
  sourceJobId: string;
  sourceUrl: string;
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function AddApplicationForm({
  defaults,
}: {
  defaults: ApplicationFormDefaults;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(defaults.status);
  const [appliedAt, setAppliedAt] = useState(
    defaults.status === "saved" ? "" : today(),
  );
  const [error, setError] = useState<string | null>(null);
  const cameFromDiscovery = Boolean(defaults.sourceJobId || defaults.sourceUrl);

  function handleStatusChange(value: ApplicationStatus) {
    setStatus(value);
    if (value !== "saved" && !appliedAt) setAppliedAt(today());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const company = field(formData, "company");
    const role = field(formData, "role");

    if (!company || !role) {
      setError("Company and role are required.");
      return;
    }

    const timestamp = new Date().toISOString();
    const application: ApplicationRow = {
      id: crypto.randomUUID(),
      company,
      role,
      location: optional(field(formData, "location")),
      status,
      applied_at: optional(appliedAt),
      next_step: optional(field(formData, "next_step")),
      next_step_at: optional(field(formData, "next_step_at")),
      notes: optional(field(formData, "notes")),
      source_job_id: optional(field(formData, "source_job_id")),
      source_url: optional(field(formData, "source_url")),
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      saveApplication(application);
      window.location.assign("/");
    } catch {
      setError("This browser could not save the application. Please try again.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <a className={styles.brand} href="/">
            WantAnInternship
          </a>

          <nav className={styles.navigation} aria-label="Main navigation">
            <a className={styles.activeNav} href="/" aria-current="page">
              Applications
            </a>
            <a href="/discover">Discover</a>
          </nav>
        </div>
      </header>

      <div className={styles.content}>
        <a className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Applications
        </a>

        <section className={styles.heading} aria-labelledby="page-title">
          <h1 id="page-title">Add application</h1>
          <p>
            Add a role you saved or already applied to. You can update its status
            and notes later.
          </p>
        </section>

        <div className={styles.notice} role="status">
          <strong>No account needed</strong>
          <span>This application will be saved in this browser.</span>
        </div>

        {cameFromDiscovery && (
          <div className={styles.discoveryNotice}>
            Role details were filled in from Latest Internship Drops. Review them
            before saving.
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="hidden"
            name="source_job_id"
            value={defaults.sourceJobId}
          />

          <fieldset className={styles.fieldset}>
            <legend>Role details</legend>

            <label className={styles.field}>
              <span>Company</span>
              <input
                name="company"
                type="text"
                defaultValue={defaults.company}
                maxLength={120}
                autoComplete="organization"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Role</span>
              <input
                name="role"
                type="text"
                defaultValue={defaults.role}
                maxLength={160}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Location</span>
              <input
                name="location"
                type="text"
                defaultValue={defaults.location}
                placeholder="City, state, or Remote"
                autoComplete="address-level2"
              />
            </label>

            <label className={styles.field}>
              <span>Posting link</span>
              <input
                name="source_url"
                type="url"
                defaultValue={defaults.sourceUrl}
                placeholder="https://company.com/jobs/..."
                inputMode="url"
              />
              <small>Optional. Use the employer’s original listing.</small>
            </label>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Application progress</legend>

            <label className={styles.field}>
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as ApplicationStatus)
                }
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Application date</span>
              <input
                name="applied_at"
                type="date"
                value={appliedAt}
                onChange={(event) => setAppliedAt(event.target.value)}
              />
              <small>
                Selecting Applied or a later status fills today automatically.
              </small>
            </label>

            <label className={styles.field}>
              <span>Next step</span>
              <input
                name="next_step"
                type="text"
                maxLength={160}
                placeholder="Complete assessment, interview, follow up"
              />
            </label>

            <label className={styles.field}>
              <span>Next-step date</span>
              <input name="next_step_at" type="date" />
            </label>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Notes</legend>
            <label className={styles.field}>
              <span className={styles.srOnly}>Notes</span>
              <textarea
                name="notes"
                rows={5}
                placeholder="Recruiter details, interview notes, or anything worth remembering"
              />
            </label>
          </fieldset>

          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <a className={styles.secondaryButton} href="/">
              Cancel
            </a>
            <button
              className={styles.primaryButton}
              type="submit"
            >
              Save application
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
