"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { useApplications } from "@/hooks/use-applications";
import { useQueryClient } from "@tanstack/react-query";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { JobActionsMenu } from "./job-actions-menu";
import { relativeTime } from "@/lib/utils";
import type { Job } from "@/types/jobs";

const PAGE_SIZE = 10;


export function JobsList({ newCode }: { newCode?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isFirstRender = useRef(true);
  // Guard: only refresh once per unique newCode to prevent loops.
  const refreshedForRef = useRef<string | null>(null);

  const rawTab = searchParams.get("tab");
  const tab = (rawTab === "archived" ? "archived" : rawTab === "draft" ? "draft" : "active") as "active" | "archived" | "draft";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const JOB_TYPES = ["full-time", "part-time", "contract", "internship"] as const;
  const rawType = searchParams.get("type");
  const jobType = (JOB_TYPES as readonly string[]).includes(rawType ?? "")
    ? (rawType as Job["type"])
    : undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const sort = searchParams.get("sort") === "oldest" ? "oldest" as const : "newest" as const;
  // Read newCode from the live URL — useSearchParams() always reflects the
  // current URL even when Next.js serves a cached RSC payload.
  const newCodeFromUrl = searchParams.get("new") ?? undefined;
  const effectiveNewCode = newCodeFromUrl ?? newCode;

  // When landing on /jobs?new=<code> after creation, Next.js may serve a
  // cached RSC payload (router cache keyed by segment, not search params).
  // router.refresh() forces a fresh server fetch → fresh initialData.
  // removeQueries() clears the stale React Query cache so initialData is used
  // immediately rather than waiting for a background refetch.
  useEffect(() => {
    if (newCodeFromUrl && refreshedForRef.current !== newCodeFromUrl) {
      refreshedForRef.current = newCodeFromUrl;
      queryClient.removeQueries({ queryKey: ["jobs", "list"] });
      router.refresh();
    }
  }, [newCodeFromUrl, queryClient, router]);

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

  const { data, isLoading, isFetching } = useJobs({ search, page, pageSize: PAGE_SIZE, status: tab, type: jobType, dateFrom, dateTo, sort });
  const { data: applications } = useApplications();

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

  function buildTabHref(targetTab: "active" | "draft" | "archived") {
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
  for (const a of applications ?? []) {
    appsByJobCode.set(a.jobCode, (appsByJobCode.get(a.jobCode) ?? 0) + 1);
  }

  const isFiltered = !!search;
  const showSkeleton = isLoading || (isFetching && jobs.length === 0);
  const isEmpty = !showSkeleton && jobs.length === 0;

  return (
    <div className="md:flex-1 md:flex md:flex-col md:overflow-hidden">
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-8">
      {/* Active / Draft / Archived tabs */}
      <div className="max-w-4xl flex items-center gap-6 border-b border-border mb-6">
        {(["active", "draft", "archived"] as const).map((t) => (
          <Link
            key={t}
            href={buildTabHref(t)}
            className={`caps-meta py-3 -mb-px border-b-2 transition-colors ${
              tab === t
                ? "text-foreground border-primary"
                : "text-foreground/55 border-transparent hover:text-foreground"
            }`}
          >
            {t === "active" ? "Active" : t === "draft" ? "Draft" : "Archived"}
          </Link>
        ))}
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
        ) : tab === "draft" ? (
          <DraftEmptyState />
        ) : (
          <EmptyState />
        )
      )}

      {/* Skeleton rows while loading or switching tabs with empty stale cache */}
      {showSkeleton && (
        <ul className="max-w-4xl">
          {["w-2/3", "w-1/2", "w-3/5", "w-1/2", "w-2/5"].map((titleW, i) => (
            <li key={i} className={`border-b border-border/60 ${i === 0 ? "border-t border-border/60" : ""}`}>
              <div className="py-5 md:py-6 px-4 grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className={`h-7 md:h-8 ${titleW} bg-muted rounded-sm animate-pulse mb-3`} />
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
                    <span className="text-border">·</span>
                    <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
                    <span className="text-border hidden sm:inline">·</span>
                    <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse hidden sm:inline-block" />
                  </div>
                </div>
                <div className="h-4 w-4 bg-muted/70 rounded-sm animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* List */}
      {!showSkeleton && jobs.length > 0 && (
        <>
          <ul className="max-w-4xl">
            {jobs.map((job, idx) => {
              const isNew = job.code === effectiveNewCode;
              const isArchived = job.status === "archived";
              const isDraft = job.status === "draft";
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
                      href={isDraft ? `/jobs/${job.code}/view` : `/jobs/${job.code}`}
                      className="min-w-0 after:absolute after:inset-0 after:content-[''] after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
                      aria-label={isDraft ? `View draft ${job.title}` : `View applicants for ${job.title}`}
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
                        {isDraft && (
                          <span className="eyebrow text-muted-foreground shrink-0 hidden sm:inline">
                            draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <JobIdBadge code={job.code} />
                        <span className="text-border">·</span>
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
                        <span className="text-border hidden lg:inline">·</span>
                        <span className="caps-meta text-muted-foreground hidden lg:inline">
                          {relativeTime(job.publishedAt ?? job.createdAt)}
                        </span>
                      </div>
                    </Link>

                    <JobActionsMenu
                      jobCode={job.code}
                      jobTitle={job.title}
                      status={job.status}
                      job={isDraft ? job : undefined}
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
        </>
      )}
      </div>

      {/* Pagination — always visible at the bottom of the content area */}
      {totalPages > 1 && jobs.length > 0 && (
        <div className="shrink-0 border-t border-border/60 bg-background px-4 sm:px-6 md:px-10">
          <div className="max-w-4xl py-4 flex items-center justify-between gap-4">
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
        </div>
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

function DraftEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No draft jobs.
      </p>
      <p className="mt-4 max-w-sm text-body-lg text-muted-foreground leading-relaxed">
        Jobs saved as drafts appear here. Publish when you&apos;re ready to open applications.
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
