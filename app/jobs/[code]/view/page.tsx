import Link from "next/link";
import { notFound } from "next/navigation";
import { listJobs } from "@/lib/jobs-store";
import { ArrowLeft } from "lucide-react";
import NavTabClient from "../../_components/nav-tab";
import { JobIdBadge } from "@/app/_components/job-id-badge";
import { SignOutButton } from "@/app/_components/sign-out-button";
import type { Criterion, Importance } from "@/lib/prompts/extractCriteria.v1";

/* —————————————————————————— atoms (inlined per design system) —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

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

const IMPORTANCE_LABEL: Record<Importance, string> = {
  must: "Preferred",
  strong: "Strong",
  nice: "Nice",
};

/** Three opacity tiers within the warm ink palette — mirrors /jobs/new. */
const IMPORTANCE_COLOR: Record<Importance, string> = {
  must: "text-primary",
  strong: "text-foreground",
  nice: "text-muted-foreground",
};

/* —————————————————————————— page —————————————————————————— */

export default async function JobViewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const jobs = await listJobs();
  const job = jobs.find((j) => j.code === code);
  if (!job) notFound();

  // Importance counts for the chips row.
  const counts = job.criteria.reduce<Record<Importance, number>>(
    (acc, c) => {
      acc[c.importance] = (acc[c.importance] ?? 0) + 1;
      return acc;
    },
    { must: 0, strong: 0, nice: 0 }
  );

  // Group criteria by category, in canonical order, dropping empty groups.
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: job.criteria.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/" className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity">Yuvabe</Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Link
            href={`/jobs/${job.code}`}
            className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Applicants</span>
          </Link>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      <main className="md:flex-1 md:overflow-hidden">
        <div className="md:h-full md:grid md:grid-cols-[minmax(280px,_38%)_1fr]">
          {/* —————— Left pane: the JD —————— */}
          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10 md:border-r md:border-border">
            <div className="max-w-2xl">
              <nav className="mb-4 eyebrow flex items-center gap-2.5">
                <Link
                  href="/jobs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Jobs
                </Link>
                <span className="text-muted-foreground/50">›</span>
                <Link
                  href={`/jobs/${job.code}`}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[24ch]"
                >
                  {job.title}
                </Link>
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
                Read-only · Posted{" "}
                <span className="tabular">
                  {new Date(job.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          </section>

          {/* —————— Right pane: extracted criteria —————— */}
          <section className="md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <JobIdBadge code={job.code} />
                <span className="text-muted-foreground/50">·</span>
                <Eyebrow>Extracted criteria</Eyebrow>
              </div>

              <h2 className="mt-3 font-serif italic text-display md:text-display-lg leading-[1.05] tracking-tight">
                {job.title}
              </h2>

              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <span className="caps-meta tabular bg-secondary px-2 py-1 rounded-sm">
                  <span className="text-foreground">
                    {String(job.criteria.length).padStart(2, "0")}
                  </span>{" "}
                  <span className="text-muted-foreground">all</span>
                </span>
                <span className="caps-meta tabular text-primary">
                  {String(counts.must).padStart(2, "0")} must
                </span>
                <span className="caps-meta tabular text-foreground">
                  {String(counts.strong).padStart(2, "0")} strong
                </span>
                <span className="caps-meta tabular text-muted-foreground">
                  {String(counts.nice).padStart(2, "0")} nice
                </span>
              </div>

              <p className="mt-3 caps-meta text-muted-foreground">
                Showing {String(job.criteria.length).padStart(2, "0")} of{" "}
                {String(job.criteria.length).padStart(2, "0")}
              </p>

              {/* —————— Criteria grouped by category —————— */}
              <div className="mt-10 space-y-10">
                {grouped.map((group) => (
                  <div key={group.category}>
                    <Eyebrow>
                      <span>{CATEGORY_LABEL[group.category]}</span>{" "}
                      <span className="tabular">
                        {String(group.items.length).padStart(2, "0")}
                      </span>
                    </Eyebrow>
                    <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
                      {group.items.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-4 py-3.5"
                        >
                          <span className="text-body text-foreground">
                            {c.label}
                          </span>
                          <span
                            className={`caps-meta tabular flex-shrink-0 ${IMPORTANCE_COLOR[c.importance]}`}
                          >
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

      {/* —————— Footer —————— */}
      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Read-only view
        </span>
      </footer>
    </div>
  );
}
