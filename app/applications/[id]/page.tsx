import type { Metadata } from "next";
import EditApplicationForm from "../../../components/EditApplicationForm";

export const metadata: Metadata = {
  title: "Edit application | WantAnInternship",
  description: "Update an internship application, next step, and notes.",
};

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditApplicationForm applicationId={id} />;
}
