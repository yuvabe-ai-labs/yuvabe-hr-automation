import { ApplicationDetailContent } from "./_components/application-detail-content";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = process.env.AUTH_USER ?? "unknown";
  return <ApplicationDetailContent id={id} currentUser={currentUser} />;
}
