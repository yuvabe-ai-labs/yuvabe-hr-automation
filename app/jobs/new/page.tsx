"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileText, ArrowUpRight, TriangleAlert, OctagonAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type {
  Criterion,
  ExtractCriteriaResult,
  Importance,
} from "@/lib/prompts/extractCriteria.v1";
import { IMPORTANCE_LABEL, IMPORTANCE_COLOR } from "@/lib/constants";
import { Eyebrow } from "@/components/shared/eyebrow";
import NavTab from "@/app/jobs/_components/nav-tab";
import { PageFooter } from "@/app/_components/page-footer";

const ACCEPTED = ".pdf,.docx,.txt,.md";

const CATEGORY_LABEL: Record<Criterion["category"], string> = {
  skill: "Skills",
  experience: "Experience",
  education: "Education",
  domain: "Domain",
  other: "Other",
};

const CATEGORY_ORDER: Criterion["category"][] = [
  "skill",
  "experience",
  "education",
  "domain",
  "other",
];

/** Three opacity tiers within the warm ink palette — no new accent colors.
 *  "nice" climbs to foreground on hover so the muted state still gets a
 *  visible intensity bump when the trigger is being interacted with. */

type Result = ExtractCriteriaResult & {
  jd_text: string;
  file: { name: string; size: number };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* —————————————————————————— small typographic atoms —————————————————————————— */

function ColumnMarker({
  numeral,
  title,
}: {
  numeral: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4 mb-6 md:mb-10">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
        {title}
      </span>
    </div>
  );
}

function HairRule() {
  return <div className="h-px bg-border w-full" />;
}

/* —————————————————————————— page —————————————————————————— */

export default function NewJobPage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  /** Local editable copy of result.criteria. The recruiter can change importance per row. */
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  /** Save state: idle | saving | saved (briefly before redirect). */
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewOpen, setPreviewOpen] = useState(false);

  function pick() {
    // Clear the input's value first so the same file can be re-picked.
    // Without this, picking the same path twice in a row doesn't fire onChange.
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  function reset() {
    setFile(null);
    setResult(null);
    setCriteria([]);
    setError(null);
    setSaveState("idle");
    setSaveError(null);
    setPreviewOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Reset on (re-)entering this route. Next.js's client router cache can
  // preserve component state across navigations — without this, going to
  // /applications and back leaves the drop zone hidden because `file` and
  // `result` are still set from the previous visit.
  useEffect(() => {
    if (pathname === "/jobs/new") {
      reset();
    }
    // We intentionally don't depend on `reset` to avoid the effect re-running
    // on every render. `reset` only references state setters (stable identities).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function submit(f: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCriteria([]);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/extract-criteria", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
      setCriteria(data.criteria);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract criteria");
    } finally {
      setLoading(false);
    }
  }

  function setImportance(idx: number, importance: Importance) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, importance } : c))
    );
  }

  async function saveJob() {
    if (!result) return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title_suggestion,
          description: result.jd_text,
          criteria,
          department: result.department || undefined,
          location: result.location || undefined,
          compensation: result.compensation || undefined,
          level: result.level || undefined,
          type: result.job_type || undefined,
          summary: result.summary || undefined,
          responsibilities: result.responsibilities ?? [],
          requirements: result.requirements ?? [],
          niceToHave: result.nice_to_have ?? [],
          portfolioRequirement: result.portfolio_requirement || undefined,
          benefitsRemote: result.benefits_remote ?? [],
          benefitsInPerson: result.benefits_inperson ?? [],
          workCulture: result.work_culture ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      router.push(`/jobs?new=${data.job.code}`);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function onFile(f: File) {
    setFile(f);
    setResult(null);
    setError(null);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  const grouped = result
    ? CATEGORY_ORDER.map((cat) => ({
        category: cat,
        items: criteria
          .map((c, idx) => ({ ...c, idx }))
          .filter((c) => c.category === cat),
      })).filter((g) => g.items.length > 0)
    : [];

  const canSave =
    result !== null &&
    !!result.department?.trim() &&
    !!result.level?.trim() &&
    !!result.job_type?.trim() &&
    !!result.location?.trim() &&
    !!result.compensation?.trim() &&
    !!result.summary?.trim() &&
    (result.responsibilities?.length ?? 0) > 0 &&
    (result.requirements?.length ?? 0) > 0 &&
    (result.nice_to_have?.length ?? 0) > 0;

  const missingRequired: string[] = [];
  if (!result?.department?.trim()) missingRequired.push("Department");
  if (!result?.level?.trim()) missingRequired.push("Level");
  if (!result?.job_type?.trim()) missingRequired.push("Type");
  if (!result?.location?.trim()) missingRequired.push("Location");
  if (!result?.compensation?.trim()) missingRequired.push("Compensation");
  if (!result?.summary?.trim()) missingRequired.push("Summary");
  if (!(result?.responsibilities?.length)) missingRequired.push("Responsibilities");
  if (!(result?.requirements?.length)) missingRequired.push("Requirements");
  if (!(result?.nice_to_have?.length)) missingRequired.push("Nice to Have");

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header — brand + tabs —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        {/* Brand row */}
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-lg leading-none">
              Yuvabe
            </span>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            <Eyebrow>
              <span className="tabular">01</span> &nbsp;/&nbsp;{" "}
              <span className="hidden sm:inline">New job</span>
              <span className="sm:hidden">New</span>
            </Eyebrow>
            {result && (
              <button
                onClick={reset}
                className="caps-action text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="hidden sm:inline">Start over →</span>
                <span className="sm:hidden">Reset →</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs row */}
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto">
          <NavTab href="/jobs" label="Jobs" prefix="/jobs" />
        </nav>
      </header>

      {/* —————— Two-column body (stacks on mobile) —————— */}
      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-2 md:overflow-hidden">
        {/* ════════ LEFT — the source ════════ */}
        <section className="border-b md:border-b-0 md:border-r border-border flex flex-col md:overflow-hidden">
          <div className="md:flex-1 flex flex-col px-4 sm:px-6 md:px-12 pt-6 md:pt-12 pb-6 md:pb-8 md:overflow-y-auto">
            <ColumnMarker numeral="i" title="The job" />

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={onChange}
              className="hidden"
            />

            {/* —— IDLE: invitation —— */}
            {!file && !loading && (
              <div
                onClick={pick}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`
                  relative cursor-pointer flex-1
                  flex flex-col items-center justify-center text-center
                  border border-border rounded-sm
                  transition-all duration-200
                  ${
                    dragOver
                      ? "border-primary bg-primary/[0.04]"
                      : "hover:border-foreground/30 hover:bg-foreground/[0.015]"
                  }
                `}
              >
                {/* corner ornament — barely there */}
                <div className="absolute top-3 left-3 eyebrow text-muted-foreground/75">
                  ◦ source
                </div>
                <div className="absolute top-3 right-3 eyebrow text-muted-foreground/75">
                  drop here
                </div>

                <Upload
                  className="h-7 w-7 text-foreground/40 mb-8"
                  strokeWidth={1.25}
                />
                <p className="font-serif italic text-display md:text-display-md leading-tight max-w-xs">
                  Drop the job
                  <br />
                  description.
                </p>
                <p className="mt-5 text-body-lg text-muted-foreground max-w-xs leading-relaxed">
                  We&apos;ll read the file and pull out the criteria a recruiter
                  would screen on.
                </p>
                <div className="mt-10 flex items-center gap-4 eyebrow text-muted-foreground">
                  <span>pdf</span>
                  <span className="text-border">·</span>
                  <span>docx</span>
                  <span className="text-border">·</span>
                  <span>txt</span>
                  <span className="text-border">·</span>
                  <span>md</span>
                </div>
              </div>
            )}

            {/* —— FILE PICKED / LOADING —— */}
            {(loading || file) && (
              <div className="flex-1 flex flex-col">
                {/* file card */}
                <div className="border border-border rounded-sm bg-card px-6 py-5 flex items-start gap-4">
                  <FileText
                    className="h-5 w-5 text-foreground/50 mt-0.5 flex-shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="caps-action text-muted-foreground mb-1">
                      Source file
                    </p>
                    <p className="text-body-lg font-medium truncate">
                      {file?.name}
                    </p>
                    {file && (
                      <p className="font-mono text-eyebrow text-muted-foreground mt-1 tabular">
                        {formatSize(file.size)}
                      </p>
                    )}
                  </div>
                  {!loading && (
                    <button
                      onClick={pick}
                      className="caps-action text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    >
                      Replace
                    </button>
                  )}
                </div>

                {/* missing fields after extraction */}
                {result && !loading && missingRequired.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {missingRequired.map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <TriangleAlert
                          className="h-3.5 w-3.5 text-primary shrink-0"
                          strokeWidth={1.75}
                        />
                        <p className="caps-action text-primary">{field}</p>
                      </div>
                    ))}
                    <div className="mt-3 flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-sm px-3 py-2.5">
                      <OctagonAlert className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <p className="text-body-sm text-yellow-800 leading-relaxed">
                        Update the missing fields in your JD and replace the file to continue.
                      </p>
                    </div>
                  </div>
                )}

                {/* loading state */}
                {loading && (
                  <div className="mt-8 flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3 text-body text-foreground/70">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="font-serif italic">
                        Reading the description…
                      </span>
                    </div>
                    <p className="text-body-sm text-muted-foreground max-w-md leading-relaxed">
                      Parsing the file, then asking the model for the criteria
                      a recruiter would screen on. Usually 5–10 seconds.
                    </p>
                  </div>
                )}

                {/* error */}
                {!loading && error && (
                  <div className="mt-6 border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
                    <p className="caps-action text-primary mb-1">
                      Couldn&apos;t process this file
                    </p>
                    <p className="text-body text-foreground/80">{error}</p>
                  </div>
                )}

                {/* extract button */}
                {!loading && file && !result && (
                  <div className="mt-auto pt-10">
                    <HairRule />
                    <div className="pt-6 flex justify-end">
                      <Button
                        size="lg"
                        onClick={() => submit(file)}
                        className="gap-2 rounded-sm font-medium tracking-tight"
                      >
                        {error ? "Try again" : "Extract criteria"}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* after result: extraction complete */}
                {!loading && result && missingRequired.length === 0 && (
                  <div className="mt-auto pt-8">
                    <HairRule />
                    <div className="mt-6">
                      <p className="text-body-sm text-muted-foreground leading-relaxed">
                        Extraction complete.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ════════ RIGHT — the analysis ════════ */}
        <section className="flex flex-col overflow-hidden">
          {/* —— Empty / Loading: single scrolling area —— */}
          {(!result || missingRequired.length > 0) && (
            <div className="md:flex-1 px-4 sm:px-6 md:px-12 pt-6 md:pt-12 pb-8 md:overflow-y-auto">
              {/* Empty state */}
              {!loading && (
                <div className="h-full flex flex-col">
                  <ColumnMarker numeral="ii" title="The criteria" />
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="max-w-sm">
                      <p className="font-serif italic text-h1 text-foreground/55 leading-tight">
                        &ldquo;A score without reasoning is not a score.&rdquo;
                      </p>
                      <p className="mt-6 eyebrow text-muted-foreground">
                        Awaiting source ←
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading skeleton — mirrors the result layout so the
                  transition feels like ink filling a stencil */}
              {loading && (
                <div className="max-w-2xl">
                  {/* Eyebrow placeholder ("EXTRACTED FROM <FILE>.MD") */}
                  <div className="h-3 w-56 bg-muted rounded-sm animate-pulse" />

                  {/* Title placeholder — italic Newsreader 4xl, two lines */}
                  <div className="mt-4 mb-5 space-y-2.5">
                    <div className="h-9 w-11/12 bg-muted rounded-sm animate-pulse" />
                    <div className="h-9 w-2/5 bg-muted rounded-sm animate-pulse" />
                  </div>

                  {/* Filter chips row — 4 pills with varying widths to mimic real chips */}
                  <div className="flex items-center gap-1 flex-wrap -ml-2.5 mb-4">
                    <div className="h-7 w-[74px] bg-muted/70 rounded-sm animate-pulse" />
                    <div className="h-7 w-[86px] bg-muted/70 rounded-sm animate-pulse" />
                    <div className="h-7 w-[100px] bg-muted/70 rounded-sm animate-pulse" />
                    <div className="h-7 w-[82px] bg-muted/70 rounded-sm animate-pulse" />
                  </div>

                  {/* "Showing N of M" placeholder */}
                  <div className="h-3 w-36 bg-muted/60 rounded-sm animate-pulse" />

                  {/* Border that mimics the static-top boundary */}
                  <div className="my-8 border-t border-border" />

                  {/* Section header: SKILLS NN ──── */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <div className="h-3 w-12 bg-muted rounded-sm animate-pulse" />
                    <div className="h-3 w-5 bg-muted/70 rounded-sm animate-pulse" />
                    <div className="flex-1 border-b border-border/70" />
                  </div>

                  {/* Skills rows — varied widths feel more organic */}
                  <ul className="mb-10">
                    {[
                      "w-2/3",
                      "w-1/2",
                      "w-4/5",
                      "w-3/5",
                    ].map((w, i, arr) => (
                      <li
                        key={i}
                        className={`flex items-center justify-between gap-6 py-2.5 ${
                          i === arr.length - 1 ? "" : "border-b border-border/50"
                        }`}
                      >
                        <div className={`h-4 ${w} bg-muted rounded-sm animate-pulse`} />
                        <div className="h-7 w-29 bg-muted/70 rounded-sm animate-pulse shrink-0" />
                      </li>
                    ))}
                  </ul>

                  {/* Second section: EXPERIENCE NN ──── */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <div className="h-3 w-20 bg-muted rounded-sm animate-pulse" />
                    <div className="h-3 w-5 bg-muted/70 rounded-sm animate-pulse" />
                    <div className="flex-1 border-b border-border/70" />
                  </div>

                  <ul>
                    {["w-3/5", "w-1/2", "w-2/3"].map((w, i, arr) => (
                      <li
                        key={i}
                        className={`flex items-center justify-between gap-6 py-2.5 ${
                          i === arr.length - 1 ? "" : "border-b border-border/50"
                        }`}
                      >
                        <div className={`h-4 ${w} bg-muted rounded-sm animate-pulse`} />
                        <div className="h-7 w-29 bg-muted/70 rounded-sm animate-pulse shrink-0" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* —— Result: static header (title + filters) + scrolling criteria —— */}
          {result && missingRequired.length === 0 && (
            <>
              {/* Static top — does not scroll */}
              <div className="flex-shrink-0 px-4 sm:px-6 md:px-12 pt-6 md:pt-10 pb-5 border-b border-border bg-background">
                <div className="max-w-2xl">
                  <Eyebrow>Extracted from {result.file.name}</Eyebrow>
                  <h2 className="font-serif italic text-display md:text-display-md leading-[1.05] mt-3 mb-4 tracking-tight">
                    {result.title_suggestion}
                  </h2>
                </div>
              </div>

              {/* Scrolling middle — criteria only */}
              <div className="md:flex-1 px-4 sm:px-6 md:px-12 pt-6 md:pt-8 pb-8 md:overflow-y-auto">
                <div className="max-w-2xl">
                  <div className="space-y-10">
                    {grouped.map((group) => (
                    <div key={group.category}>
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="eyebrow text-foreground/70">
                          {CATEGORY_LABEL[group.category]}
                        </span>
                        <span className="font-mono text-eyebrow tabular text-muted-foreground">
                          {String(group.items.length).padStart(2, "0")}
                        </span>
                        <div className="flex-1 border-b border-border/70" />
                      </div>
                      <ul>
                        {group.items.map((c) => (
                          <li
                            key={c.idx}
                            className="flex items-center justify-between gap-6 py-1.5 border-b border-border/50 last:border-b-0"
                          >
                            <span className="text-body leading-snug">
                              {c.label}
                            </span>
                            <Select
                              value={c.importance}
                              onValueChange={(v) =>
                                setImportance(c.idx, v as Importance)
                              }
                            >
                              <SelectTrigger
                                className={`
                                  h-7 w-35 gap-1.5 px-2.5 py-0 shrink-0
                                  border-0 shadow-none rounded-sm
                                  bg-secondary/50 hover:bg-secondary
                                  data-[state=open]:bg-accent/60
                                  eyebrow
                                  focus-visible:ring-0 focus-visible:ring-offset-0
                                  transition-colors
                                  ${IMPORTANCE_COLOR[c.importance]}
                                  [&>svg]:opacity-40 [&>svg]:size-3 [&>svg]:transition-opacity
                                  hover:[&>svg]:opacity-90 data-[state=open]:[&>svg]:opacity-100
                                `}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                className="min-w-[128px] rounded-sm"
                                align="end"
                              >
                                <SelectItem
                                  value="must"
                                  className="eyebrow text-primary"
                                >
                                  {IMPORTANCE_LABEL.must}
                                </SelectItem>
                                <SelectItem
                                  value="strong"
                                  className="eyebrow text-foreground"
                                >
                                  {IMPORTANCE_LABEL.strong}
                                </SelectItem>
                                <SelectItem
                                  value="nice"
                                  className="eyebrow text-muted-foreground"
                                >
                                  {IMPORTANCE_LABEL.nice}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </li>
                        ))}
                      </ul>
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* —— Sticky action bar — outside scroll container, only when result is shown —— */}
          {result && !loading && missingRequired.length === 0 && (
            <div className="border-t border-border bg-background px-4 sm:px-6 md:px-12 py-4 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex-1 min-w-0">
                {saveState === "error" && saveError ? (
                  <p className="caps-action text-primary truncate">
                    Couldn&apos;t save · {saveError}
                  </p>
                ) : (
                  <p className="text-body-sm text-muted-foreground italic font-serif truncate">
                    {criteria.length} criteria locked in.
                    
                  </p>
                )}
              </div>
              <Button
                onClick={saveJob}
                disabled={saveState === "saving" || !canSave}
                size="sm"
                className="rounded-sm caps-action gap-2 min-w-[110px]"
              >
                {saveState === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    Save job
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </main>

      <PageFooter />

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-h2 text-foreground/85">
              Job Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 pt-2">
            {result && (
              <>
                {/* Section I — Basic Info */}
                <div className="space-y-5">
                  <h3 className="flex items-baseline gap-3 font-serif italic text-h3 text-foreground/85">
                    <span className="font-serif italic text-display text-primary">i.</span>
                    <span>Basic Info</span>
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">
                        Title
                      </p>
                      <p className="text-body text-foreground">{result.title_suggestion}</p>
                    </div>
                    {result.department?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Department <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground">{result.department}</p>
                      </div>
                    )}
                    {result.level?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Level <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground">{result.level}</p>
                      </div>
                    )}
                    {result.job_type?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Type <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground">{result.job_type}</p>
                      </div>
                    )}
                    {result.location?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Location <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground">{result.location}</p>
                      </div>
                    )}
                    {result.compensation?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Compensation <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground">{result.compensation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section II — Role Details */}
                <div className="space-y-5">
                  <h3 className="flex items-baseline gap-3 font-serif italic text-h3 text-foreground/85">
                    <span className="font-serif italic text-display text-primary">ii.</span>
                    <span>Role Details</span>
                  </h3>
                  <div className="space-y-6">
                    {result.summary?.trim() && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Summary <span className="text-[#B8553A]">*</span>
                        </p>
                        <p className="text-body text-foreground leading-relaxed">{result.summary}</p>
                      </div>
                    )}
                    {result.responsibilities && result.responsibilities.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Responsibilities <span className="text-[#B8553A]">*</span>
                        </p>
                        <ul className="space-y-1 mt-2">
                          {result.responsibilities.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.requirements && result.requirements.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Requirements <span className="text-[#B8553A]">*</span>
                        </p>
                        <ul className="space-y-1 mt-2">
                          {result.requirements.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.nice_to_have && result.nice_to_have.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">
                          Nice to Have <span className="text-[#B8553A]">*</span>
                        </p>
                        <ul className="space-y-1 mt-2">
                          {result.nice_to_have.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.portfolio_requirement && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">Portfolio Requirement</p>
                        <p className="text-body text-foreground">{result.portfolio_requirement}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section III — Benefits & Culture */}
                <div className="space-y-5">
                  <h3 className="flex items-baseline gap-3 font-serif italic text-h3 text-foreground/85">
                    <span className="font-serif italic text-display text-primary">iii.</span>
                    <span>Benefits & Culture</span>
                  </h3>
                  <div className="space-y-6">
                    {result.benefits_remote && result.benefits_remote.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">Remote Benefits</p>
                        <ul className="space-y-1 mt-2">
                          {result.benefits_remote.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.benefits_inperson && result.benefits_inperson.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">In-Person Benefits</p>
                        <ul className="space-y-1 mt-2">
                          {result.benefits_inperson.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.work_culture && result.work_culture.length > 0 && (
                      <div>
                        <p className="caps-meta text-muted-foreground mb-2">Work Culture</p>
                        <ul className="space-y-1 mt-2">
                          {result.work_culture.map((item, i) => (
                            <li key={i} className="text-body text-foreground/80 flex gap-2">
                              <span className="text-muted-foreground mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-border mt-6">
            <DialogClose asChild>
              <button className="caps-action text-muted-foreground hover:text-foreground transition-colors">
                ← Close preview
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
