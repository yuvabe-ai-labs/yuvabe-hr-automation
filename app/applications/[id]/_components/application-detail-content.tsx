"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, TriangleAlert } from "lucide-react";
import NavTabClient from "@/app/jobs/_components/nav-tab";
import { StatusActions } from "./status-actions";
import { NotesButton } from "./notes-button";
import { InterviewsSection } from "./interviews-section";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { useApplicationById } from "@/hooks/use-applications";
import { useCandidateById } from "@/hooks/use-candidates";
import { useJobById } from "@/hooks/use-jobs";
import { relativeTime, formatDuration } from "@/lib/utils";
import { IMPORTANCE_LABEL, IMPORTANCE_COLOR } from "@/lib/constants";
import { Eyebrow } from "@/components/shared/eyebrow";
import type { CriterionMatch } from "@/types/applications";

function ScoreBand(score: number): "high" | "mid" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "mid" : "low";
}

function bandLabel(score: number): string {
  return ScoreBand(score) === "high"
    ? "Strong match"
    : ScoreBand(score) === "mid"
    ? "Fair match"
    : "Weak match";
}

function bandTextClass(score: number): string {
  const b = ScoreBand(score);
  return b === "high"
    ? "text-[#3F6B3F]"
    : b === "mid"
    ? "text-[#B8893A]"
    : "text-primary";
}

const MATCHED_GLYPH: Record<CriterionMatch["matched"], string> = {
  yes: "●",
  partial: "◐",
  no: "○",
};

const MATCHED_COLOR: Record<CriterionMatch["matched"], string> = {
  yes: "text-[#3F6B3F]",
  partial: "text-[#B8893A]",
  no: "text-muted-foreground",
};

function ensureHttps(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/* ————————————————————————— skeleton ————————————————————————— */

function ApplicationDetailSkeleton() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">
              Yuvabe
            </Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <div className="h-3 w-28 bg-muted rounded-sm animate-pulse" />
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="h-3 w-10 bg-muted rounded-sm animate-pulse my-3.5" />
          <div className="h-3 w-20 bg-muted/60 rounded-sm animate-pulse my-3.5 ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-[390px_1fr] md:overflow-hidden">
        {/* LEFT — candidate profile */}
        <aside className="border-b border-border md:border-r md:border-b-0 md:overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 flex flex-col">
          {/* Breadcrumb */}
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-2.5 w-8 bg-muted/70 rounded-sm animate-pulse" />
            <span className="text-muted-foreground/40">›</span>
            <div className="h-2.5 w-32 bg-muted/70 rounded-sm animate-pulse" />
          </div>

          {/* Candidate name */}
          <div className="mt-1 mb-1 space-y-2.5">
            <div className="h-9 w-3/4 bg-muted rounded-sm animate-pulse" />
            <div className="h-9 w-1/2 bg-muted rounded-sm animate-pulse" />
          </div>

          {/* Contact card */}
          <div className="mt-6 bg-card border border-border rounded p-4 md:p-5">
            <div className="h-2.5 w-14 bg-muted rounded-sm animate-pulse mb-2.5" />
            <div className="space-y-2">
              <div className="h-3.5 w-48 bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-3.5 w-32 bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-3.5 w-28 bg-muted/70 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Notes button */}
          <div className="mt-3 pt-6 border-border">
            <div className="h-8 w-28 bg-muted/60 rounded-sm animate-pulse" />
          </div>

          {/* Match score */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="h-2.5 w-20 bg-muted rounded-sm animate-pulse mb-2" />
            <div className="flex items-baseline gap-3">
              <div className="h-12 w-16 bg-muted rounded-sm animate-pulse" />
              <div className="h-3 w-12 bg-muted/60 rounded-sm animate-pulse" />
            </div>
            <div className="mt-1 h-4 w-24 bg-muted/60 rounded-sm animate-pulse" />
          </div>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="h-2.5 w-16 bg-muted rounded-sm animate-pulse mb-2" />
            <div className="h-3 w-20 bg-muted/60 rounded-sm animate-pulse" />
            <div className="mt-4 flex gap-2 flex-wrap">
              {["w-24", "w-24", "w-20"].map((w, i) => (
                <div key={i} className={`h-8 ${w} bg-muted/60 rounded-sm animate-pulse`} />
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div>
              <div className="h-2.5 w-20 bg-muted rounded-sm animate-pulse mb-1" />
              <div className="h-4 w-16 bg-muted/70 rounded-sm animate-pulse" />
            </div>
            <div>
              <div className="h-2.5 w-16 bg-muted rounded-sm animate-pulse mb-1" />
              <div className="h-4 w-44 bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-3.5 w-36 bg-muted/60 rounded-sm animate-pulse mt-1" />
            </div>
          </div>

          {/* Resume + links */}
          <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2">
            {["w-32", "w-20", "w-20", "w-24"].map((w, i) => (
              <div key={i} className={`h-3.5 ${w} bg-muted/60 rounded-sm animate-pulse`} />
            ))}
          </div>
        </aside>

        {/* RIGHT — match analysis */}
        <section className="md:overflow-y-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
          <div className="max-w-3xl">
            {/* Match summary eyebrow */}
            <div className="h-2.5 w-24 bg-muted rounded-sm animate-pulse" />
            {/* Blockquote */}
            <div className="mt-4 mb-12 border-l-2 border-border/40 pl-6 space-y-3">
              {["w-full", "w-11/12", "w-4/5", "w-3/5"].map((w, i) => (
                <div key={i} className={`h-6 ${w} bg-muted/70 rounded-sm animate-pulse`} />
              ))}
            </div>

            {/* Criterion breakdown eyebrow */}
            <div className="h-2.5 w-36 bg-muted rounded-sm animate-pulse mb-5" />
            <div className="space-y-10">
              {[
                { rows: ["w-2/3", "w-1/2", "w-3/4", "w-3/5"], labelW: "w-8" },
                { rows: ["w-1/2", "w-3/5", "w-2/3"], labelW: "w-14" },
                { rows: ["w-3/5", "w-1/2"], labelW: "w-8" },
              ].map((group, gi) => (
                <div key={gi}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <div className={`h-3 ${group.labelW} bg-muted rounded-sm animate-pulse`} />
                    <div className="h-3 w-5 bg-muted/60 rounded-sm animate-pulse" />
                    <div className="flex-1 border-b border-border/70" />
                  </div>
                  <ul>
                    {group.rows.map((w, i) => (
                      <li key={i} className="border-b border-border/50 last:border-b-0 py-4">
                        <div className="flex items-baseline justify-between gap-6">
                          <div className={`h-4 ${w} bg-muted rounded-sm animate-pulse`} />
                          <div className="h-3 w-10 bg-muted/60 rounded-sm animate-pulse shrink-0" />
                        </div>
                        <div className="ml-6 mt-2.5 h-0.75 bg-border/60 rounded-full overflow-hidden max-w-md">
                          <div className="h-full bg-muted animate-pulse rounded-full" style={{ width: `${45 + i * 12}%` }} />
                        </div>
                        <div className="ml-6 mt-2.5 space-y-1.5">
                          <div className="h-3 w-full bg-muted/50 rounded-sm animate-pulse" />
                          <div className="h-3 w-4/5 bg-muted/50 rounded-sm animate-pulse" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}

/* ————————————————————————— component ————————————————————————— */

export function ApplicationDetailContent({
  id,
  currentUser,
}: {
  id: string;
  currentUser: string;
}) {
  const { data: application, isLoading } = useApplicationById(id);
  const { data: candidate } = useCandidateById(application?.candidateId ?? "");
  const { data: job } = useJobById(application?.jobCode ?? "");

  if (isLoading) return <ApplicationDetailSkeleton />;

  if (!application) {
    return (
      <div className="min-h-screen md:h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-foreground">Application not found.</p>
      </div>
    );
  }

  const importanceOrder = ["must", "strong", "nice"] as const;
  const grouped = importanceOrder
    .map((imp) => ({
      importance: imp,
      items: application.matchBreakdown.filter((c) => c.importance === imp),
    }))
    .filter((g) => g.items.length > 0);

  const candidateName = candidate?.name ?? application.candidateName ?? "";
  const candidateEmail = candidate?.email ?? application.candidateEmail ?? "";
  const candidatePhone = candidate?.phone ?? "";
  const candidateLocation = candidate?.location ?? application.candidateLocation ?? "";
  const yearsOfExperience = candidate?.yearsOfExperience ?? application.candidateYearsOfExperience ?? 0;
  const education = candidate?.education ?? [];
  const experience = candidate?.experience ?? [];
  const links = candidate?.links;
  const resumeUrl = application.resumeUrl;

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">
              Yuvabe
            </Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href={`/jobs/${application.jobCode}`}
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors min-w-0 max-w-[40ch]"
          >
            <ArrowLeft className="h-3 w-3 shrink-0" />
            <span className="truncate">{job?.title ?? ""}</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-[390px_1fr] md:overflow-hidden">
        {/* ———————— LEFT — candidate profile ———————— */}
        <aside className="border-b border-border md:border-r md:border-b-0 md:overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 flex flex-col">
          <nav className="mb-3 eyebrow flex items-center gap-2.5 flex-wrap">
            <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Jobs
            </Link>
            <span className="text-body-lg leading-none text-muted-foreground/65">›</span>
            <Link
              href={`/jobs/${application.jobCode}`}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[24ch]"
            >
              {job?.title ?? ""}
            </Link>
          </nav>

          <h1 className="font-serif italic text-display md:text-display-lg leading-[1.05] mt-1 mb-1 tracking-tight wrap-break-word">
            {candidateName}
          </h1>

          {/* Contact card */}
          <div className="mt-6 bg-card border border-border rounded p-4 md:p-5">
            <Eyebrow>Contact</Eyebrow>
            <div className="mt-2.5 space-y-1.5 text-body-sm text-foreground/85">
              <a
                href={`mailto:${candidateEmail}`}
                className="block truncate hover:text-foreground hover:underline underline-offset-2 decoration-muted-foreground/40 transition-colors"
              >
                {candidateEmail}
              </a>
              {candidatePhone ? (
                <a
                  href={`tel:${candidatePhone.replace(/\s+/g, "")}`}
                  className="block font-mono tabular hover:text-foreground hover:underline underline-offset-2 decoration-muted-foreground/40 transition-colors"
                >
                  {candidatePhone}
                </a>
              ) : (
                <p className="font-serif italic text-primary/65">No phone provided</p>
              )}
              {candidateLocation ? (
                <p>{candidateLocation}</p>
              ) : (
                <p className="font-serif italic text-primary/65">No location provided</p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="mt-6 pt-6 border-t border-border">
            <Eyebrow>Match score</Eyebrow>
            <div className="mt-2 flex items-baseline gap-3">
              <span className={`font-mono text-display-md md:text-display-lg leading-none tabular ${bandTextClass(application.matchScore)}`}>
                {String(application.matchScore).padStart(2, "0")}
              </span>
              <span className="eyebrow text-muted-foreground">/ 100</span>
            </div>
            <p className={`mt-1 font-serif italic text-base ${bandTextClass(application.matchScore)}`}>
              {bandLabel(application.matchScore)}
            </p>
          </div>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <Eyebrow>Received</Eyebrow>
            <p className="mt-2 caps-meta text-muted-foreground tabular">
              {relativeTime(application.receivedAt)}
            </p>
            <div className="mt-4">
              <StatusActions
                applicationId={application.id}
                currentStatus={application.status}
              />
            </div>
            {application.status === "rejected" && application.rejectionReason && (
              <div className="mt-4 border-l-2 border-primary/40 pl-3 py-1.5 bg-primary/[0.03] rounded-sm">
                <Eyebrow className="text-primary/70">Rejection reason</Eyebrow>
                <p className="mt-1.5 font-serif italic text-body-sm text-foreground/80 leading-relaxed">
                  {application.rejectionReason}
                </p>
              </div>
            )}
          </div>

          {/* Notes + Interviews */}
          <div className="mt-6 pt-6 border-t border-border space-y-6">
            <NotesButton applicationId={application.id} currentUser={currentUser} />
            <InterviewsSection application={application} jobTitle={job?.title} />
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div>
              <Eyebrow>Experience</Eyebrow>
              <p className="mt-1 font-mono text-body tabular text-foreground">
                {yearsOfExperience}{" "}
                {yearsOfExperience === 1 ? "year" : "years"}
              </p>
            </div>
            {education[0] && (
              <div>
                <Eyebrow>Education</Eyebrow>
                <p className="mt-1 text-body text-foreground/85 leading-tight">
                  {education[0].degree}
                </p>
                <p className="text-body-sm text-muted-foreground italic font-serif">
                  {education[0].institution}, {education[0].year}
                </p>
              </div>
            )}
          </div>

          {/* Resume + links */}
          <div className="mt-6 pt-6 border-t border-border flex flex-col items-start gap-2">
            {resumeUrl ? (
              <a
                href={resumeUrl}
                className="inline-flex items-center gap-2 caps-action text-[#3F6B3F] hover:text-[#3F6B3F]/70 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                Download resume
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 caps-action text-primary">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                Resume missing
              </span>
            )}
            {(["linkedin", "github", "portfolio"] as const).map((key) => {
              const url = links?.[key];
              const label = key === "linkedin" ? "LinkedIn" : key === "github" ? "GitHub" : "Portfolio";
              return url ? (
                <a
                  key={key}
                  href={ensureHttps(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 caps-action text-[#3F6B3F] hover:text-[#3F6B3F]/70 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {label}
                </a>
              ) : (
                <span key={key} className="inline-flex items-center gap-2 caps-action text-primary/75">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  {label} missing
                </span>
              );
            })}
          </div>
        </aside>

        {/* ———————— RIGHT — match analysis ———————— */}
        <section className="md:overflow-y-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
          <div className="max-w-3xl">
            {/* Match summary */}
            <Eyebrow>Match summary</Eyebrow>
            <blockquote className="mt-4 mb-12 font-serif italic text-h3 leading-[1.55] text-foreground/85 border-l-2 border-primary/40 pl-6 max-w-[64ch]">
              {application.matchSummary}
            </blockquote>

            {/* Criterion breakdown */}
            <Eyebrow>Criterion breakdown</Eyebrow>
            <div className="mt-5 space-y-10">
              {grouped.map((group) => (
                <div key={group.importance}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className={`eyebrow ${IMPORTANCE_COLOR[group.importance]}`}>
                      {IMPORTANCE_LABEL[group.importance]}
                    </span>
                    <span className="font-mono text-eyebrow tabular text-muted-foreground">
                      {String(group.items.length).padStart(2, "0")}
                    </span>
                    <div className="flex-1 border-b border-border/70" />
                  </div>
                  <ul>
                    {group.items.map((c, i) => (
                      <li key={i} className="border-b border-border/50 last:border-b-0 py-4">
                        <div className="flex items-baseline justify-between gap-6">
                          <div className="flex items-baseline gap-3 min-w-0">
                            <span
                              className={`font-mono text-body-sm leading-none ${MATCHED_COLOR[c.matched]} shrink-0`}
                              aria-label={c.matched}
                            >
                              {MATCHED_GLYPH[c.matched]}
                            </span>
                            <span className="text-body-lg leading-snug">{c.criterionLabel}</span>
                          </div>
                          <span className="font-mono text-body-sm tabular text-muted-foreground shrink-0">
                            {c.score}
                            <span className="text-muted-foreground/60"> / 10</span>
                          </span>
                        </div>
                        {/* Score bar */}
                        <div className="ml-6 mt-2.5 h-0.75 bg-border/60 rounded-full overflow-hidden max-w-md">
                          <div
                            className={`h-full ${
                              c.matched === "yes"
                                ? "bg-[#3F6B3F]"
                                : c.matched === "partial"
                                ? "bg-[#B8893A]"
                                : "bg-primary/60"
                            }`}
                            style={{ width: `${c.score * 10}%` }}
                          />
                        </div>
                        {/* Evidence */}
                        <p className="ml-6 mt-2.5 font-serif italic text-body-sm text-foreground/70 leading-relaxed max-w-[60ch]">
                          &ldquo;{c.evidence}&rdquo;
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Experience timeline */}
            {experience.length > 0 && (
              <div className="mt-16 mb-8">
                <Eyebrow>Experience</Eyebrow>
                <ol className="mt-5 space-y-6">
                  {experience.map((e, i) => (
                    <li key={i} className="border-l border-border pl-5 max-w-[60ch]">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="text-body-lg font-medium text-foreground">
                          {e.title}
                          <span className="text-muted-foreground font-normal"> · {e.company}</span>
                        </h4>
                        <span className="caps-meta text-muted-foreground tabular shrink-0">
                          {formatDuration(e.startDate, e.endDate)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-body-sm text-foreground/75 leading-relaxed">
                        {e.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* —————— Footer —————— */}
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}
