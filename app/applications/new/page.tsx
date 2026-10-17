import type { Metadata } from "next";
import AddApplicationForm, {
  type ApplicationFormDefaults,
} from "../../../components/AddApplicationForm";
import {
  applicationStatuses,
  type ApplicationStatus,
} from "../../../types/applications";

export const metadata: Metadata = {
  title: "Add application | WantAnInternship",
  description: "Add an internship application and keep its next step visible.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameter(
  searchParams: Record<string, string | string[] | undefined>,
  name: string,
) {
  const value = searchParams[name];
  return typeof value === "string" ? value.slice(0, 500) : "";
}

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedStatus = parameter(params, "status");
  const status = applicationStatuses.includes(
    requestedStatus as ApplicationStatus,
  )
    ? (requestedStatus as ApplicationStatus)
    : "saved";

  const defaults: ApplicationFormDefaults = {
    company: parameter(params, "company"),
    role: parameter(params, "role"),
    location: parameter(params, "location"),
    status,
    sourceJobId: parameter(params, "source_job_id"),
    sourceUrl: parameter(params, "source_url"),
  };

  return <AddApplicationForm defaults={defaults} />;
}
