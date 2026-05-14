import { notFound } from "next/navigation";
import { getApplicationById } from "@/lib/applications-store";
import { getCandidateById } from "@/lib/candidates-store";
import { listJobs } from "@/lib/jobs-store";
import { listNotes } from "@/lib/notes-store";
import { ApplicationDetailContent } from "./_components/application-detail-content";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  const candidate = await getCandidateById(application.candidateId);
  if (!candidate) notFound();

  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === application.jobId);
  if (!job) notFound();

  const initialNotes = await listNotes(id).catch(() => []);
  const currentUser = process.env.AUTH_USER ?? "unknown";

  return (
    <ApplicationDetailContent
      id={application.id}
      initialApplication={application}
      jobTitle={job.title}
      jobCode={job.code}
      candidateName={candidate.name}
      candidateEmail={candidate.email}
      candidatePhone={candidate.phone}
      candidateLocation={candidate.location}
      yearsOfExperience={candidate.yearsOfExperience}
      education={candidate.education}
      links={candidate.links}
      resumeUrl={application.resumeUrl}
      initialNotes={initialNotes}
      currentUser={currentUser}
    />
  );
}
