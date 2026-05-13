"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { JobActionsMenu } from "./job-actions-menu";
import type { Job } from "@/types/jobs";
import type { Application } from "@/types/applications";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function importanceCounts(criteria: Job["criteria"]) {
  let must = 0,
    strong = 0,
    nice = 0;
  for (const c of criteria) {
    if (c.importance === "must") must++;
    else if (c.importance === "strong") strong++;
    else nice++;
  }
  return { must, strong, nice };
}

export function JobsList({
  initialJobs,
  initialApplications,
  newCode,
}: {
  initialJobs: Job[];
  initialApplications: Application[];
  newCode?: string;
}) {
  const { data: jobs = initialJobs } = useJobs(initialJobs);

  // Cross-reference applications so each row shows its application count.
  const appsByJobCode = new Map<string, number>();
  for (const a of initialApplications) {
    appsByJobCode.set(a.jobCode, (appsByJobCode.get(a.jobCode) ?? 0) + 1);
  }

  return (
    <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="max-w-4xl">
          {jobs.map((job, idx) => {
            const counts = importanceCounts(job.criteria);
            const isNew = job.code === newCode;
            const appCount = appsByJobCode.get(job.code) ?? 0;
            return (
              <li
                key={job.id}
                className={`
                  relative group border-b border-border/60 last:border-b-0
                  ${idx === 0 ? "border-t border-border/60" : ""}
                  ${isNew ? "highlight-new" : ""}
                  hover:bg-secondary/40 transition-colors
                `}
              >
                <div className="py-5 md:py-6 -mx-4 pl-4 pr-6 md:pr-8 rounded-sm grid grid-cols-[1fr_auto_auto] items-center gap-2 md:gap-3">
                  <Link
                    href={`/jobs/${job.code}`}
                    className="min-w-0 after:absolute after:inset-0 after:content-[''] after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
                    aria-label={`View applicants for ${job.title}`}
                  >
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="font-serif italic text-h2 md:text-h1 leading-tight tracking-tight truncate">
                        {job.title}
                      </h3>
                      {isNew && (
                        <span className="eyebrow text-primary flex-shrink-0 hidden sm:inline">
                          ← just saved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <JobIdBadge code={job.code} />
                      <span className="text-border">·</span>
                      <span className="caps-meta text-muted-foreground tabular">
                        {String(job.criteria.length).padStart(2, "0")} criteria
                      </span>
                      <span className="text-border hidden sm:inline">·</span>
                      <span className="caps-meta tabular hidden sm:inline">
                        <span
                          className={appCount > 0 ? "text-foreground font-medium" : "text-muted-foreground/70"}
                        >
                          {String(appCount).padStart(2, "0")}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {appCount === 1 ? "applicant" : "applicants"}
                        </span>
                      </span>
                      <span className="text-border hidden md:inline">·</span>
                      <span className="caps-meta tabular hidden md:inline">
                        <span className="text-primary">
                          {String(counts.must).padStart(2, "0")} must
                        </span>
                        <span className="text-muted-foreground/60 mx-1.5">·</span>
                        <span className="text-foreground">
                          {String(counts.strong).padStart(2, "0")} strong
                        </span>
                        <span className="text-muted-foreground/60 mx-1.5">·</span>
                        <span className="text-muted-foreground">
                          {String(counts.nice).padStart(2, "0")} nice
                        </span>
                      </span>
                      <span className="text-border hidden lg:inline">·</span>
                      <span className="caps-meta text-muted-foreground hidden lg:inline">
                        {relativeTime(job.createdAt)}
                      </span>
                    </div>
                  </Link>

                  <JobActionsMenu
                    jobCode={job.code}
                    jobTitle={job.title}
                    isArchived={!!job.archivedAt}
                  />

                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px transition-all flex-shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No jobs yet.
      </p>
      <p className="mt-4 max-w-sm text-body-lg text-muted-foreground leading-relaxed">
        Upload a job description and we&apos;ll pull out the criteria
        recruiters screen on. Saved jobs appear here.
      </p>
      <Link
        href="/jobs/new"
        className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-5 py-2.5 caps-action hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Create the first job
      </Link>
    </div>
  );
}
