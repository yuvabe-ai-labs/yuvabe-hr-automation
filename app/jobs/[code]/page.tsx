import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import { listApplicationsByJobCode, type ApplicationStatus } from "@/lib/applications-store";
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

const VALID_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "rejected",
  "offered",
];

const VALID_TOP_N = [10, 15, 20] as const;
type TopN = (typeof VALID_TOP_N)[number];
type SortOrder = "asc" | "desc";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ status?: string; top?: string; sort?: string; minScore?: string; maxScore?: string; search?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const filter =
    sp.status && VALID_STATUSES.includes(sp.status as ApplicationStatus)
      ? (sp.status as ApplicationStatus)
      : null;

  const topNRaw = sp.top ? parseInt(sp.top, 10) : null;
  const topN: TopN | null =
    topNRaw !== null && (VALID_TOP_N as readonly number[]).includes(topNRaw)
      ? (topNRaw as TopN)
      : null;

  const sortOrder: SortOrder = sp.sort === "asc" ? "asc" : "desc";

  const minScore = sp.minScore ? Math.max(0, Math.min(100, parseInt(sp.minScore, 10))) : 0;
  const searchQuery = sp.search ? decodeURIComponent(sp.search) : "";

  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) notFound();

  // Listing reads denormalized snapshots off Application — no candidates
  // fan-out. The full Candidate doc is only fetched on /applications/[id].
  const allApplications = await listApplicationsByJobCode(code);

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
          <NavTabClient href="/applications" label="Applicants" prefix="/applications" />
          <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" />
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
                <span className="text-base leading-none text-muted-foreground/65">
                  ›
                </span>
                <span className="text-foreground/80 truncate max-w-[40ch]">
                  {job.title}
                </span>
              </nav>
              <ColumnMarker numeral="i" title={job.title} />
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <JobIdBadge code={job.code} />
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">
                    {String(job.criteria.length).padStart(2, "0")}
                  </span>{" "}
                  criteria
                </Eyebrow>
                <span className="text-border">·</span>
                <Eyebrow>
                  <span className="tabular">
                    {String(allApplications.length).padStart(2, "0")}
                  </span>{" "}
                  {allApplications.length === 1 ? "applicant" : "applicants"}
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

              <JobApplicantsList
                jobCode={code}
                jobTitle={job.title}
                initialApplications={allApplications}
                filter={filter}
                topN={topN}
                sortOrder={sortOrder}
                minScore={minScore}
                searchQuery={searchQuery}
              />
            </div>
          </div>
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

