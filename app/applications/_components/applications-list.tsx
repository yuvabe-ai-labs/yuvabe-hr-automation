"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ArrowUpRight, Filter, X } from "lucide-react";
import { useApplicationsAll } from "@/hooks/use-applications";
import { getCandidatesByIds } from "@/services/candidates.service";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import { downloadExcel } from "@/lib/export-excel";
import type { Application, ApplicationStatus } from "@/types/applications";
import type { Job } from "@/types/jobs";
import type { FilterStatus, AllApplicationsPageResult } from "@/services/applications.service";

type TopN = 10 | 15 | 20;
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 10;
const FILTER_STATUSES: FilterStatus[] = ["reviewing", "shortlisted", "rejected"];

const FILTER_LABEL: Record<FilterStatus, string> = {
  reviewing:   "Review",
  shortlisted: "Shortlist",
  rejected:    "Reject",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "text-foreground/70",
  reviewing: "text-foreground",
  shortlisted: "text-[#2F5E7A]",
  rejected: "text-muted-foreground line-through",
  offered: "text-[#3F6B3F]",
};

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScoreChip({ score }: { score: number }) {
  const band = score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const colorClass =
    band === "high"
      ? "text-[#3F6B3F] border-[#3F6B3F]/40 bg-[#3F6B3F]/[0.06]"
      : band === "mid"
      ? "text-[#B8893A] border-[#B8893A]/45 bg-[#B8893A]/[0.06]"
      : "text-primary border-primary/40 bg-primary/[0.06]";
  return (
    <div
      className={`inline-flex items-baseline justify-center min-w-11 md:min-w-14.5 px-2 md:px-2.5 py-1.5 border rounded-sm font-mono text-body-lg md:text-h3 tabular leading-none ${colorClass}`}
      aria-label={`Match score ${score}`}
    >
      {String(score).padStart(2, "0")}
    </div>
  );
}

function buildHref(
  overrides: {
    status?: FilterStatus;
    top?: number | null;
    search?: string | null;
    minScore?: number;
    page?: number;
  },
  current: {
    filter: FilterStatus;
    topN: TopN | null;
    searchQuery: string;
    minScore: number;
  }
): string {
  const params = new URLSearchParams();
  const status  = "status"   in overrides ? overrides.status   : current.filter;
  const top     = "top"      in overrides ? overrides.top      : current.topN;
  const search  = "search"   in overrides ? overrides.search   : current.searchQuery;
  const minScore = "minScore" in overrides ? overrides.minScore : current.minScore;
  const page    = "page"     in overrides ? overrides.page     : undefined;

  if (status && status !== "reviewing") params.set("status", status);
  if (top) params.set("top", String(top));
  if (search) params.set("search", encodeURIComponent(search));
  if (minScore !== 0) params.set("minScore", String(minScore));
  if (page && page > 1) params.set("page", String(page));

  const qs = params.toString();
  return `/applications${qs ? `?${qs}` : ""}`;
}

export function ApplicationsList({
  initialData,
  initialJobs,
  initialFilter,
  initialTopN,
  initialMinScore,
  initialSearch,
  initialPage,
}: {
  initialData: AllApplicationsPageResult;
  initialJobs: Job[];
  initialFilter: FilterStatus;
  initialTopN: TopN | null;
  initialMinScore: number;
  initialSearch: string;
  initialPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Derive current params from URL
  const filter = (
    FILTER_STATUSES.includes(searchParams.get("status") as FilterStatus)
      ? searchParams.get("status")
      : "reviewing"
  ) as FilterStatus;
  const page = Number(searchParams.get("page") ?? "1");
  const topNRaw = searchParams.get("top") ? parseInt(searchParams.get("top")!, 10) : null;
  const topN = (topNRaw !== null && [10, 15, 20].includes(topNRaw) ? topNRaw : null) as TopN | null;
  const minScore = searchParams.get("minScore")
    ? Math.max(0, Math.min(100, parseInt(searchParams.get("minScore")!, 10)))
    : 0;
  const search = searchParams.get("search") ? decodeURIComponent(searchParams.get("search")!) : "";

  const [localSearch, setLocalSearch] = useState(search);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempTopN, setTempTopN] = useState(topN);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Sync localSearch when URL changes externally (back/forward)
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
      if (localSearch) {
        params.set("search", encodeURIComponent(localSearch));
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`/applications?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInitialParams =
    filter === initialFilter &&
    page === initialPage &&
    search === initialSearch &&
    minScore === initialMinScore &&
    topN === initialTopN;

  const { data } = useApplicationsAll(
    { status: filter, search, minScore, page, pageSize: topN ?? PAGE_SIZE },
    isInitialParams ? initialData : undefined
  );

  const applications  = data?.applications  ?? [];
  const total         = data?.total         ?? 0;
  const statusCounts  = data?.statusCounts  ?? { reviewing: 0, shortlisted: 0, rejected: 0 };
  const totalPages    = topN ? 1 : Math.ceil(total / PAGE_SIZE);

  const jobsByCode = new Map<string, Job>(initialJobs.map((j) => [j.code, j]));
  const isFiltered = !!search || minScore > 0 || !!topN;
  const hasData    = total > 0 || isFiltered;

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

  function handleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        applications.forEach((a) => newSet.add(a.id));
      } else {
        applications.forEach((a) => newSet.delete(a.id));
      }
      return newSet;
    });
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) params.delete("page");
    else params.set("page", String(newPage));
    router.push(`/applications?${params.toString()}`, { scroll: false });
  }

  async function getExportData() {
    const selectedApplications = applications.filter((a) => selectedIds.has(a.id));
    const candidateIds = [...new Set(selectedApplications.map((a) => a.candidateId))];
    const jobTitles = new Map(initialJobs.map((j) => [j.code, j.title]));

    const [enrichments, ...notesResults] = await Promise.all([
      getCandidatesByIds(candidateIds),
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
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles, notesByAppId);
      downloadCsv(csv, "candidates.csv");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportExcel() {
    setIsExporting(true);
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      downloadExcel(selectedApplications, enrichments, jobTitles, notesByAppId, "candidates.xlsx");
    } finally {
      setIsExporting(false);
    }
  }

  const sortOrder: SortOrder = "desc";

  return (
    <>
      {/* Status filter chips */}
      {hasData && (
        <div className="mt-6 flex items-center gap-1 flex-wrap ml-6">
          {FILTER_STATUSES.map((s) => (
            <StatusFilterChip
              key={s}
              href={buildHref(
                { status: s },
                { filter, topN, searchQuery: localSearch, minScore }
              )}
              label={FILTER_LABEL[s]}
              count={statusCounts[s]}
              tone={s === "shortlisted" ? "shortlist" : s === "rejected" ? "reject" : "neutral"}
              active={filter === s}
            />
          ))}
        </div>
      )}

      {/* Search + Filter Row */}
      {hasData && (
        <div className="mt-6 relative w-full ml-6">
          <div className="relative w-full max-w-2xl px-4 sm:px-6 md:px-10 -mx-4 sm:-mx-6 md:-mx-10">
            <input
              type="text"
              placeholder="Search by applicant name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-4 py-2 md:py-2.5 pr-10 border border-border rounded-sm bg-background text-foreground text-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                isFiltered
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Open filters"
            >
              <Filter className="h-4 w-4" strokeWidth={2} />
            </button>

            {/* Filter Popover */}
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-sm shadow-lg z-50 p-3 w-64">
                  <div className="space-y-3">
                    {/* Top N Selector */}
                    <div>
                      <label className="block text-xs caps-meta text-muted-foreground mb-1.5">
                        Show Top
                      </label>
                      <div className="flex gap-1.5">
                        {[null, 10, 15, 20].map((n) => (
                          <button
                            key={n ?? "all"}
                            onClick={() => setTempTopN(n as TopN | null)}
                            className={`flex-1 px-2 py-1 rounded-sm text-xs font-medium transition-colors text-center ${
                              n === tempTopN
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {n === null ? "All" : `${n}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Match Score Min */}
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

                    {/* Apply Filters Button */}
                    <div className="pt-1">
                      <Link
                        href={buildHref(
                          { top: tempTopN, minScore: tempMinScore },
                          { filter, topN, searchQuery: localSearch, minScore }
                        )}
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
        </div>
      )}

      {/* Scrolling list */}
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
        {applications.length === 0 ? (
          <EmptyState filter={filter} hasAny={total > 0 || !isFiltered ? data !== undefined && total === 0 && !isFiltered ? false : isFiltered : false} isFiltered={isFiltered} />
        ) : (
          <ul className="max-w-5xl">
            {selectedIds.size > 0 && (
              <li className="relative group border-y border-border/60">
                <div className="py-5 flex items-center gap-3 md:gap-5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="relative z-10 accent-primary h-4 w-4 cursor-pointer"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-xs text-muted-foreground caps-meta">
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
                    className={`absolute z-10 left-4 top-1/2 -translate-y-1/2 accent-primary h-4 w-4 cursor-pointer transition-opacity ${
                      selectedIds.has(app.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
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

      {/* Floating export bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <span className="caps-meta text-muted-foreground tabular">
            {selectedIds.size} selected
          </span>
          <div className="relative group">
            <button
              disabled={isExporting}
              className="caps-action bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isExporting ? "Exporting…" : "Export"}
              <span className="text-[10px] opacity-70">▾</span>
            </button>
            <div className="absolute bottom-full left-0 hidden group-hover:flex flex-col bg-background border border-border rounded-sm shadow-[0_4px_16px_rgb(0,0,0,0.10)] overflow-hidden min-w-37 z-10">
              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="px-3 py-2.5 text-left caps-action text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Export CSV
              </button>
              <div className="border-t border-border" />
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-3 py-2.5 text-left caps-action text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Export as Excel
              </button>
            </div>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            aria-label="Clear selection"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
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

function StatusFilterChip({
  href,
  label,
  count,
  tone,
  active,
}: {
  href: string;
  label: string;
  count: number;
  tone: "neutral" | "shortlist" | "reject";
  active: boolean;
}) {
  const toneClass =
    tone === "shortlist"
      ? "text-[#2F5E7A]"
      : tone === "reject"
      ? "text-primary"
      : "text-muted-foreground";
  return (
    <Link
      href={href}
      scroll={false}
      className={`
        caps-meta tabular
        flex items-center gap-1.5 px-3 py-2.5 md:py-1 rounded-sm
        transition-all duration-150
        ${toneClass}
        ${active ? "bg-secondary opacity-100" : "opacity-65 hover:opacity-100 hover:bg-secondary/40"}
      `}
    >
      <span>{String(count).padStart(2, "0")}</span>
      <span>{label}</span>
    </Link>
  );
}

function EmptyState({
  filter,
  hasAny,
  isFiltered,
}: {
  filter: FilterStatus;
  hasAny: boolean;
  isFiltered: boolean;
}) {
  if (isFiltered || hasAny) {
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
