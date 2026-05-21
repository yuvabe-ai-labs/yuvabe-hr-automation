"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowUpRight, Filter, Loader2, MoreHorizontal, X } from "lucide-react";
import { useApplicationsAll } from "@/hooks/use-applications";
import { useAllJobs } from "@/hooks/use-jobs";
import { useGetCandidatesByIds } from "@/hooks/use-candidates";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import { downloadExcel } from "@/lib/export-excel";
import { relativeTime } from "@/lib/utils";
import { STATUS_LABEL, STATUS_COLOR, FILTER_LABEL, ALL_FILTER_TABS } from "@/lib/constants";
import type { ExtendedFilter } from "@/lib/constants";
import { ScoreChip } from "@/components/shared/score-chip";
import { StatusFilterChip } from "@/components/shared/status-filter-chip";
import type { Application } from "@/types/applications";
import type { FilterStatus } from "@/services/applications.service";

type TopN = 10 | 15 | 20;

const PAGE_SIZE = 10;


function buildHref(
  overrides: {
    status?: ExtendedFilter;
    top?: number | null;
    search?: string | null;
    minScore?: number;
    page?: number;
    dateFrom?: string | null;
    dateTo?: string | null;
    minYearsExp?: number | null;
    maxYearsExp?: number | null;
    sort?: "newest" | "oldest";
  },
  current: {
    filter: ExtendedFilter;
    topN: TopN | null;
    searchQuery: string;
    minScore: number;
    dateFrom?: string;
    dateTo?: string;
    minYearsExp?: number;
    maxYearsExp?: number;
    sort: "newest" | "oldest";
  }
): string {
  const params = new URLSearchParams();
  const status      = "status"      in overrides ? overrides.status      : current.filter;
  const top         = "top"         in overrides ? overrides.top         : current.topN;
  const search      = "search"      in overrides ? overrides.search      : current.searchQuery;
  const minScore    = "minScore"    in overrides ? overrides.minScore    : current.minScore;
  const page        = "page"        in overrides ? overrides.page        : undefined;
  const dateFrom    = "dateFrom"    in overrides ? overrides.dateFrom    : current.dateFrom;
  const dateTo      = "dateTo"      in overrides ? overrides.dateTo      : current.dateTo;
  const minYearsExp = "minYearsExp" in overrides ? overrides.minYearsExp : current.minYearsExp;
  const maxYearsExp = "maxYearsExp" in overrides ? overrides.maxYearsExp : current.maxYearsExp;
  const sort        = "sort"        in overrides ? overrides.sort        : current.sort;

  if (status && status !== "all") params.set("status", status);
  if (top) params.set("top", String(top));
  if (search) params.set("search", encodeURIComponent(search));
  if (minScore !== 0) params.set("minScore", String(minScore));
  if (page && page > 1) params.set("page", String(page));
  if (dateFrom)    params.set("dateFrom", dateFrom);
  if (dateTo)      params.set("dateTo", dateTo);
  if (minYearsExp) params.set("minYearsExp", String(minYearsExp));
  if (maxYearsExp) params.set("maxYearsExp", String(maxYearsExp));
  if (sort === "oldest") params.set("sort", "oldest");

  const qs = params.toString();
  return `/applications${qs ? `?${qs}` : ""}`;
}

export function ApplicationsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Derive current params from URL
  const filter = (
    ALL_FILTER_TABS.includes(searchParams.get("status") as ExtendedFilter)
      ? searchParams.get("status")
      : "all"
  ) as ExtendedFilter;
  const page = Number(searchParams.get("page") ?? "1");
  const topNRaw = searchParams.get("top") ? parseInt(searchParams.get("top")!, 10) : null;
  const topN = (topNRaw !== null && [10, 15, 20].includes(topNRaw) ? topNRaw : null) as TopN | null;
  const minScore = searchParams.get("minScore")
    ? Math.max(0, Math.min(100, parseInt(searchParams.get("minScore")!, 10)))
    : 0;
  const search = searchParams.get("search") ? decodeURIComponent(searchParams.get("search")!) : "";
  const dateFrom    = searchParams.get("dateFrom") ?? undefined;
  const dateTo      = searchParams.get("dateTo") ?? undefined;
  const minYearsExp = searchParams.get("minYearsExp") ? Math.max(0, parseInt(searchParams.get("minYearsExp")!, 10)) : undefined;
  const maxYearsExp = searchParams.get("maxYearsExp") ? Math.max(0, parseInt(searchParams.get("maxYearsExp")!, 10)) : undefined;
  const sort        = searchParams.get("sort") === "oldest" ? "oldest" as const : "newest" as const;

  const [localSearch, setLocalSearch] = useState(search);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempTopN, setTempTopN] = useState(topN);
  const [tempDateFrom, setTempDateFrom] = useState(dateFrom ?? "");
  const [tempDateTo, setTempDateTo] = useState(dateTo ?? "");
  const [tempMinYearsExp, setTempMinYearsExp] = useState<number | "">(minYearsExp ?? "");
  const [tempMaxYearsExp, setTempMaxYearsExp] = useState<number | "">(maxYearsExp ?? "");
  const [tempSort, setTempSort] = useState<"newest" | "oldest">(sort);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Sync localSearch when URL changes (back/forward navigation)
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce localSearch → URL
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch) params.set("search", encodeURIComponent(localSearch));
      else params.delete("search");
      params.delete("page");
      router.replace(`/applications?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const apiStatus = filter === "all" ? undefined : (filter as FilterStatus | "new");

  // Fetch paginated + filtered applications across all jobs
  const { data, isLoading, isFetching } = useApplicationsAll(
    { status: apiStatus, search, minScore, page, pageSize: topN ?? PAGE_SIZE, dateFrom, dateTo, minYearsExp, maxYearsExp, sort }
  );

  // Fetch jobs for row title lookup and export (all statuses — archived jobs have applications too)
  const { data: jobs = [] } = useAllJobs();

  // Imperative fetch for candidate enrichment (used during export only)
  const { mutateAsync: fetchCandidates } = useGetCandidatesByIds();

  const applications = useMemo(() => data?.applications ?? [], [data]);
  const total        = data?.total        ?? 0;
  const statusCounts = data?.statusCounts ?? { new: 0, reviewing: 0, shortlisted: 0, rejected: 0 };
  const totalPages   = topN ? 1 : Math.ceil(total / PAGE_SIZE);

  const allCount = data?.allTotal ?? (statusCounts.new + statusCounts.reviewing + statusCounts.shortlisted + statusCounts.rejected);
  const groupedCounts: Record<ExtendedFilter, number> = {
    all:         allCount,
    new:         statusCounts.new,
    reviewing:   statusCounts.reviewing,
    shortlisted: statusCounts.shortlisted,
    rejected:    statusCounts.rejected,
  };

  const jobsByCode = new Map(jobs.map((j) => [j.code, j]));
  const hasActiveFilters = !!search || minScore > 0 || !!topN || !!dateFrom || !!dateTo || !!minYearsExp || !!maxYearsExp || sort === "oldest";
  const hasData = allCount > 0;
  const showSkeleton = isLoading || (isFetching && applications.length === 0);

  // Sync select-all checkbox indeterminate state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleCount  = applications.length;
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
        if (checked) applications.forEach((a) => newSet.add(a.id));
        else applications.forEach((a) => newSet.delete(a.id));
        return newSet;
      });
    },
    [applications]
  );

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) params.delete("page");
    else params.set("page", String(newPage));
    router.push(`/applications?${params.toString()}`, { scroll: false });
  }

  const getExportData = useCallback(async () => {
    const selectedApplications =
      selectedIds.size > 0 ? applications.filter((a) => selectedIds.has(a.id)) : applications;
    const candidateIds = [...new Set(selectedApplications.map((a) => a.candidateId))];
    const jobTitles = new Map(jobs.map((j) => [j.code, j.title]));

    const [enrichments, ...notesResults] = await Promise.all([
      fetchCandidates(candidateIds),
      ...selectedApplications.map((a) =>
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

    return { selectedApplications, enrichments, jobTitles, notesByAppId };
  }, [applications, jobs, selectedIds, fetchCandidates]);

  const handleExportCsv = useCallback(async () => {
    setExportingFormat("csv");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles, notesByAppId);
      downloadCsv(csv, "candidates.csv");
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    setExportingFormat("excel");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      downloadExcel(selectedApplications, enrichments, jobTitles, notesByAppId, "candidates.xlsx");
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData]);

  return (
    <>
      {/* Title row: "i. Applications" + Search + Controls */}
      <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-4 border-b border-border flex items-center gap-3 md:gap-5">
        <div className="flex items-baseline gap-2 md:gap-3 flex-shrink-0">
          <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
            i.
          </span>
          <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
            Applications
          </span>
        </div>

        {hasData && (
          <div className="relative flex-1 min-w-0 max-w-sm ml-8 md:ml-12">
            <input
              type="text"
              placeholder="Search by applicant name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 border border-border rounded-sm bg-background text-foreground text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {hasData && (
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <Link
                href={buildHref(
                  { minScore: 0, dateFrom: null, dateTo: null, minYearsExp: null, maxYearsExp: null, sort: "newest" },
                  { filter, topN, searchQuery: localSearch, minScore, dateFrom, dateTo, minYearsExp, maxYearsExp, sort }
                )}
                onClick={() => { setTempMinScore(0); setTempDateFrom(""); setTempDateTo(""); setTempMinYearsExp(""); setTempMaxYearsExp(""); setTempSort("newest"); }}
                className="caps-action text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </Link>
            )}
            <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 border rounded-sm transition-colors ${
                hasActiveFilters
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

                    {/* Sort */}
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">Sort By</p>
                      <div className="flex gap-1.5">
                        {(["newest", "oldest"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setTempSort(s)}
                            className={`caps-meta px-2.5 py-1 rounded-sm border transition-colors ${
                              tempSort === s
                                ? "border-primary text-primary"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            }`}
                          >
                            {s === "newest" ? "Newest" : "Oldest"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min Score */}
                    <div>
                      <label className="block caps-meta text-muted-foreground mb-1.5">
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

                    {/* Date Applied */}
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">Date Applied</p>
                      <div className="space-y-2">
                        <div>
                          <label className="caps-meta text-muted-foreground/70 block mb-1">From</label>
                          <input
                            type="date"
                            value={tempDateFrom}
                            onChange={(e) => setTempDateFrom(e.target.value)}
                            className="w-full px-2 py-1.5 border border-border rounded-sm bg-background text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          />
                        </div>
                        <div>
                          <label className="caps-meta text-muted-foreground/70 block mb-1">To</label>
                          <input
                            type="date"
                            value={tempDateTo}
                            onChange={(e) => setTempDateTo(e.target.value)}
                            className="w-full px-2 py-1.5 border border-border rounded-sm bg-background text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Years of Experience */}
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">Experience</p>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { label: "Any",      min: "" as const, max: "" as const },
                          { label: "0–2 yrs",  min: 0 as const,  max: 2 as const  },
                          { label: "3–5 yrs",  min: 3 as const,  max: 5 as const  },
                          { label: "6–10 yrs", min: 6 as const,  max: 10 as const },
                          { label: "10+ yrs",  min: 10 as const, max: "" as const },
                        ] as const).map((range) => {
                          const active = tempMinYearsExp === range.min && tempMaxYearsExp === range.max;
                          return (
                            <button
                              key={range.label}
                              onClick={() => { setTempMinYearsExp(range.min); setTempMaxYearsExp(range.max); }}
                              className={`caps-meta px-2.5 py-1 rounded-sm border transition-colors ${
                                active
                                  ? "border-primary text-primary"
                                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                              }`}
                            >
                              {range.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={buildHref(
                          {
                            top: tempTopN,
                            minScore: tempMinScore,
                            dateFrom: tempDateFrom || null,
                            dateTo: tempDateTo || null,
                            minYearsExp: tempMinYearsExp === "" ? null : (tempMinYearsExp as number),
                            maxYearsExp: tempMaxYearsExp === "" ? null : (tempMaxYearsExp as number),
                            sort: tempSort,
                          },
                          { filter, topN, searchQuery: localSearch, minScore, dateFrom, dateTo, minYearsExp, maxYearsExp, sort }
                        )}
                        onClick={() => setIsFilterOpen(false)}
                        className="block w-full px-2 py-1.5 bg-primary text-primary-foreground rounded-sm caps-action transition-colors hover:bg-primary/90 text-center"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {selectedIds.size > 0 && (
          <>
            <span className="caps-meta text-muted-foreground tabular whitespace-nowrap flex-shrink-0">
              {selectedIds.size} selected
            </span>

            <div className="relative flex-shrink-0">
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
                      {exportingFormat === "csv" && <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />}
                      {exportingFormat === "csv" ? "Exporting…" : "Export CSV"}
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={() => { handleExportExcel(); setIsExportMenuOpen(false); }}
                      disabled={!!exportingFormat}
                      className="w-full px-3 py-2.5 text-left caps-action text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {exportingFormat === "excel" && <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />}
                      {exportingFormat === "excel" ? "Exporting…" : "Export as Excel"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => { setSelectedIds(new Set()); setIsExportMenuOpen(false); }}
              aria-label="Clear selection"
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Status filter tabs */}
      {hasData && (
        <div className="flex-shrink-0 flex items-center gap-1 flex-wrap px-4 sm:px-6 md:px-10 py-3">
          {ALL_FILTER_TABS.map((s) => (
            <StatusFilterChip
              key={s}
              href={buildHref(
                { status: s, page: 1 },
                { filter, topN, searchQuery: localSearch, minScore, dateFrom, dateTo, minYearsExp, maxYearsExp, sort }
              )}
              label={FILTER_LABEL[s]}
              count={groupedCounts[s]}
              tone={s === "shortlisted" ? "shortlist" : s === "rejected" ? "reject" : "neutral"}
              active={filter === s}
            />
          ))}
        </div>
      )}

      {/* Scrolling list */}
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-4 md:pt-6 pb-12">
        {showSkeleton ? (
          <ul className="max-w-5xl">
            {Array.from({ length: 10 }).map((_, i) => (
              <li key={i} className={`border-b border-border/60 ${i === 0 ? "border-t border-border/60" : ""}`}>
                <div className="py-5 px-4 flex items-center justify-between gap-3 md:gap-6">
                  <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                    <div className="h-7 md:h-8 min-w-11 md:min-w-13 bg-muted/80 rounded-sm animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <div className={`h-5 ${i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-2/5" : "w-3/5"} bg-muted rounded-sm animate-pulse mb-2`} />
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-28 bg-muted/70 rounded-sm animate-pulse" />
                        <span className="text-border hidden sm:inline">·</span>
                        <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse hidden sm:inline-block" />
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
          <EmptyState filter={filter} hasAny={allCount > 0} />
        ) : (
          <ul className="max-w-5xl">
            {selectedIds.size > 0 && (
              <li className="border-b border-border/60 border-t border-border/60">
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

            {applications.map((app) => {
              const job = jobsByCode.get(app.jobCode);
              if (!job) return null;
              return (
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
                    <ApplicationRow application={app} jobTitle={job.title} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && applications.length > 0 && (
        <div className="shrink-0 border-t border-border/60 bg-background px-4 sm:px-6 md:px-10">
          <div className="max-w-5xl py-4 flex items-center justify-between gap-4">
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
                {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
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
    </>
  );
}

function ApplicationRow({
  application,
  jobTitle,
}: {
  application: Application;
  jobTitle: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:gap-6">
      <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
        <ScoreChip score={application.matchScore} />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif italic text-xl md:text-2xl leading-tight tracking-tight truncate">
            {application.candidateName ?? ""}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-body text-muted-foreground">
            <span className="truncate">{jobTitle}</span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="hidden sm:inline truncate">
              {application.candidateLocation ?? ""}
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
  filter,
  hasAny,
}: {
  filter: ExtendedFilter;
  hasAny: boolean;
}) {
  if (hasAny) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No {FILTER_LABEL[filter].toLowerCase()} applications.
        </p>
        <p className="mt-4 max-w-md text-body-lg text-muted-foreground leading-relaxed">
          Try adjusting your search or score range.
        </p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No applications yet.
      </p>
    </div>
  );
}
