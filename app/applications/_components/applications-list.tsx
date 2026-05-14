"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight, Filter, X } from "lucide-react";
import { getCandidatesByIds } from "@/services/candidates.service";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import { downloadExcel } from "@/lib/export-excel";
import type { Application, ApplicationStatus } from "@/types/applications";
import type { Job } from "@/types/jobs";
import type { FilterStatus } from "@/services/applications.service";

type TopN = 10 | 15 | 20;
type SortOrder = "asc" | "desc";

const FILTER_STATUSES: FilterStatus[] = ["reviewing", "shortlisted", "rejected"];

const FILTER_LABEL: Record<FilterStatus, string> = {
  reviewing:   "Review",
  shortlisted: "Shortlist",
  rejected:    "Reject",
};

// Groups for client-side JS filtering
const STATUS_GROUP: Record<FilterStatus, ApplicationStatus[]> = {
  reviewing:   ["reviewing", "new"],
  shortlisted: ["shortlisted", "offered"],
  rejected:    ["rejected"],
};

// Used for individual row display
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
  const band =
    score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const colorClass =
    band === "high"
      ? "text-[#3F6B3F] border-[#3F6B3F]/40 bg-[#3F6B3F]/[0.06]"
      : band === "mid"
      ? "text-[#B8893A] border-[#B8893A]/45 bg-[#B8893A]/[0.06]"
      : "text-primary border-primary/40 bg-primary/[0.06]";
  return (
    <div
      className={`inline-flex items-baseline justify-center min-w-[44px] md:min-w-[58px] px-2 md:px-2.5 py-1.5 border rounded-sm font-mono text-body-lg md:text-h3 tabular leading-none ${colorClass}`}
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
  },
  current: {
    filter: FilterStatus;
    topN: TopN | null;
    sortOrder: SortOrder;
    searchQuery: string;
    minScore: number;
  }
): string {
  const params = new URLSearchParams();
  const status = "status" in overrides ? overrides.status : current.filter;
  const top = "top" in overrides ? overrides.top : current.topN;
  const search = "search" in overrides ? overrides.search : current.searchQuery;
  const minScore = "minScore" in overrides ? overrides.minScore : current.minScore;

  // Omit "reviewing" from URL — it's the default
  if (status && status !== "reviewing") params.set("status", status);
  if (top) params.set("top", String(top));
  if (search) params.set("search", encodeURIComponent(search));
  if (minScore !== 0) params.set("minScore", String(minScore));

  const qs = params.toString();
  return `/applications${qs ? `?${qs}` : ""}`;
}

export function ApplicationsList({
  initialApplications,
  initialJobs,
  filter,
  topN,
  minScore,
  searchQuery,
}: {
  initialApplications: Application[];
  initialJobs: Job[];
  filter: FilterStatus;
  topN: TopN | null;
  minScore: number;
  searchQuery: string;
}) {
  const allApplications = initialApplications;

  const jobsByCode = new Map<string, Job>(initialJobs.map((j) => [j.code, j]));

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localMinScore, setLocalMinScore] = useState(minScore);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempTopN, setTempTopN] = useState(topN);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const sortOrder: SortOrder = "desc"; // /applications doesn't have sort, always desc by receivedAt

  const sorted = allApplications;

  const filtered = sorted.filter((a) =>
    (STATUS_GROUP[filter] as ApplicationStatus[]).includes(a.status)
  );

  const searched = localSearch
    ? filtered.filter((a) =>
        a.candidateName.toLowerCase().includes(localSearch.toLowerCase())
      )
    : filtered;

  const scored = searched.filter((a) => a.matchScore >= localMinScore);

  const applications = topN !== null ? scored.slice(0, topN) : scored;

  const groupedCounts: Record<FilterStatus, number> = {
    reviewing:   allApplications.filter((a) => a.status === "reviewing" || a.status === "new").length,
    shortlisted: allApplications.filter((a) => a.status === "shortlisted" || a.status === "offered").length,
    rejected:    allApplications.filter((a) => a.status === "rejected").length,
  };

  const hasActiveFilters =
    localSearch !== "" || localMinScore !== 0 || topN !== null;

  // Sync select-all checkbox indeterminate state
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
      if (checked) {
        const newSet = new Set(selectedIds);
        applications.forEach((a) => newSet.add(a.id));
        setSelectedIds(newSet);
      } else {
        const newSet = new Set(selectedIds);
        applications.forEach((a) => newSet.delete(a.id));
        setSelectedIds(newSet);
      }
    },
    [selectedIds, applications]
  );

  const getExportData = useCallback(async () => {
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
  }, [applications, selectedIds, initialJobs]);

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles, notesByAppId);
      downloadCsv(csv, "candidates.csv");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } = await getExportData();
      downloadExcel(selectedApplications, enrichments, jobTitles, notesByAppId, "candidates.xlsx");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  return (
    <>
      {/* Status filter chips */}
      {allApplications.length > 0 && (
        <div className="mt-6 flex items-center gap-1 flex-wrap ml-6">
          {FILTER_STATUSES.map((s) => (
            <StatusFilterChip
              key={s}
              href={buildHref(
                { status: s },
                { filter, topN, sortOrder, searchQuery: localSearch, minScore: localMinScore }
              )}
              label={FILTER_LABEL[s]}
              count={groupedCounts[s]}
              tone={s === "shortlisted" ? "shortlist" : s === "rejected" ? "reject" : "neutral"}
              active={filter === s}
            />
          ))}
        </div>
      )}

      {/* Search + Filter Row */}
      {allApplications.length > 0 && (
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
                hasActiveFilters
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
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTempMinScore(val);
                        }}
                        className="w-full h-1.5 bg-secondary rounded-sm appearance-none cursor-pointer accent-primary"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempMinScore}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          setTempMinScore(val);
                        }}
                        className="w-full mt-1 px-2 py-1 border border-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Apply Filters Button */}
                    <div className="pt-1">
                      <Link
                        href={buildHref(
                          { search: localSearch, top: tempTopN, minScore: tempMinScore },
                          {
                            filter,
                            topN: tempTopN,
                            sortOrder,
                            searchQuery: localSearch,
                            minScore: tempMinScore,
                          }
                        )}
                        onClick={() => {
                          setLocalMinScore(tempMinScore);
                          setIsFilterOpen(false);
                        }}
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
          <EmptyState filter={filter} hasAny={allApplications.length > 0} />
        ) : (
          <ul className="max-w-5xl">
            {/* Header row with select-all — only visible when something is selected */}
            {selectedIds.size > 0 && (
              <li className="relative group border-b border-border/60 border-t border-border/60">
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

            {applications.map((app, idx) => {
              const job = jobsByCode.get(app.jobCode);
              if (!job) return null;
              return (
                <li
                  key={app.id}
                  className={`relative group border-b border-border/60 ${
                    idx === applications.length - 1 ? "" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className={`absolute z-10 left-4 top-1/2 -translate-y-1/2 accent-primary h-4 w-4 cursor-pointer transition-opacity ${
                      selectedIds.has(app.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    checked={selectedIds.has(app.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds);
                      if (e.target.checked) {
                        newSet.add(app.id);
                      } else {
                        newSet.delete(app.id);
                      }
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
            {/* No gap between button and menu — hover area is continuous */}
            <div className="absolute bottom-full left-0 hidden group-hover:flex flex-col bg-background border border-border rounded-sm shadow-[0_4px_16px_rgb(0,0,0,0.10)] overflow-hidden min-w-[148px] z-10">
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
      <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
        <span className={`caps-meta ${STATUS_COLOR[application.status]}`}>
          {STATUS_LABEL[application.status]}
        </span>
        <span className="caps-meta text-muted-foreground tabular">
          {relativeTime(application.receivedAt)}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-px group-hover:-translate-y-px transition-all flex-shrink-0"
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
}: {
  filter: FilterStatus;
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
