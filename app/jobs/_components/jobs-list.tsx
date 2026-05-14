"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { Input } from "@/components/ui/input";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { JobActionsMenu } from "./job-actions-menu";
import type { JobsListResult } from "@/services/jobs.service";
import type { Job } from "@/types/jobs";
import type { Application } from "@/types/applications";

const PAGE_SIZE = 10;

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
  initialData,
  initialApplications,
  newCode,
  initialSearch = "",
  initialPage = 1,
  initialTab = "active",
}: {
  initialData?: JobsListResult;
  initialApplications: Application[];
  newCode?: string;
  initialSearch?: string;
  initialPage?: number;
  initialTab?: "active" | "archived";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const tab = (searchParams.get("tab") === "archived" ? "archived" : "active") as "active" | "archived";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [prevSearch, setPrevSearch] = useState(search);
  const [searchInput, setSearchInput] = useState(search);

  // Sync input when URL changes externally (back/forward) — derived-state pattern
  if (prevSearch !== search) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  // Debounce search input → URL (skip first render to avoid redundant push)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInitialParams =
    search === initialSearch && page === initialPage && tab === initialTab;
  const { data } = useJobs(
    { search, page, pageSize: PAGE_SIZE, status: tab },
    isInitialParams ? initialData : undefined
  );

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function buildTabHref(targetTab: "active" | "archived") {
    const params = new URLSearchParams(searchParams.toString());
    if (targetTab === "active") {
      params.delete("tab");
    } else {
      params.set("tab", targetTab);
    }
    params.delete("page");
    return `?${params.toString()}`;
  }

  const appsByJobCode = new Map<string, number>();
  for (const a of initialApplications) {
    appsByJobCode.set(a.jobCode, (appsByJobCode.get(a.jobCode) ?? 0) + 1);
  }

  const isFiltered = !!search;
  const isEmpty = jobs.length === 0;

  return (
    <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
      {/* Active / Archived tabs */}
      <div className="max-w-4xl flex items-center gap-6 border-b border-border mb-6">
        {(["active", "archived"] as const).map((t) => (
          <Link
            key={t}
            href={buildTabHref(t)}
            className={`caps-meta py-3 -mb-px border-b-2 transition-colors ${
              tab === t
                ? "text-foreground border-primary"
                : "text-foreground/55 border-transparent hover:text-foreground"
            }`}
          >
            {t === "active" ? "Active" : "Archived"}
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-4xl mb-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            strokeWidth={1.75}
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by job title…"
            className="pl-9 rounded-sm border-border bg-background text-body placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Count / context line */}
      {(total > 0 || isFiltered) && (
        <div className="max-w-4xl mb-4">
          <p className="caps-meta text-muted-foreground tabular">
            {isFiltered ? (
              <>
                <span className="text-foreground">
                  {String(total).padStart(2, "0")}
                </span>
                &nbsp;{total === 1 ? "result" : "results"} for &ldquo;{search}
                &rdquo;
              </>
            ) : (
              <>
                {String(total).padStart(2, "0")}&nbsp;
                {total === 1 ? "role" : "roles"} · sorted by newest
              </>
            )}
          </p>
        </div>
      )}

      {/* Empty states */}
      {isEmpty && (
        isFiltered ? (
          <FilterEmptyState onClear={() => setSearchInput("")} />
        ) : tab === "archived" ? (
          <ArchivedEmptyState />
        ) : (
          <EmptyState />
        )
      )}

      {/* List */}
      {jobs.length > 0 && (
        <>
          <ul className="max-w-4xl">
            {jobs.map((job, idx) => {
              const counts = importanceCounts(job.criteria);
              const isNew = job.code === newCode;
              const isArchived = job.status === "archived";
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
                        <h3 className={`font-serif italic text-h2 md:text-h1 leading-tight tracking-tight truncate ${isArchived ? "text-foreground/60" : ""}`}>
                          {job.title}
                        </h3>
                        {isNew && (
                          <span className="eyebrow text-primary shrink-0 hidden sm:inline">
                            ← just saved
                          </span>
                        )}
                        {isArchived && (
                          <span className="eyebrow text-muted-foreground shrink-0 hidden sm:inline">
                            archived
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
                            className={
                              appCount > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground/70"
                            }
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
                            {String(counts.must).padStart(2, "0")} preferred
                          </span>
                          <span className="text-muted-foreground/60 mx-1.5">
                            ·
                          </span>
                          <span className="text-foreground">
                            {String(counts.strong).padStart(2, "0")} strong
                          </span>
                          <span className="text-muted-foreground/60 mx-1.5">
                            ·
                          </span>
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
                      status={job.status}
                    />

                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px transition-all shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="max-w-4xl mt-8 pt-6 border-t border-border/60 flex items-center justify-between gap-4">
              <span className="caps-meta text-muted-foreground tabular">
                {String((page - 1) * PAGE_SIZE + 1).padStart(2, "0")}–
                {String(Math.min(page * PAGE_SIZE, total)).padStart(2, "0")} of{" "}
                {String(total).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="caps-action text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  ← Prev
                </button>
                <span className="caps-meta text-muted-foreground tabular">
                  {String(page).padStart(2, "0")} /{" "}
                  {String(totalPages).padStart(2, "0")}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="caps-action text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


function FilterEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No roles match.
      </p>
      <p className="mt-4 max-w-sm text-body-lg text-muted-foreground leading-relaxed">
        Try a different title or clear the search to see all jobs.
      </p>
      <button
        onClick={onClear}
        className="mt-8 inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 caps-action text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}

function ArchivedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No archived jobs.
      </p>
      <p className="mt-4 max-w-sm text-body-lg text-muted-foreground leading-relaxed">
        Jobs you archive will appear here. You can restore them at any time.
      </p>
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
