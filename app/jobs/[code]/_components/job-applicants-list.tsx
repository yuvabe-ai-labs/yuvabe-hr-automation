"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Eye, Filter, Loader2, MoreHorizontal, X } from "lucide-react";
import { useApplicationsByJobCode } from "@/hooks/use-applications";
import type { ApplicationsQueryParams } from "@/hooks/use-applications";
import { useJobById } from "@/hooks/use-jobs";
import { useGetCandidatesByIds } from "@/hooks/use-candidates";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import { downloadExcel } from "@/lib/export-excel";
import { relativeTime } from "@/lib/utils";
import { STATUS_LABEL, STATUS_COLOR, FILTER_LABEL, ALL_FILTER_TABS } from "@/lib/constants";
import type { ExtendedFilter } from "@/lib/constants";
import { ScoreChip } from "@/components/shared/score-chip";
import { StatusFilterChip } from "@/components/shared/status-filter-chip";
import type { Application, ApplicationStatus } from "@/types/applications";
import { JobIdBadge } from "@/app/_components/job-id-badge";

const DEFAULT_PAGE_SIZE = 15;

type SortOrder = "asc" | "desc";

function buildHref(
  jobCode: string,
  overrides: { status?: ExtendedFilter; search?: string | null; minScore?: number },
  current: { filter: ExtendedFilter; searchQuery: string; minScore: number; sortOrder: SortOrder; pageSize: number }
): string {
  const params = new URLSearchParams();
  const status = "status" in overrides ? overrides.status : current.filter;
  const search = "search" in overrides ? overrides.search : current.searchQuery;
  const minScore = "minScore" in overrides ? overrides.minScore : current.minScore;

  // Omit "all" from URL — it's the default
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  if (minScore !== undefined && minScore > 0) params.set("minScore", String(minScore));
  if (current.sortOrder !== "desc") params.set("sort", current.sortOrder);
  if (current.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(current.pageSize));

  const qs = params.toString();
  return `/jobs/${jobCode}${qs ? `?${qs}` : ""}`;
}


export function JobApplicantsList({ jobCode }: { jobCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // URL-derived state
  const rawStatus = searchParams.get("status");
  const filter: ExtendedFilter =
    rawStatus && ALL_FILTER_TABS.includes(rawStatus as ExtendedFilter)
      ? (rawStatus as ExtendedFilter)
      : "all";
  const sortOrder: SortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const minScore = Math.max(0, Math.min(100, Number(searchParams.get("minScore") ?? "0")));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSizeParam = searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Math.max(10, Math.min(100, parseInt(pageSizeParam, 10))) : DEFAULT_PAGE_SIZE;

  // Search input with derived-state sync for back/forward nav
  const search = searchParams.get("search") ?? "";
  const [prevSearch, setPrevSearch] = useState(search);
  const [searchInput, setSearchInput] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  // Debounce search input → URL
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Fetch job details for title and posted date
  const { data: job } = useJobById(jobCode);
  const jobTitle = job?.title ?? "";
  const jobCreatedAt = job?.createdAt ?? "";
  // Imperative fetch for candidate enrichment (used during export only)
  const { mutateAsync: fetchCandidates } = useGetCandidatesByIds();

  const currentParams: ApplicationsQueryParams = {
    status: filter === "all" ? undefined : (filter as ApplicationStatus),
    search,
    sort: sortOrder,
    minScore,
    page,
    pageSize,
  };

  // Fetch paginated + filtered applications for this job
  const { data, isPending } = useApplicationsByJobCode(jobCode, currentParams);

  const applications = useMemo(() => data?.applications ?? [], [data]);
  const total = data?.total ?? 0;
  const statusCounts = data?.statusCounts ?? { new: 0, reviewing: 0, shortlisted: 0, rejected: 0 };
  const totalPages = Math.ceil(total / pageSize);
  const totalAll = Object.values(statusCounts).reduce((s, n) => s + n, 0);

  // "all" tab count = sum of new + reviewing + shortlisted + rejected (but not double-counting offered)
  const allCount = totalAll;

  const tabCounts: Record<ExtendedFilter, number> = {
    all:         allCount,
    new:         statusCounts.new ?? 0,
    reviewing:   statusCounts.reviewing ?? 0,
    shortlisted: statusCounts.shortlisted ?? 0,
    rejected:    statusCounts.rejected ?? 0,
  };

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  // Sync select-all indeterminate state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleCount = applications.length;
    const selectedCount = Array.from(selectedIds).filter((id) =>
      applications.some((a) => a.id === id)
    ).length;
    if (selectedCount === 0) {
      selectAllRef.current.checked = false;
      selectAllRef.current.indeterminate = false;
    } else if (selectedCount === visibleCount && visibleCount > 0) {
      selectAllRef.current.checked = true;
      selectAllRef.current.indeterminate = false;
    } else {
      selectAllRef.current.indeterminate = true;
    }
  }, [selectedIds, applications]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          applications.forEach((a) => newSet.add(a.id));
        } else {
          applications.forEach((a) => newSet.delete(a.id));
        }
        return newSet;
      });
    },
    [applications]
  );

  const getExportData = useCallback(async () => {
    const toExport =
      selectedIds.size > 0 ? applications.filter((a) => selectedIds.has(a.id)) : applications;
    const candidateIds = [...new Set(toExport.map((a) => a.candidateId))];
    const jobTitles = new Map([[jobCode, jobTitle]]);

    const [enrichments, ...notesResults] = await Promise.all([
      fetchCandidates(candidateIds),
      ...toExport.map((a) =>
        fetch(`/api/applications/${a.id}/notes`)
          .then((r) => r.json())
          .then((d) => ({ id: a.id, notes: (d.notes ?? []) as { body: string }[] }))
          .catch(() => ({ id: a.id, notes: [] }))
      ),
    ]);

    const notesByAppId = new Map<string, string>(
      notesResults.map(({ id, notes }) => [
        id,
        notes.map((n: { body: string }) => n.body).join(" | "),
      ])
    );

    return { selectedApplications: toExport, enrichments, jobTitles, notesByAppId };
  }, [applications, selectedIds, jobCode, jobTitle, fetchCandidates]);

  const handleExportCsv = useCallback(async () => {
    setExportingFormat("csv");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles, notesByAppId);
      downloadCsv(csv, `candidates-${jobCode}.csv`);
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData, jobCode]);

  const handleExportExcel = useCallback(async () => {
    setExportingFormat("excel");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      downloadExcel(selectedApplications, enrichments, jobTitles, notesByAppId, `candidates-${jobCode}.xlsx`);
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData, jobCode]);

  const current = { filter, searchQuery: search, minScore, sortOrder, pageSize };
  const hasActiveFilter = minScore > 0;

  return (
    <div className="md:flex-1 md:flex md:flex-col md:overflow-hidden">

      {/* Static top: breadcrumb + title row + metadata */}
      <div className="shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-4 border-b border-border bg-background">
        <div className="max-w-5xl">
          {/* Breadcrumb */}
          <nav className="mb-4 eyebrow flex items-center gap-2.5">
            <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Jobs
            </Link>
            <span className="text-base leading-none text-muted-foreground/65">›</span>
            <span className="text-foreground/80 truncate max-w-[40ch]">{jobTitle}</span>
          </nav>

          {/* Title + search + controls */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* i. Job Title */}
            <div className="flex items-baseline gap-2 md:gap-3 shrink-0">
              <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">i.</span>
              <h1 className="font-serif italic text-h2 md:text-h1 leading-tight md:leading-none text-foreground tracking-tight max-w-[28ch] truncate">
                {jobTitle}
              </h1>
            </div>

            {/* Search input */}
            <div className="relative flex-1 min-w-0 max-w-sm ml-8 md:ml-12 mt-2">
              <input
                type="text"
                placeholder="Search by applicant name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-3 py-1.5 pr-8 border border-border rounded-sm bg-background text-foreground text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter button + popover */}
            <div className="relative shrink-0 mt-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-1.5 border rounded-sm transition-colors ${
                  hasActiveFilter
                    ? "text-primary border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                aria-label="Open filters"
              >
                <Filter className="h-4 w-4" strokeWidth={2} />
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-sm shadow-lg z-50 p-3 w-64">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs caps-meta text-muted-foreground mb-1.5">
                          Min Score: {tempMinScore}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={tempMinScore}
                          onChange={(e) => setTempMinScore(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-sm appearance-none cursor-pointer accent-primary"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tempMinScore}
                          onChange={(e) =>
                            setTempMinScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
                          }
                          className="w-full mt-1 px-2 py-1 border border-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="pt-1">
                        <Link
                          href={buildHref(jobCode, { minScore: tempMinScore }, current)}
                          onClick={() => setIsFilterOpen(false)}
                          className="block w-full px-2 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium transition-colors hover:bg-primary/90 text-center"
                        >
                          Apply
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Selection count + export — only when items are selected */}
            {selectedIds.size > 0 && (
              <>
                <span className="caps-meta text-muted-foreground tabular whitespace-nowrap shrink-0 mt-2">
                  {selectedIds.size} selected
                </span>

                <div className="relative shrink-0 mt-2">
                  <button
                    onClick={() => !exportingFormat && setIsExportMenuOpen(!isExportMenuOpen)}
                    className="p-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Export options"
                  >
                    {exportingFormat ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </button>
                  {(isExportMenuOpen || exportingFormat) && (
                    <>
                      {!exportingFormat && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                      )}
                      <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-sm shadow-[0_4px_16px_rgb(0,0,0,0.10)] overflow-hidden min-w-[148px] z-50">
                        <button
                          onClick={() => { handleExportCsv(); setIsExportMenuOpen(false); }}
                          disabled={!!exportingFormat}
                          className="w-full px-3 py-2.5 text-left caps-action text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {exportingFormat === "csv" && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
                          {exportingFormat === "csv" ? "Exporting…" : "Export CSV"}
                        </button>
                        <div className="border-t border-border" />
                        <button
                          onClick={() => { handleExportExcel(); setIsExportMenuOpen(false); }}
                          disabled={!!exportingFormat}
                          className="w-full px-3 py-2.5 text-left caps-action text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          {exportingFormat === "excel" && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
                          {exportingFormat === "excel" ? "Exporting…" : "Export as Excel"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => { setSelectedIds(new Set()); setIsExportMenuOpen(false); }}
                  aria-label="Clear selection"
                  className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Metadata row */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <JobIdBadge code={jobCode} />
            <span className="text-border">·</span>
            <span className="eyebrow text-muted-foreground">
              <span className="tabular">{String(totalAll).padStart(2, "0")}</span>{" "}
              {totalAll === 1 ? "applicant" : "applicants"}
            </span>
            <span className="text-border">·</span>
            <span className="eyebrow text-muted-foreground">
              posted{" "}
              {new Date(jobCreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <Link
              href={`/jobs/${jobCode}/view`}
              className="ml-auto inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              View criteria
              <Eye className="h-3 w-3" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>


      {/* Status filter chips */}
      {totalAll > 0 && (
        <div className="shrink-0 px-4 sm:px-6 md:px-10 pt-3 pb-1 flex items-center gap-1 flex-wrap">
          {ALL_FILTER_TABS.map((s) => (
            <StatusFilterChip
              key={s}
              href={buildHref(jobCode, { status: s }, current)}
              label={FILTER_LABEL[s]}
              count={tabCounts[s]}
              tone={s === "shortlisted" ? "shortlist" : s === "rejected" ? "reject" : "neutral"}
              active={filter === s}
            />
          ))}
        </div>
      )}

      {/* Scrolling list */}
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-4 md:pt-6 pb-8">
        {isPending ? (
          <ul className="max-w-5xl">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className={`border-b border-border/60 ${i === 0 ? "border-t border-border/60" : ""}`}>
                <div className="py-5 px-4 flex items-center justify-between gap-3 md:gap-6">
                  <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                    <div className="h-8 md:h-9 min-w-11 md:min-w-14.5 bg-muted/80 rounded-sm animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <div className={`h-6 ${i % 2 === 0 ? "w-1/2" : "w-2/5"} bg-muted rounded-sm animate-pulse mb-2`} />
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse" />
                        <span className="text-border hidden sm:inline">·</span>
                        <div className="h-3 w-32 bg-muted/70 rounded-sm animate-pulse hidden sm:inline-block" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-5 shrink-0">
                    <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
                    <div className="h-3 w-12 bg-muted/70 rounded-sm animate-pulse hidden md:inline-block" />
                    <div className="h-4 w-4 bg-muted/70 rounded-sm animate-pulse" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : applications.length === 0 ? (
          <EmptyState
            code={jobCode}
            filter={filter}
            hasAny={totalAll > 0}
            hasSearch={!!search}
            onClearSearch={() => setSearchInput("")}
          />
        ) : (
          <ul className="max-w-5xl">
            {selectedIds.size > 0 && (
              <li className="border-y border-border/60">
                <div className="py-4 flex items-center gap-3 md:gap-5 pl-4">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="accent-primary h-4 w-4 cursor-pointer"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="caps-meta text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                </div>
              </li>
            )}

            {applications.map((app) => (
              <li key={app.id} className="relative group border-b border-border/60">
                <input
                  type="checkbox"
                  className="absolute z-10 left-4 top-1/2 -translate-y-1/2 accent-primary h-4 w-4 cursor-pointer"
                  checked={selectedIds.has(app.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedIds);
                    if (e.target.checked) newSet.add(app.id);
                    else newSet.delete(app.id);
                    setSelectedIds(newSet);
                  }}
                />
                <Link
                  href={`/applications/${app.id}`}
                  className="block py-5 px-4 pl-12 rounded-sm hover:bg-secondary/40 transition-colors after:absolute after:inset-0 after:content-[''] after:rounded-sm"
                >
                  <ApplicationRow application={app} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && applications.length > 0 && (
        <div className="shrink-0 border-t border-border/60 bg-background px-4 sm:px-6 md:px-10">
          <div className="max-w-5xl py-4 flex items-center justify-between gap-4">
            <span className="caps-meta text-muted-foreground tabular">
              {String((page - 1) * pageSize + 1).padStart(2, "0")}–
              {String(Math.min(page * pageSize, total)).padStart(2, "0")} of{" "}
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

function ApplicationRow({ application }: { application: Application }) {
  return (
    <div className="flex items-center justify-between gap-3 md:gap-6">
      <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
        <ScoreChip score={application.matchScore} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif italic text-xl md:text-2xl leading-tight tracking-tight truncate">
            {application.candidateName ?? ""}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-body text-muted-foreground">
            <span className="truncate">{application.candidateLocation ?? ""}</span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">{application.candidateEmail ?? ""}</span>
            <span className="text-border hidden md:inline">·</span>
            <span className="tabular hidden md:inline">
              {application.candidateYearsOfExperience ?? 0}y experience
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <span className={`caps-meta ${STATUS_COLOR[application.status]}`}>
          {STATUS_LABEL[application.status]}
        </span>
        <span className="caps-meta text-muted-foreground tabular">
          {relativeTime(application.receivedAt)}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all shrink-0"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}

function EmptyState({
  code,
  filter,
  hasAny,
  hasSearch,
  onClearSearch,
}: {
  code: string;
  filter: ExtendedFilter;
  hasAny: boolean;
  hasSearch: boolean;
  onClearSearch: () => void;
}) {
  if (!hasAny) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No applications yet.
        </p>
      </div>
    );
  }
  if (hasSearch) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No applicants match.
        </p>
        <button
          onClick={onClearSearch}
          className="mt-8 inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 caps-action text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear search
        </button>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No {FILTER_LABEL[filter].toLowerCase()} candidates.
      </p>
      <Link
        href={`/jobs/${code}`}
        className="mt-4 eyebrow text-primary hover:text-primary/70 transition-colors"
      >
        Show all ←
      </Link>
    </div>
  );
}
