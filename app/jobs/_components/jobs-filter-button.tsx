"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types/jobs";

const JOB_TYPE_LABELS: Record<NonNullable<Job["type"]>, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "contract": "Contract",
  "internship": "Internship",
};

const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as NonNullable<Job["type"]>[];

export function JobsFilterButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const rawTab = searchParams.get("tab");
  const isDraft = rawTab === "draft";

  const rawType = searchParams.get("type");
  const currentType = (JOB_TYPES as string[]).includes(rawType ?? "")
    ? (rawType as Job["type"])
    : undefined;
  const currentDateFrom = searchParams.get("dateFrom") ?? undefined;
  const currentDateTo = searchParams.get("dateTo") ?? undefined;

  const currentSort = searchParams.get("sort") === "oldest" ? "oldest" as const : "newest" as const;

  const hasActiveFilters = !!(currentType || currentDateFrom || currentDateTo || currentSort === "oldest");

  function applyFilters(vals: {
    type?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    sort: "newest" | "oldest";
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (vals.type)          params.set("type", vals.type);
    else                    params.delete("type");
    if (vals.dateFrom)      params.set("dateFrom", vals.dateFrom);
    else                    params.delete("dateFrom");
    if (vals.dateTo)        params.set("dateTo", vals.dateTo);
    else                    params.delete("dateTo");
    if (vals.sort === "oldest") params.set("sort", "oldest");
    else                        params.delete("sort");
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("type");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("sort");
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="caps-action text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear filters
        </button>
      )}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Filter jobs"
          className={`p-1.5 border rounded-sm transition-colors ${
            hasActiveFilters
              ? "text-primary border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Filter className="h-4 w-4" strokeWidth={2} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <FilterPanel
              currentType={currentType}
              currentDateFrom={currentDateFrom}
              currentDateTo={currentDateTo}
              currentSort={currentSort}
              isDraft={isDraft}
              onApply={applyFilters}
              onClose={() => setOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}

function FilterPanel({
  currentType,
  currentDateFrom,
  currentDateTo,
  currentSort,
  isDraft,
  onApply,
  onClose: _onClose,
}: {
  currentType?: Job["type"];
  currentDateFrom?: string;
  currentDateTo?: string;
  currentSort: "newest" | "oldest";
  isDraft: boolean;
  onApply: (vals: { type?: string | null; dateFrom?: string | null; dateTo?: string | null; sort: "newest" | "oldest" }) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<Job["type"] | null>(currentType ?? null);
  const [dateFrom, setDateFrom] = useState(currentDateFrom ?? "");
  const [dateTo, setDateTo] = useState(currentDateTo ?? "");
  const [sort, setSort] = useState<"newest" | "oldest">(currentSort);

  return (
    <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-sm shadow-lg z-50 p-3 w-64 space-y-3">
      {/* Sort */}
      <div>
        <p className="caps-meta text-muted-foreground mb-2">Sort By</p>
        <div className="flex gap-1.5">
          {(["newest", "oldest"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`caps-meta px-2.5 py-1 rounded-sm border transition-colors ${
                sort === s
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {s === "newest" ? "Newest" : "Oldest"}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div>
        <p className="caps-meta text-muted-foreground mb-2">Job Type</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setType(null)}
            className={`caps-meta px-2.5 py-1 rounded-sm border transition-colors ${
              type === null
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            All
          </button>
          {JOB_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`caps-meta px-2.5 py-1 rounded-sm border transition-colors ${
                type === t
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {JOB_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Date Posted range */}
      <div>
        <p className="caps-meta text-muted-foreground mb-2">{isDraft ? "Date Created" : "Date Posted"}</p>
        <div className="space-y-2">
          <div>
            <label className="caps-meta text-muted-foreground/70 block mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2 py-1.5 border border-border rounded-sm bg-background text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>
          <div>
            <label className="caps-meta text-muted-foreground/70 block mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2 py-1.5 border border-border rounded-sm bg-background text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-1">
        <Button
          size="sm"
          onClick={() => onApply({ type: type ?? null, dateFrom: dateFrom || null, dateTo: dateTo || null, sort })}
          className="block w-full rounded-sm caps-action"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

