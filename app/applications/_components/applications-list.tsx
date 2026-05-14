"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpRight, Filter, Loader2, MoreHorizontal, X } from "lucide-react";
import { getCandidatesByIds } from "@/services/candidates.service";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import { downloadExcel } from "@/lib/export-excel";
import type { Application, ApplicationStatus } from "@/types/applications";
import type { Job } from "@/types/jobs";
import type { FilterStatus } from "@/services/applications.service";

type TopN = 10 | 15 | 20;
type SortOrder = "asc" | "desc";
type ExtendedFilter = FilterStatus | "all" | "new";

const FILTER_STATUSES: FilterStatus[] = ["reviewing", "shortlisted", "rejected"];
const ALL_TABS: ExtendedFilter[] = ["all", "new", ...FILTER_STATUSES];

const FILTER_LABEL: Record<ExtendedFilter, string> = {
  all: "All",
  new: "New",
  reviewing: "Review",
  shortlisted: "Shortlist",
  rejected: "Reject",
};

// Groups for client-side JS filtering
const STATUS_GROUP: Record<FilterStatus, ApplicationStatus[]> = {
  reviewing: ["reviewing"],
  shortlisted: ["shortlisted", "offered"],
  rejected: ["rejected"],
};

const EXTENDED_STATUS_GROUP: Record<ExtendedFilter, ApplicationStatus[] | null> = {
  all: null,
  new: ["new"],
  reviewing: ["reviewing"],
  shortlisted: ["shortlisted", "offered"],
  rejected: ["rejected"],
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
      className={`inline-flex items-baseline justify-center min-w-[44px] md:min-w-[58px] px-2 md:px-2.5 py-1.5 border rounded-sm font-mono text-body-lg md:text-h3 tabular leading-none ${colorClass}`}
      aria-label={`Match score ${score}`}
    >
      {String(score).padStart(2, "0")}
    </div>
  );
}

function buildHref(
  overrides: {
    status?: ExtendedFilter;
    top?: number | null;
    search?: string | null;
    minScore?: number;
  },
  current: {
    filter: ExtendedFilter;
    topN: TopN | null;
    sortOrder: SortOrder;
    searchQuery: string;
    minScore: number;
  },
): string {
  const params = new URLSearchParams();
  const status = "status" in overrides ? overrides.status : current.filter;
  const top = "top" in overrides ? overrides.top : current.topN;
  const search = "search" in overrides ? overrides.search : current.searchQuery;
  const minScore =
    "minScore" in overrides ? overrides.minScore : current.minScore;

  // Omit "all" from URL — it's the default
  if (status && status !== "all") params.set("status", status);
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
  filter: ExtendedFilter;
  topN: TopN | null;
  minScore: number;
  searchQuery: string;
}) {
  const allApplications = initialApplications;

  const jobsByCode = new Map<string, Job>(initialJobs.map((j) => [j.code, j]));

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localMinScore, setLocalMinScore] = useState(minScore);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempTopN, setTempTopN] = useState(topN);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportingFormat, setExportingFormat] = useState<"csv" | "excel" | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const sortOrder: SortOrder = "desc"; // /applications doesn't have sort, always desc by receivedAt

  const sorted = allApplications;

  const allowedStatuses = EXTENDED_STATUS_GROUP[filter];
  const filtered =
    allowedStatuses === null
      ? sorted
      : sorted.filter((a) => allowedStatuses.includes(a.status));

  const searched = localSearch
    ? filtered.filter((a) =>
        a.candidateName.toLowerCase().includes(localSearch.toLowerCase()),
      )
    : filtered;

  const scored = searched.filter((a) => a.matchScore >= localMinScore);

  const applications = topN !== null ? scored.slice(0, topN) : scored;

  const groupedCounts: Record<ExtendedFilter, number> = {
    all: allApplications.length,
    new: allApplications.filter((a) => a.status === "new").length,
    reviewing: allApplications.filter((a) => a.status === "reviewing").length,
    shortlisted: allApplications.filter(
      (a) => a.status === "shortlisted" || a.status === "offered",
    ).length,
    rejected: allApplications.filter((a) => a.status === "rejected").length,
  };

  const hasActiveFilters =
    localSearch !== "" || localMinScore !== 0 || topN !== null;

  // Sync select-all checkbox indeterminate state
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleCount = applications.length;
    const selectedCount = Array.from(selectedIds).filter((id) =>
      applications.some((a) => a.id === id),
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
    [selectedIds, applications],
  );

  const getExportData = useCallback(async () => {
    const selectedApplications =
      selectedIds.size > 0
        ? applications.filter((a) => selectedIds.has(a.id))
        : applications;
    const candidateIds = [
      ...new Set(selectedApplications.map((a) => a.candidateId)),
    ];
    const jobTitles = new Map(initialJobs.map((j) => [j.code, j.title]));

    const [enrichments, ...notesResults] = await Promise.all([
      getCandidatesByIds(candidateIds),
      ...selectedApplications.map((a) =>
        fetch(`/api/applications/${a.id}/notes`)
          .then((r) => r.json())
          .then((d) => ({
            id: a.id,
            notes: (d.notes ?? []) as { body: string }[],
          }))
          .catch(() => ({ id: a.id, notes: [] })),
      ),
    ]);

    const notesByAppId = new Map<string, string>(
      notesResults.map(({ id, notes }) => [
        id,
        notes.map((n: { body: string }) => n.body).join(" | "),
      ]),
    );

    return { selectedApplications, enrichments, jobTitles, notesByAppId };
  }, [applications, selectedIds, initialJobs]);

  const handleExportCsv = useCallback(async () => {
    setExportingFormat("csv");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } =
        await getExportData();
      const csv = buildCsvContent(
        selectedApplications,
        enrichments,
        jobTitles,
        notesByAppId,
      );
      downloadCsv(csv, "candidates.csv");
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    setExportingFormat("excel");
    try {
      const { selectedApplications, enrichments, jobTitles, notesByAppId } =
        await getExportData();
      downloadExcel(
        selectedApplications,
        enrichments,
        jobTitles,
        notesByAppId,
        "candidates.xlsx",
      );
    } finally {
      setExportingFormat(null);
    }
  }, [getExportData]);

  return (
    <>
      {/* Title row: "i. Applications" + Search + Controls */}
      <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-4 border-b border-border flex items-center gap-3 md:gap-5">
        {/* i. Applications */}
        <div className="flex items-baseline gap-2 md:gap-3 flex-shrink-0">
          <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
            i.
          </span>
          <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
            Applications
          </span>
        </div>

        {/* Search — grows to fill space, hidden on mobile when nothing selected */}
        {allApplications.length > 0 && (
          <div className="relative flex-1 min-w-0 max-w-sm ml-8 md:ml-12 mt-2">
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

        {/* Filter button + popover */}
        {allApplications.length > 0 && (
          <div className="relative flex-shrink-0 mt-2">
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
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-sm shadow-lg z-50 p-3 w-64">
                  <div className="space-y-3">
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

                    <div>
                      <label className="block text-xs caps-meta text-muted-foreground mb-1.5">
                        Min Score: {tempMinScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempMinScore}
                        onChange={(e) =>
                          setTempMinScore(parseInt(e.target.value))
                        }
                        className="w-full h-1.5 bg-secondary rounded-sm appearance-none cursor-pointer accent-primary"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempMinScore}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            Math.min(100, parseInt(e.target.value) || 0),
                          );
                          setTempMinScore(val);
                        }}
                        className="w-full mt-1 px-2 py-1 border border-border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="pt-1">
                      <Link
                        href={buildHref(
                          {
                            search: localSearch,
                            top: tempTopN,
                            minScore: tempMinScore,
                          },
                          {
                            filter,
                            topN: tempTopN,
                            sortOrder,
                            searchQuery: localSearch,
                            minScore: tempMinScore,
                          },
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
        )}

        {/* Selection count + export — only when items are selected */}
        {selectedIds.size > 0 && (
          <>
            <span className="caps-meta text-muted-foreground tabular whitespace-nowrap flex-shrink-0 mt-2">
              {selectedIds.size} selected
            </span>

            <div className="relative flex-shrink-0 mt-2">
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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsExportMenuOpen(false)}
                    />
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
              onClick={() => {
                setSelectedIds(new Set());
                setIsExportMenuOpen(false);
              }}
              aria-label="Clear selection"
              className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Status filter chips */}
      {allApplications.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 flex-wrap px-4 sm:px-6 md:px-10 py-3">
          {ALL_TABS.map((s) => (
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
                },
              )}
              label={FILTER_LABEL[s]}
              count={groupedCounts[s]}
              tone={
                s === "shortlisted"
                  ? "shortlist"
                  : s === "rejected"
                    ? "reject"
                    : "neutral"
              }
              active={filter === s}
            />
          ))}
        </div>
      )}

      {/* Scrolling list */}
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-4 md:pt-6 pb-12">
        {applications.length === 0 ? (
          <EmptyState filter={filter} hasAny={allApplications.length > 0} />
        ) : (
          <ul className="max-w-5xl">
            {/* Select-all header row — visible when something is selected */}
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
                <li
                  key={app.id}
                  className="relative group border-b border-border/60"
                >
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
