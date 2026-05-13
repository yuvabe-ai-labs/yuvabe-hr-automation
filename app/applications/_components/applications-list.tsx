"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight, Filter, X } from "lucide-react";
import { useApplications } from "@/hooks/use-applications";
import { getCandidatesByIds } from "@/services/candidates.service";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import type { Application, ApplicationStatus } from "@/types/applications";
import type { Job } from "@/types/jobs";

type TopN = 10 | 15 | 20;
type SortOrder = "asc" | "desc";

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
    status?: ApplicationStatus | null;
    top?: number | null;
    search?: string | null;
    minScore?: number;
  },
  current: {
    filter: ApplicationStatus | null;
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

  if (status) params.set("status", status);
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
  filter: ApplicationStatus | null;
  topN: TopN | null;
  minScore: number;
  searchQuery: string;
}) {
  const { data: allApplications = initialApplications } = useApplications(
    initialApplications
  );

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

  const filtered = filter ? sorted.filter((a) => a.status === filter) : sorted;

  const searched = localSearch
    ? filtered.filter((a) =>
        a.candidateName.toLowerCase().includes(localSearch.toLowerCase())
      )
    : filtered;

  const scored = searched.filter((a) => a.matchScore >= localMinScore);

  const applications = topN !== null ? scored.slice(0, topN) : scored;

  const statusCounts = allApplications.reduce<Record<ApplicationStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { new: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0 }
  );

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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const selectedApplications = applications.filter((a) =>
        selectedIds.has(a.id)
      );
      const candidateIds = [...new Set(selectedApplications.map((a) => a.candidateId))];
      const enrichments = await getCandidatesByIds(candidateIds);
      const jobTitles = new Map(initialJobs.map((j) => [j.code, j.title]));
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles);
      downloadCsv(csv, "candidates.csv");
    } finally {
      setIsExporting(false);
    }
  }, [applications, selectedIds, initialJobs]);

  return (
    <>
      {/* Status filter chips */}
      {allApplications.length > 0 && (
        <div className="mt-6 flex items-center gap-1 flex-wrap ml-6">
          <StatusFilterChip
            href={buildHref(
              { status: null },
              {
                filter,
                topN,
                sortOrder,
                searchQuery: localSearch,
                minScore: localMinScore,
              }
            )}
            label="All"
            count={allApplications.length}
            tone="neutral"
            active={!filter}
          />
          {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
            .filter((s) => statusCounts[s] > 0)
            .map((s) => (
              <StatusFilterChip
                key={s}
                href={buildHref(
                  { status: s },
                  {
                    filter,
                    topN,
                    sortOrder,
                    searchQuery: localSearch,
                    minScore: localMinScore,
                  }
                )}
                label={STATUS_LABEL[s]}
                count={statusCounts[s]}
                tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
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
            {/* Header row with select-all checkbox */}
            <li className="relative group border-b border-border/60 border-t border-border/60">
              <div className="py-5 flex items-center gap-3 md:gap-5">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="relative z-10 accent-primary h-4 w-4 cursor-pointer"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="text-xs text-muted-foreground caps-meta">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : "Select to export"}
                </span>
              </div>
            </li>

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
                    className="absolute z-10 left-4 top-1/2 -translate-y-1/2 accent-primary h-4 w-4 cursor-pointer"
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
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="caps-action bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
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
        <span className="caps-meta text-muted-foreground tabular hidden md:inline">
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
  tone: "neutral" | "shortlist" | "offered";
  active: boolean;
}) {
  const toneClass =
    tone === "shortlist"
      ? "text-[#2F5E7A]"
      : tone === "offered"
      ? "text-[#3F6B3F]"
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
  filter: ApplicationStatus | null;
  hasAny: boolean;
}) {
  if (filter && hasAny) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No {STATUS_LABEL[filter].toLowerCase()} applications.
        </p>
        <Link
          href="/applications"
          className="mt-4 eyebrow text-primary hover:text-primary/70 transition-colors"
        >
          Show all ←
        </Link>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No applications match your filters.
      </p>
      <p className="mt-4 max-w-md text-body-lg text-muted-foreground leading-relaxed">
        Try adjusting your search, score range, or top N selection.
      </p>
    </div>
  );
}
