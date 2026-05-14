"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApplicationById } from "@/hooks/use-applications";
import type { Application, CriterionMatch } from "@/types/applications";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import NavTabClient from "@/app/jobs/_components/nav-tab";
import { StatusActions } from "./status-actions";
import { SignOutButton } from "@/app/_components/sign-out-button";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

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

const IMPORTANCE_LABEL = { must: "Preferred", strong: "Strong", nice: "Nice" } as const;
const IMPORTANCE_COLOR = {
  must: "text-primary",
  strong: "text-foreground",
  nice: "text-muted-foreground",
} as const;

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

function ensureHttps(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

async function downloadResume(applicationId: string) {
  const endpoint = `/api/applications/${applicationId}/resume`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to download resume");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Resume download failed:", err);
    window.open(endpoint, "_blank");
  }
}

function formatDuration(startDate: string, endDate: string): string {
  const startMatch = startDate.match(/^(\d{4})-(\d{2})$/);
  if (!startMatch) return `${startDate} – ${endDate}`;
  const startY = parseInt(startMatch[1], 10);
  const startM = parseInt(startMatch[2], 10);

  const ongoing = endDate === "present";
  let endY: number;
  let endM: number;
  if (ongoing) {
    const now = new Date();
    endY = now.getFullYear();
    endM = now.getMonth() + 1;
  } else {
    const endMatch = endDate.match(/^(\d{4})-(\d{2})$/);
    if (!endMatch) return `${startDate} – ${endDate}`;
    endY = parseInt(endMatch[1], 10);
    endM = parseInt(endMatch[2], 10);
  }

  const totalMonths = Math.max(0, (endY - startY) * 12 + (endM - startM));
  let label: string;
  if (totalMonths < 1) label = "<1m";
  else if (totalMonths < 12) label = `${totalMonths}m`;
  else {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    label = months === 0 ? `${years}y` : `${years}y ${months}m`;
  }
  return ongoing ? `${label} · now` : label;
}

interface ApplicationDetailContentProps {
  id: string;
  initialApplication?: Application;
  jobTitle?: string;
  jobCode?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  yearsOfExperience?: number;
  education?: Array<{ degree: string; institution: string; year: number | string }>;
  links?: { linkedin?: string; portfolio?: string; github?: string };
  resumeUrl?: string;
}

export function ApplicationDetailContent({
  id,
  initialApplication,
  jobTitle,
  jobCode,
  candidateName,
  candidateEmail,
  candidatePhone,
  candidateLocation,
  yearsOfExperience,
  education,
  links,
  resumeUrl,
}: ApplicationDetailContentProps) {
  const router = useRouter();
  const { data: application, isLoading } = useApplicationById(id, initialApplication);

  if (isLoading && !application) {
    return (
      <div className="min-h-screen md:h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen md:h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-foreground">Application not found</p>
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

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
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
            <ArrowLeft className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{jobTitle || "Job"}</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-[390px_1fr] md:overflow-hidden">
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
              {jobTitle || "Job"}
            </Link>
          </nav>
          <h1 className="font-serif italic text-display md:text-display-lg leading-[1.05] mt-1 mb-1 tracking-tight break-words">
            {candidateName || application.candidateName}
          </h1>

          <div className="mt-6 bg-card border border-border rounded p-4 md:p-5">
            <Eyebrow>Contact</Eyebrow>
            <div className="mt-2.5 space-y-1.5 text-body-sm text-foreground/85">
              <a
                href={`mailto:${candidateEmail || application.candidateEmail}`}
                className="block truncate hover:text-foreground hover:underline underline-offset-2 decoration-muted-foreground/40 transition-colors"
              >
                {candidateEmail || application.candidateEmail}
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
              {candidateLocation || application.candidateLocation ? (
                <p>{candidateLocation || application.candidateLocation}</p>
              ) : (
                <p className="font-serif italic text-primary/65">No location provided</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
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

          <div className="mt-6 pt-6 border-t border-border">
            <Eyebrow>Received</Eyebrow>
            <p className="mt-2 caps-meta text-muted-foreground tabular">
              {relativeTime(application.receivedAt)}
            </p>
            <div className="mt-4">
              <StatusActions applicationId={application.id} currentStatus={application.status} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div>
              <Eyebrow>Experience</Eyebrow>
              <p className="mt-1 font-mono text-body tabular text-foreground">
                {yearsOfExperience ?? application.candidateYearsOfExperience}{" "}
                {(yearsOfExperience ?? application.candidateYearsOfExperience) === 1 ? "year" : "years"}
              </p>
            </div>
            {education && education[0] && (
              <div>
                <Eyebrow>Education</Eyebrow>
                <p className="mt-1 text-body text-foreground/85 leading-tight">{education[0].degree}</p>
                <p className="text-body-sm text-muted-foreground italic font-serif">
                  {education[0].institution}, {education[0].year}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-2">
            {resumeUrl ? (
              <button
                onClick={() => downloadResume(id)}
                className="inline-flex items-center gap-2 caps-action text-primary hover:text-primary/70 transition-colors bg-none border-none cursor-pointer p-0"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                Download Resume
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 caps-action text-muted-foreground/65 italic">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                No resume on file
              </span>
            )}
            {links?.linkedin && (
              <a
                href={ensureHttps(links.linkedin)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 caps-action text-primary hover:text-primary/70 transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            )}
            {links?.portfolio && (
              <a
                href={ensureHttps(links.portfolio)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 caps-action text-primary hover:text-primary/70 transition-colors"
              >
                <span>Portfolio</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            )}
            {links?.github && (
              <a
                href={ensureHttps(links.github)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 caps-action text-primary hover:text-primary/70 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </aside>

        <section className="md:flex-1 md:overflow-y-auto">
          <div className="px-4 sm:px-6 md:px-10 py-6 md:py-10">
            <div className="max-w-4xl">
              <div>
                <h2 className="font-serif italic text-h2 md:text-h1 leading-tight mb-5">
                  Fit assessment
                </h2>
                <p className="font-serif italic text-base md:text-h3 leading-relaxed text-foreground/80">
                  {application.matchSummary}
                </p>
              </div>

              <div className="mt-12 pt-12 border-t border-border">
                <h3 className="font-serif italic text-h3 md:text-h2 leading-tight mb-8">
                  Criteria breakdown
                </h3>
                <div className="space-y-10">
                  {grouped.map((group) => (
                    <div key={group.importance}>
                      <div className="flex items-baseline gap-2.5 mb-5">
                        <span className={`eyebrow ${IMPORTANCE_COLOR[group.importance]}`}>
                          {IMPORTANCE_LABEL[group.importance]}
                        </span>
                        <span className="caps-meta text-muted-foreground tabular">
                          {String(group.items.length).padStart(2, "0")} criteria
                        </span>
                      </div>
                      <ul className="space-y-5">
                        {group.items.map((criterion, idx) => (
                          <li key={`${group.importance}-${idx}`}>
                            <div className="flex items-start gap-3 md:gap-4">
                              <span className={`${MATCHED_COLOR[criterion.matched]} flex-shrink-0 font-mono tabular`}>
                                {MATCHED_GLYPH[criterion.matched]}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2.5 mb-1">
                                  <h4 className="font-serif italic text-base md:text-h3 leading-tight">
                                    {criterion.criterionLabel}
                                  </h4>
                                  <span className={`inline-block caps-meta tabular text-body-sm ${bandTextClass(criterion.score * 10)}`}>
                                    {String(criterion.score).padStart(2, "0")}
                                    <span className="text-muted-foreground">/10</span>
                                  </span>
                                </div>
                                <p className="text-body text-foreground/80 leading-relaxed">
                                  {criterion.evidence}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
