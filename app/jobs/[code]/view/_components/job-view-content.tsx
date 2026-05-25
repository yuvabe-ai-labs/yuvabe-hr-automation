"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useJobById, useUpdateJobStatus } from "@/hooks/use-jobs";
import { useManagers } from "@/features/users/hooks/use-managers";
import { Button } from "@/components/ui/button";
import { JdPreviewDialog, jobToPreviewData } from "@/app/jobs/_components/jd-preview-dialog";
import NavTabClient from "../../../_components/nav-tab";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { IMPORTANCE_LABEL, IMPORTANCE_COLOR } from "@/lib/constants";
import { Eyebrow } from "@/components/shared/eyebrow";

type Importance = "must" | "strong" | "nice";
type CriterionCategory = "skill" | "experience" | "education" | "domain" | "other";

function ColumnMarker({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 md:gap-4">
      <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
        {numeral}.
      </span>
      <h1 className="font-serif italic text-h2 md:text-h1 leading-tight md:leading-none text-foreground tracking-tight max-w-[36ch]">
        {title}
      </h1>
    </div>
  );
}

const CATEGORY_LABEL: Record<CriterionCategory, string> = {
  skill: "Skills",
  experience: "Experience",
  education: "Education",
  domain: "Domain",
  other: "Other",
};

const CATEGORY_ORDER: CriterionCategory[] = [
  "skill",
  "experience",
  "education",
  "domain",
  "other",
];

function JobViewSkeleton() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-serif italic text-h3 leading-none text-foreground">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <span className="eyebrow text-muted-foreground">ATS</span>
          </div>
          <div className="h-3 w-20 bg-muted rounded-sm animate-pulse" />
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8">
          <div className="h-3 w-10 bg-muted rounded-sm animate-pulse my-3.5" />
          <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse my-3.5" />
          <div className="h-3 w-14 bg-muted/70 rounded-sm animate-pulse my-3.5" />
        </nav>
      </header>
      <main className="md:flex-1 md:overflow-hidden">
        <div className="md:h-full md:grid md:grid-cols-[minmax(280px,_38%)_1fr]">
          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10 md:border-r md:border-border">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="h-3 w-10 bg-muted/70 rounded-sm animate-pulse" />
                <span className="text-muted-foreground/50">›</span>
                <div className="h-3 w-32 bg-muted/70 rounded-sm animate-pulse" />
                <span className="text-muted-foreground/50">›</span>
                <div className="h-3 w-12 bg-muted rounded-sm animate-pulse" />
              </div>
              <div className="flex items-baseline gap-3 md:gap-4">
                <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">i.</span>
                <div className="h-7 md:h-9 w-32 bg-muted rounded-sm animate-pulse" />
              </div>
              <div className="mt-8 bg-card border border-border rounded p-4 md:p-5">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <div className="h-3 w-28 bg-muted/70 rounded-sm animate-pulse" />
                  <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
                </div>
                <div className="space-y-2.5">
                  {["w-full", "w-11/12", "w-full", "w-10/12", "w-full", "w-9/12", "w-11/12", "w-2/3"].map((w, i) => (
                    <div key={i} className={`h-3 ${w} bg-muted/60 rounded-sm animate-pulse`} />
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-16 bg-muted rounded-sm animate-pulse" />
                <span className="text-muted-foreground/50">·</span>
                <div className="h-3 w-40 bg-muted/70 rounded-sm animate-pulse" />
              </div>
              <div className="mt-3 h-10 md:h-12 w-2/3 bg-muted rounded-sm animate-pulse" />
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <div className="h-6 w-16 bg-muted/70 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
                <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
              </div>
              <div className="mt-10 space-y-10">
                {[
                  { title: "w-12", rows: ["w-2/3", "w-1/2", "w-3/4", "w-3/5"] },
                  { title: "w-20", rows: ["w-3/5", "w-1/2", "w-2/3"] },
                ].map((g, gi) => (
                  <div key={gi}>
                    <div className="flex items-baseline gap-2">
                      <div className={`h-3 ${g.title} bg-muted rounded-sm animate-pulse`} />
                      <div className="h-3 w-5 bg-muted/70 rounded-sm animate-pulse" />
                    </div>
                    <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
                      {g.rows.map((w, i) => (
                        <li key={i} className="flex items-center justify-between gap-4 py-3.5">
                          <div className={`h-4 ${w} bg-muted rounded-sm animate-pulse`} />
                          <div className="h-3 w-12 bg-muted/70 rounded-sm animate-pulse" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">Read-only view</span>
      </footer>
    </div>
  );
}


export function JobViewContent({ code }: { code: string }) {
  const router = useRouter();
  const { data: job, isLoading } = useJobById(code);
  const { data: managers = [] } = useManagers();
  const [publishPreviewOpen, setPublishPreviewOpen] = useState(false);
  const { mutate: publishJob, isPending: isPublishing } = useUpdateJobStatus();

  if (isLoading) return <JobViewSkeleton />;
  if (!job) notFound();

  const counts = job.criteria.reduce<Record<Importance, number>>(
    (acc, c) => { acc[c.importance] = (acc[c.importance] ?? 0) + 1; return acc; },
    { must: 0, strong: 0, nice: 0 }
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: job.criteria.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">Yuvabe</Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href={`/jobs/${job.code}`}
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Applicants</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <div className="md:h-full md:grid md:grid-cols-[minmax(280px,_38%)_1fr]">
          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10 md:border-r md:border-border">
            <div className="max-w-2xl">
              <nav className="mb-4 eyebrow flex items-center gap-2.5">
                <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">Jobs</Link>
                <span className="text-muted-foreground/50">›</span>
                <Link href={`/jobs/${job.code}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[24ch]">{job.title}</Link>
                <span className="text-muted-foreground/50">›</span>
                <span className="text-foreground/80">View</span>
              </nav>

              <ColumnMarker numeral="i" title="The job" />

              <div className="mt-8 bg-card border border-border rounded p-4 md:p-5">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <Eyebrow>Job description</Eyebrow>
                  <span className="caps-meta text-muted-foreground tabular">
                    {(job.description.length / 1000).toFixed(1)}k chars
                  </span>
                </div>
                <pre className="font-sans text-body-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                  {job.description}
                </pre>
              </div>

              <p className="mt-6 caps-meta text-muted-foreground">
                {job.status === "draft" ? "Draft" : "Read-only"} · Posted{" "}
                <span className="tabular">
                  {new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </p>

            </div>
          </section>

          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <JobIdBadge code={job.code} />
                  <span className="text-muted-foreground/50">·</span>
                  <Eyebrow>Extracted criteria</Eyebrow>
                </div>
                {job.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => setPublishPreviewOpen(true)}
                    className="rounded-sm caps-action gap-2 shrink-0"
                  >
                    Publish
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Button>
                )}
              </div>

              <h2 className="mt-3 font-serif italic text-display md:text-display-lg leading-[1.05] tracking-tight">
                {job.title}
              </h2>
              {job.hiringManagerId && (() => {
                const manager = managers.find((m) => m.id === job.hiringManagerId);
                return manager ? (
                  <p className="mt-1.5 caps-meta text-muted-foreground">
                    Hiring manager · {manager.name}
                  </p>
                ) : null;
              })()}

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <span className="caps-meta tabular bg-secondary px-2 py-1 rounded-sm">
                  <span className="text-foreground">{String(job.criteria.length).padStart(2, "0")}</span>{" "}
                  <span className="text-muted-foreground">all</span>
                </span>
                <span className="caps-meta tabular text-primary">{String(counts.must).padStart(2, "0")} must</span>
                <span className="caps-meta tabular text-foreground">{String(counts.strong).padStart(2, "0")} preferred</span>
                <span className="caps-meta tabular text-muted-foreground">{String(counts.nice).padStart(2, "0")} nice</span>
              </div>

              <p className="mt-3 caps-meta text-muted-foreground">
                Showing {String(job.criteria.length).padStart(2, "0")} of {String(job.criteria.length).padStart(2, "0")}
              </p>

              <div className="mt-10 space-y-10">
                {grouped.map((group) => (
                  <div key={group.category}>
                    <Eyebrow>
                      <span>{CATEGORY_LABEL[group.category]}</span>{" "}
                      <span className="tabular">{String(group.items.length).padStart(2, "0")}</span>
                    </Eyebrow>
                    <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
                      {group.items.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-4 py-3.5">
                          <span className="text-body text-foreground">{c.label}</span>
                          <span className={`caps-meta tabular shrink-0 ${IMPORTANCE_COLOR[c.importance]}`}>
                            {IMPORTANCE_LABEL[c.importance]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">Read-only view</span>
      </footer>

      <JdPreviewDialog
        open={publishPreviewOpen}
        onOpenChange={setPublishPreviewOpen}
        data={jobToPreviewData(job)}
        onPublish={() =>
          publishJob(
            { code: job.code, status: "active" },
            { onSuccess: () => router.push(`/jobs/${job.code}`) }
          )
        }
        isPublishing={isPublishing}
      />
    </div>
  );
}
