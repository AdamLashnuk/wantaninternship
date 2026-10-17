"use client";

import { useEffect, useMemo, useState } from "react";
import {
  APPLICATION_STORAGE_KEY,
  loadApplications,
} from "../lib/application-storage";
import type {
  ApplicationRow,
  ApplicationStatus,
} from "../types/applications";
import styles from "./ApplicationsDashboard.module.css";

const statusLabels: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

type StatusFilter = "all" | ApplicationStatus;
type SortOption = "updated" | "applied" | "company" | "next-step";

function formatDate(value: string | null, includeYear = false) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function isDueWithinWeek(value: string | null) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${value.slice(0, 10)}T12:00:00`);
  const difference = deadline.getTime() - today.getTime();

  return difference >= 0 && difference <= 7 * 24 * 60 * 60 * 1000;
}

function Status({ status }: { status: ApplicationStatus }) {
  return (
    <span className={styles.status}>
      <span
        className={`${styles.statusDot} ${styles[`status_${status}`] ?? ""}`}
        aria-hidden="true"
      />
      {statusLabels[status]}
    </span>
  );
}

export default function ApplicationsDashboard() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("updated");

  useEffect(() => {
    function refreshApplications() {
      setApplications(loadApplications());
      setIsLoaded(true);
    }

    refreshApplications();

    function handleStorage(event: StorageEvent) {
      if (event.key === APPLICATION_STORAGE_KEY) refreshApplications();
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications
      .filter((application) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [application.company, application.role, application.location ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = status === "all" || application.status === status;

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "company") return a.company.localeCompare(b.company);
        if (sort === "applied") {
          return (b.applied_at ?? "").localeCompare(a.applied_at ?? "");
        }
        if (sort === "next-step") {
          return (a.next_step_at ?? "9999").localeCompare(
            b.next_step_at ?? "9999",
          );
        }
        return b.updated_at.localeCompare(a.updated_at);
      });
  }, [applications, query, sort, status]);

  const activeCount = applications.filter((application) =>
    ["applied", "assessment", "interview"].includes(application.status),
  ).length;
  const dueThisWeek = applications.filter(
    (application) =>
      !["rejected", "withdrawn"].includes(application.status) &&
      isDueWithinWeek(application.next_step_at),
  ).length;

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
        <section className={styles.pageHeading} aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Applications</h1>
            <p>Track applications and keep the next step visible.</p>
          </div>

          <div className={styles.headingActions}>
            <a className={styles.secondaryButton} href="/discover">
              Find internships
            </a>
            <a className={styles.primaryButton} href="/applications/new">
              Add application
            </a>
          </div>
        </section>

        <div className={styles.previewNotice} role="status">
          <strong>Saved on this device</strong>
          <span>
            Your applications stay in this browser. No account is required.
          </span>
        </div>

        <section className={styles.summary} aria-label="Application summary">
          <div>
            <strong>{isLoaded ? applications.length : "—"}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{isLoaded ? activeCount : "—"}</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>{isLoaded ? dueThisWeek : "—"}</strong>
            <span>Due this week</span>
          </div>
        </section>

        <section className={styles.applicationSection} aria-label="Applications">
          <div className={styles.filters}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Search applications</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, role, or location"
              />
            </label>

            <label>
              <span className={styles.srOnly}>Filter by status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusFilter)
                }
              >
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={styles.srOnly}>Sort applications</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
              >
                <option value="updated">Recently updated</option>
                <option value="applied">Application date</option>
                <option value="company">Company name</option>
                <option value="next-step">Next step</option>
              </select>
            </label>
          </div>

          <div className={styles.resultsLine} aria-live="polite">
            {isLoaded
              ? `${filteredApplications.length} ${filteredApplications.length === 1 ? "application" : "applications"}`
              : "Loading applications…"}
          </div>

          {isLoaded && filteredApplications.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>
                  Internship applications
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Applied</th>
                    <th scope="col">Next step</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td data-label="Company">
                        <strong>
                          <a
                            className={styles.rowLink}
                            href={`/applications/${encodeURIComponent(application.id)}`}
                          >
                            {application.company}
                          </a>
                        </strong>
                        {application.location && (
                          <span className={styles.location}>
                            {application.location}
                          </span>
                        )}
                      </td>
                      <td data-label="Role">{application.role}</td>
                      <td data-label="Status">
                        <Status status={application.status} />
                      </td>
                      <td data-label="Applied">
                        {formatDate(application.applied_at)}
                      </td>
                      <td data-label="Next step">
                        {application.next_step ? (
                          <span className={styles.nextStep}>
                            <span>{application.next_step}</span>
                            {application.next_step_at && (
                              <small>
                                {formatDate(application.next_step_at, true)}
                              </small>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Updated">
                        {formatDate(application.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isLoaded ? (
            <div className={styles.emptyState}>
              <h2>
                {applications.length === 0
                  ? "No applications yet"
                  : "No applications found"}
              </h2>
              <p>
                {applications.length === 0
                  ? "Add a role you saved or already applied to."
                  : "Change the filters or add an application."}
              </p>
              <a className={styles.primaryButton} href="/applications/new">
                Add application
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
