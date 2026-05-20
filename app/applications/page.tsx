import { ApplicationsList } from "./_components/applications-list";
import { PageHeader } from "@/app/_components/page-header";
import { PageFooter } from "@/app/_components/page-footer";

export default function ApplicationsListPage() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <PageHeader />

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          <ApplicationsList />
        </section>
      </main>

      <PageFooter />
    </div>
  );
}
