"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Filter, Search, X } from "lucide-react";
import { useApplicationsByJobCode } from "@/hooks/use-applications";
import type { ApplicationsQueryParams, ApplicationsPageResult } from "@/hooks/use-applications";
import { getCandidatesByIds } from "@/services/candidates.service";
import { buildCsvContent, downloadCsv } from "@/lib/export-csv";
import type { Application, ApplicationStatus } from "@/types/applications";

const DEFAULT_PAGE_SIZE = 15;

const VALID_STATUSES: ApplicationStatus[] = [
  "new", "reviewing", "shortlisted", "rejected", "offered",
];

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
  jobCode: string,
  overrides: { status?: ApplicationStatus | null; search?: string | null; minScore?: number; pageSize?: number | null },
  current: { filter: ApplicationStatus | null; searchQuery: string; minScore: number; sortOrder: SortOrder; pageSize: number }
): string {
  const params = new URLSearchParams();
  const status = "status" in overrides ? overrides.status : current.filter;
  const search = "search" in overrides ? overrides.search : current.searchQuery;
  const minScore = "minScore" in overrides ? overrides.minScore : current.minScore;
  const pageSize = "pageSize" in overrides ? overrides.pageSize : current.pageSize;

  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (minScore !== undefined && minScore > 0) params.set("minScore", String(minScore));
  if (current.sortOrder !== "desc") params.set("sort", current.sortOrder);
  if (pageSize && pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));
  // Always reset page when filter changes

  const qs = params.toString();
  return `/jobs/${jobCode}${qs ? `?${qs}` : ""}`;
}

export function JobApplicantsList({
  jobCode,
  jobTitle,
  initialData,
  initialParams,
}: {
  jobCode: string;
  jobTitle: string;
  initialData: ApplicationsPageResult;
  initialParams: ApplicationsQueryParams;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // URL-derived state
  const search = searchParams.get("search") ?? "";
  const filter: ApplicationStatus | null = VALID_STATUSES.includes(
    searchParams.get("status") as ApplicationStatus
  )
    ? (searchParams.get("status") as ApplicationStatus)
    : null;
  const sortOrder: SortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const minScore = Math.max(0, Math.min(100, Number(searchParams.get("minScore") ?? "0")));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSizeParam = searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Math.max(10, Math.min(100, parseInt(pageSizeParam, 10))) : DEFAULT_PAGE_SIZE;

  // Search input with derived-state sync for back/forward nav
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
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempPageSize, setTempPageSize] = useState<number | null>(pageSizeParam ? pageSize : null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const currentParams: ApplicationsQueryParams = {
    status: filter,
    search,
    sort: sortOrder,
    minScore,
    page,
    pageSize,
  };

  const isInitialParams =
    (filter ?? null) === (initialParams.status ?? null) &&
    search === (initialParams.search ?? "") &&
    sortOrder === (initialParams.sort ?? "desc") &&
    minScore === (initialParams.minScore ?? 0) &&
    page === (initialParams.page ?? 1) &&
    pageSize === (initialParams.pageSize ?? DEFAULT_PAGE_SIZE);

  const { data, isPending } = useApplicationsByJobCode(
    jobCode,
    currentParams,
    isInitialParams ? initialData : undefined
  );

  const applications = data?.applications ?? [];
  const total = data?.total ?? 0;
  const statusCounts = data?.statusCounts ?? initialData.statusCounts;
  const totalPages = Math.ceil(total / pageSize);
  const totalAll = Object.values(statusCounts).reduce((s, n) => s + n, 0);

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
      const newSet = new Set(selectedIds);
      if (checked) {
        applications.forEach((a) => newSet.add(a.id));
      } else {
        applications.forEach((a) => newSet.delete(a.id));
      }
      setSelectedIds(newSet);
    },
    [selectedIds, applications]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const selectedApplications = applications.filter((a) => selectedIds.has(a.id));
      const candidateIds = [...new Set(selectedApplications.map((a) => a.candidateId))];
      const enrichments = await getCandidatesByIds(candidateIds);
      const jobTitles = new Map([[jobCode, jobTitle]]);
      const csv = buildCsvContent(selectedApplications, enrichments, jobTitles);
      downloadCsv(csv, `candidates-${jobCode}.csv`);
    } finally {
      setIsExporting(false);
    }
  }, [applications, selectedIds, jobCode, jobTitle]);

  const current = { filter, searchQuery: search, minScore, sortOrder, pageSize };

  return (
    <>
      {/* Status filter chips */}
      {totalAll > 0 && (
        <div className="mt-6 flex items-center gap-1 flex-wrap -ml-2.5">
          <StatusFilterChip
            href={buildHref(jobCode, { status: null }, current)}
            label="All"
            count={totalAll}
            tone="neutral"
            active={!filter}
          />
          {(["shortlisted", "reviewing", "new", "offered", "rejected"] as ApplicationStatus[])
            .filter((s) => statusCounts[s] > 0)
            .map((s) => (
              <StatusFilterChip
                key={s}
                href={buildHref(jobCode, { status: s }, current)}
                label={STATUS_LABEL[s]}
                count={statusCounts[s]}
                tone={s === "shortlisted" ? "shortlist" : s === "offered" ? "offered" : "neutral"}
                active={filter === s}
              />
            ))}
        </div>
      )}

      {/* Search + Filter Row */}
      {totalAll > 0 && (
        <div className="mt-6 relative w-full max-w-2xl">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Search by applicant name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 py-2 md:py-2.5 pr-10 border border-border rounded-sm bg-background text-foreground text-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                minScore > 0 || pageSize !== DEFAULT_PAGE_SIZE ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Open filters"
            >
              <Filter className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-sm shadow-lg z-50 p-3 w-64">
                <div className="space-y-3">
                  {/* Top N selector */}
                  <div>
                    <label className="block text-xs caps-meta text-muted-foreground mb-1.5">
                      Show Top
                    </label>
                    <div className="flex gap-1.5">
                      {([null, 10, 15, 20] as (number | null)[]).map((n) => (
                        <button
                          key={n ?? "all"}
                          onClick={() => setTempPageSize(n)}
                          className={`flex-1 px-2 py-1 rounded-sm text-xs font-medium transition-colors text-center ${
                            n === tempPageSize
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {n === null ? "All" : `${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Min score */}
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
                      href={buildHref(jobCode, { minScore: tempMinScore, pageSize: tempPageSize }, current)}
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
      )}

      {/* Scrolling list */}
      <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
        {!isPending && applications.length === 0 ? (
          <EmptyState
            code={jobCode}
            filter={filter}
            hasAny={totalAll > 0}
            hasSearch={!!search}
            onClearSearch={() => setSearchInput("")}
          />
        ) : (
          <>
            <ul className="max-w-5xl">
              <li className="relative group border-y border-border/60">
                <div className="py-5 flex items-center gap-3 md:gap-5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="relative z-10 accent-primary h-4 w-4 cursor-pointer"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="text-xs text-muted-foreground caps-meta">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select to export"}
                  </span>
                </div>
              </li>

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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="max-w-5xl mt-8 pt-6 border-t border-border/60 flex items-center justify-between gap-4">
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
            )}
          </>
        )}
      </div>

      {/* Floating export bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <span className="caps-meta text-muted-foreground tabular">{selectedIds.size} selected</span>
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
  code,
  filter,
  hasAny,
  hasSearch,
  onClearSearch,
}: {
  code: string;
  filter: ApplicationStatus | null;
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
  if (filter && hasAny) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center pb-24">
        <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
          No {STATUS_LABEL[filter].toLowerCase()} candidates.
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
  return (
    <div className="h-full flex flex-col items-center justify-center text-center pb-24">
      <p className="font-serif italic text-display md:text-display-md text-foreground/55 leading-tight">
        No applicants match your filters.
      </p>
    </div>
  );
}
