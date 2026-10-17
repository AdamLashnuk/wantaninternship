"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "../lib/application-storage";
import type {
  ApplicationRow,
  ApplicationStatus,
} from "../types/applications";
import styles from "./AddApplicationForm.module.css";

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

export default function EditApplicationForm({
  applicationId,
}: {
  applicationId: string;
}) {
  const [application, setApplication] = useState<ApplicationRow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [appliedAt, setAppliedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const stored = getApplication(applicationId);
    setApplication(stored);
    if (stored) {
      setStatus(stored.status);
      setAppliedAt(stored.applied_at ?? "");
    }
    setIsLoaded(true);
  }, [applicationId]);

  function handleStatusChange(value: ApplicationStatus) {
    setStatus(value);
    if (value !== "saved" && !appliedAt) setAppliedAt(today());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application) return;
    setError(null);

    const formData = new FormData(event.currentTarget);
    const company = field(formData, "company");
    const role = field(formData, "role");

    if (!company || !role) {
      setError("Company and role are required.");
      return;
    }

    const updated: ApplicationRow = {
      ...application,
      company,
      role,
      location: optional(field(formData, "location")),
      status,
      applied_at: optional(appliedAt),
      next_step: optional(field(formData, "next_step")),
      next_step_at: optional(field(formData, "next_step_at")),
      notes: optional(field(formData, "notes")),
      source_url: optional(field(formData, "source_url")),
      updated_at: new Date().toISOString(),
    };

    try {
      if (!updateApplication(updated)) {
        setError("This application no longer exists in this browser.");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("This browser could not update the application. Please try again.");
    }
  }

  function handleDelete() {
    if (!application) return;
    setError(null);

    try {
      if (!deleteApplication(application.id)) {
        setError("This application has already been removed.");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("This browser could not delete the application. Please try again.");
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

        {!isLoaded ? (
          <div className={styles.statePanel}>Loading application…</div>
        ) : !application ? (
          <section className={styles.statePanel}>
            <h1>Application not found</h1>
            <p>It may have been removed or saved in a different browser.</p>
            <a className={styles.primaryButton} href="/">
              Return to applications
            </a>
          </section>
        ) : (
          <>
            <section className={styles.editHeading} aria-labelledby="page-title">
              <div>
                <h1 id="page-title">{application.company}</h1>
                <p>{application.role}</p>
              </div>
              {application.source_url && (
                <a
                  className={styles.secondaryButton}
                  href={application.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open posting <span aria-hidden="true">↗</span>
                </a>
              )}
            </section>

            <form className={styles.form} onSubmit={handleSubmit}>
              <fieldset className={styles.fieldset}>
                <legend>Role details</legend>

                <label className={styles.field}>
                  <span>Company</span>
                  <input
                    name="company"
                    type="text"
                    defaultValue={application.company}
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
                    defaultValue={application.role}
                    maxLength={160}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Location</span>
                  <input
                    name="location"
                    type="text"
                    defaultValue={application.location ?? ""}
                    placeholder="City, state, or Remote"
                    autoComplete="address-level2"
                  />
                </label>

                <label className={styles.field}>
                  <span>Posting link</span>
                  <input
                    name="source_url"
                    type="url"
                    defaultValue={application.source_url ?? ""}
                    placeholder="https://company.com/jobs/..."
                    inputMode="url"
                  />
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
                </label>

                <label className={styles.field}>
                  <span>Next step</span>
                  <input
                    name="next_step"
                    type="text"
                    defaultValue={application.next_step ?? ""}
                    maxLength={160}
                    placeholder="Complete assessment, interview, follow up"
                  />
                </label>

                <label className={styles.field}>
                  <span>Next-step date</span>
                  <input
                    name="next_step_at"
                    type="date"
                    defaultValue={application.next_step_at ?? ""}
                  />
                </label>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Notes</legend>
                <label className={styles.field}>
                  <span className={styles.srOnly}>Notes</span>
                  <textarea
                    name="notes"
                    rows={5}
                    defaultValue={application.notes ?? ""}
                    placeholder="Recruiter details, interview notes, or anything worth remembering"
                  />
                </label>
              </fieldset>

              {error && (
                <p className={styles.formError} role="alert">
                  {error}
                </p>
              )}

              <div className={styles.editActions}>
                <div className={styles.deleteArea}>
                  {confirmDelete ? (
                    <>
                      <span>Delete this application?</span>
                      <button
                        className={styles.dangerButton}
                        type="button"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete application
                    </button>
                  )}
                </div>

                <div className={styles.saveActions}>
                  <a className={styles.secondaryButton} href="/">
                    Cancel
                  </a>
                  <button className={styles.primaryButton} type="submit">
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
