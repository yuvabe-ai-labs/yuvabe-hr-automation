import { JobViewContent } from "./_components/job-view-content";

export default async function JobViewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JobViewContent code={code} />;
}
