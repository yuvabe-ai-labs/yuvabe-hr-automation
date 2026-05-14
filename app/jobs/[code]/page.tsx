import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/services/jobs.service";
import { listApplicationsByJobCode } from "@/services/applications.service";
import type { ApplicationsQueryParams, FilterStatus } from "@/services/applications.service";
import { ArrowLeft, Eye } from "lucide-react";
import NavTabClient from "../_components/nav-tab";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { JobApplicantsList } from "./_components/job-applicants-list";

/* —————————————————————————— atoms (inlined per design system) —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <h1 className="font-serif italic text-h2 md:text-h1 leading-tight md:leading-none text-foreground tracking-tight max-w-[36ch]">
        {title}
      </h1>
    </div>
  );
}

/* —————————————————————————— page —————————————————————————— */

const FILTER_STATUSES: FilterStatus[] = ["reviewing", "shortlisted", "rejected"];

type SortOrder = "asc" | "desc";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    status?: string;
    sort?: string;
    minScore?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { code } = await params;
  const sp = await searchParams;

  const filter: FilterStatus =
    sp.status && FILTER_STATUSES.includes(sp.status as FilterStatus)
      ? (sp.status as FilterStatus)
      : "reviewing";

  const sortOrder: SortOrder = sp.sort === "asc" ? "asc" : "desc";
  const minScore = sp.minScore
    ? Math.max(0, Math.min(100, parseInt(sp.minScore, 10)))
    : 0;
  const searchQuery = sp.search ?? "";
  const currentPage = Math.max(1, Number(sp.page ?? "1"));
  const pageSizeParam = sp.pageSize
    ? Math.max(10, Math.min(100, parseInt(sp.pageSize, 10)))
    : undefined;

  const initialParams: ApplicationsQueryParams = {
    status: filter,
    search: searchQuery,
    sort: sortOrder,
    minScore,
    page: currentPage,
    pageSize: pageSizeParam,
  };

  const [job, result] = await Promise.all([
    getJobById(code),
    listApplicationsByJobCode(code, initialParams),
  ]);

  if (!job) notFound();

  const totalApplications = Object.values(result.statusCounts).reduce(
    (s, n) => s + n,
    0
  );

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">Yuvabe</Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">All jobs</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top — job title + filter chips */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-5 border-b border-border bg-background">
            <div className="max-w-5xl">
              <nav className="mb-4 eyebrow flex items-center gap-2.5">
                <Link
                  href="/jobs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Jobs
                </Link>
                <span className="text-base leading-none text-muted-foreground/65">›</span>
                <span className="text-foreground/80 truncate max-w-[40ch]">{job.title}</span>
              </nav>
              <ColumnMarker numeral="i" title={job.title} />
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <JobIdBadge code={job.code} />
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">{String(job.criteria.length).padStart(2, "0")}</span>{" "}
                  criteria
                </Eyebrow>
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">{String(totalApplications).padStart(2, "0")}</span>{" "}
                  {totalApplications === 1 ? "applicant" : "applicants"}
                </Eyebrow>
                <span className="text-border">·</span>
                <Eyebrow>
                  posted{" "}
                  {new Date(job.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Eyebrow>
                <Link
                  href={`/jobs/${job.code}/view`}
                  className="ml-auto inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  View criteria
                  <Eye className="h-3 w-3" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          </div>

          <JobApplicantsList
            jobCode={code}
            jobTitle={job.title}
            initialData={result}
            initialParams={initialParams}
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
