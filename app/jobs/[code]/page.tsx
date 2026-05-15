import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/services/jobs.service";
import { listApplicationsByJobCode } from "@/services/applications.service";
import type { ApplicationsQueryParams, FilterStatus } from "@/services/applications.service";
import type { ApplicationStatus } from "@/types/applications";
import { ArrowLeft } from "lucide-react";
import NavTabClient from "../_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { JobApplicantsList } from "./_components/job-applicants-list";

/* —————————————————————————— page —————————————————————————— */

type ExtendedFilter = FilterStatus | "all" | "new";
const VALID_STATUSES: ExtendedFilter[] = ["all", "new", "reviewing", "shortlisted", "rejected"];

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

  const filter: ExtendedFilter =
    sp.status && VALID_STATUSES.includes(sp.status as ExtendedFilter)
      ? (sp.status as ExtendedFilter)
      : "all";

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
    status: filter === "all" ? undefined : (filter as ApplicationStatus),
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

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">Yuvabe</Link>
            <span className="text-muted-foreground">/</span>
            <span className="eyebrow text-muted-foreground">ATS</span>
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
          <JobApplicantsList
            jobCode={code}
            jobTitle={job.title}
            jobCreatedAt={job.createdAt}
            initialData={result}
            initialParams={initialParams}
            initialFilter={filter}
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
