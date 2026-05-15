import Link from "next/link";
import { listApplicationsAll } from "@/services/applications.service";
import { listJobs } from "@/services/jobs.service";
import type { FilterStatus } from "@/services/applications.service";
import NavTabClient from "../jobs/_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { ApplicationsList } from "./_components/applications-list";

/* —————————————————————————— atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

/* —————————————————————————— page —————————————————————————— */

const PAGE_SIZE = 10;
const FILTER_STATUSES: FilterStatus[] = ["reviewing", "shortlisted", "rejected"];
const VALID_TOP_N = [10, 15, 20] as const;
type TopN = (typeof VALID_TOP_N)[number];
type ExtendedFilter = FilterStatus | "all" | "new";
const VALID_EXTENDED: ExtendedFilter[] = ["all", "new", ...FILTER_STATUSES];

export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; top?: string; minScore?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;

  const filter: ExtendedFilter =
    sp.status && VALID_EXTENDED.includes(sp.status as ExtendedFilter)
      ? (sp.status as ExtendedFilter)
      : "all";

  const topNRaw = sp.top ? parseInt(sp.top, 10) : null;
  const topN: TopN | null =
    topNRaw !== null && (VALID_TOP_N as readonly number[]).includes(topNRaw)
      ? (topNRaw as TopN)
      : null;

  const minScore = sp.minScore ? Math.max(0, Math.min(100, parseInt(sp.minScore, 10))) : 0;
  const searchQuery = sp.search ? decodeURIComponent(sp.search) : "";
  const initialPage = Number(sp.page ?? "1");

  const apiStatus = filter === "all" ? undefined : filter as FilterStatus | "new";

  const [initialData, jobsResult] = await Promise.all([
    listApplicationsAll({
      status: apiStatus,
      search: searchQuery,
      minScore,
      page: initialPage,
      pageSize: topN ?? PAGE_SIZE,
    }),
    listJobs(),
  ]);

  const jobs = jobsResult.jobs;
  const totalAll =
    initialData.statusCounts.new +
    initialData.statusCounts.reviewing +
    initialData.statusCounts.shortlisted +
    initialData.statusCounts.rejected;

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">Yuvabe</Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Eyebrow>
            <span className="tabular">{String(totalAll).padStart(2, "0")}</span>
            &nbsp;
            <span className="hidden sm:inline">
              {totalAll === 1 ? "application" : "applications"} across {jobs.length}{" "}
              {jobs.length === 1 ? "role" : "roles"}
            </span>
            <span className="sm:hidden">{totalAll === 1 ? "app" : "apps"}</span>
          </Eyebrow>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          <ApplicationsList
            initialData={initialData}
            initialJobs={jobs}
            initialFilter={filter}
            initialTopN={topN}
            initialMinScore={minScore}
            initialSearch={searchQuery}
            initialPage={initialPage}
          />
        </section>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}
