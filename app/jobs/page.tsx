import Link from "next/link";
import { Plus } from "lucide-react";
import { JobsList } from "./_components/jobs-list";
import { SearchInput } from "./_components/search-input";
import { PageHeader } from "@/app/_components/page-header";
import { PageFooter } from "@/app/_components/page-footer";
import { ColumnMarker } from "@/components/shared/column-marker";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; search?: string }>;
}) {
  const params = await searchParams;
  const newCode = params.new;
  const initialSearch = params.search ?? "";

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <PageHeader />

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          <div className="shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-6 border-b border-border bg-background">
            <div className="flex items-end justify-between gap-6">
              <div className="flex items-end gap-6">
                <ColumnMarker numeral="i" title="Jobs" />
                <div className="mb-1">
                  <SearchInput initialSearch={initialSearch} />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/applications"
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 caps-action text-foreground hover:bg-secondary transition-colors"
                >
                  All applicants
                </Link>
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 caps-action hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  New job
                </Link>
              </div>
            </div>
          </div>

          <JobsList newCode={newCode} />
        </section>
      </main>

      <PageFooter />
    </div>
  );
}
