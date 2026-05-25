import { AppHeader } from "@/app/_components/app-header";
import { JobApplicantsList } from "./_components/job-applicants-list";
import { PageFooter } from "@/app/_components/page-footer";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <AppHeader backLink={{ href: "/jobs", label: "All jobs" }} />

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          <JobApplicantsList jobCode={code} />
        </section>
      </main>

      <PageFooter />
    </div>
  );
}
