import Link from "next/link";
import { listJobs } from "@/services/jobs.service";
import { listApplications } from "@/lib/applications-store";
import { Plus } from "lucide-react";
import NavTabClient from "./_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { JobsList } from "./_components/jobs-list";

/* —————————————————————————— small typographic atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

function ColumnMarker({
  numeral,
  title,
}: {
  numeral: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
        {title}
      </span>
    </div>
  );
}

/* —————————————————————————— page —————————————————————————— */

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; search?: string; page?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const newCode = params.new;
  const initialSearch = params.search ?? "";
  const initialPage = Number(params.page ?? "1");
  const initialTab = params.tab === "archived" ? "archived" : "active";

  const [result, allApplications] = await Promise.all([
    listJobs({ search: initialSearch, page: initialPage, status: initialTab }),
    listApplications(),
  ]);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header — brand + tabs —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link
              href="/"
              className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity"
            >
              Yuvabe
            </Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Eyebrow>
            <span className="tabular">{String(result.total).padStart(2, "0")}</span>
            &nbsp;{result.total === 1 ? "job" : "jobs"}
          </Eyebrow>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient
            href="/applications"
            label="Applicants"
            prefix="/applications"
          /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-6 border-b border-border bg-background">
            <div className="flex items-end justify-between gap-6">
              <ColumnMarker numeral="i" title="Jobs" />
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 caps-action hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                New job
              </Link>
            </div>
          </div>

          {/* Scrolling list */}
          <JobsList
            initialData={result}
            initialApplications={allApplications}
            newCode={newCode}
            initialSearch={initialSearch}
            initialPage={initialPage}
            initialTab={initialTab}
          />
        </section>
      </main>

      {/* —————— Footer —————— */}
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}

