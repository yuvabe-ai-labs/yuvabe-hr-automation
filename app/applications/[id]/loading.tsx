import Image from "next/image";

/**
 * Instant Suspense fallback for /applications/[id].
 * Mirrors app/applications/[id]/page.tsx — sticky aside (contact, score,
 * status, quick stats) + main pane (match summary, criterion breakdown).
 */
export default function ApplicationDetailLoading() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/assests/yuvabe_logo.png" alt="" width={24} height={24} className="object-contain" />
            <span className="font-serif italic text-h3 leading-none text-foreground">Yuvabe</span>
            <span className="text-muted-foreground">/</span>
            <span className="eyebrow text-muted-foreground">ATS</span>
          </div>
          <div className="h-3 w-32 bg-muted rounded-sm animate-pulse" />
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8">
          <div className="h-3 w-10 bg-muted/70 rounded-sm animate-pulse my-3.5" />
          <div className="h-3 w-16 bg-muted rounded-sm animate-pulse my-3.5" />
          <div className="h-3 w-14 bg-muted/70 rounded-sm animate-pulse my-3.5" />
        </nav>
      </header>

      <main className="md:flex-1 grid grid-cols-1 md:grid-cols-[390px_1fr] md:overflow-hidden">
        {/* ════════ LEFT — candidate profile skeleton ════════ */}
        <aside className="border-b border-border md:border-r md:border-b-0 md:overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 flex flex-col">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="h-3 w-10 bg-muted/70 rounded-sm animate-pulse" />
            <span className="text-muted-foreground/65">›</span>
            <div className="h-3 w-32 bg-muted/70 rounded-sm animate-pulse" />
          </div>

          {/* Candidate name — display-md/lg */}
          <div className="mt-1 mb-1 space-y-2">
            <div className="h-9 md:h-12 w-3/4 bg-muted rounded-sm animate-pulse" />
            <div className="h-9 md:h-12 w-2/5 bg-muted rounded-sm animate-pulse" />
          </div>

          {/* Contact card */}
          <div className="mt-6 bg-card border border-border rounded p-4 md:p-5">
            <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
            <div className="mt-2.5 space-y-2">
              <div className="h-4 w-5/6 bg-muted rounded-sm animate-pulse" />
              <div className="h-4 w-1/2 bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-4 w-2/3 bg-muted/70 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Score block */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse" />
            <div className="mt-2 flex items-baseline gap-3">
              <div className="h-10 md:h-12 w-20 bg-muted rounded-sm animate-pulse" />
              <div className="h-3 w-12 bg-muted/60 rounded-sm animate-pulse" />
            </div>
            <div className="mt-2 h-4 w-32 bg-muted/70 rounded-sm animate-pulse" />
          </div>

          {/* Status block */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
            <div className="mt-2 h-3 w-16 bg-muted/60 rounded-sm animate-pulse" />
            <div className="mt-4 space-y-2">
              <div className="h-9 w-full bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-9 w-full bg-muted/70 rounded-sm animate-pulse" />
              <div className="h-9 w-full bg-muted/70 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div>
              <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
              <div className="mt-2 h-4 w-16 bg-muted rounded-sm animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
              <div className="mt-2 h-4 w-3/4 bg-muted/70 rounded-sm animate-pulse" />
              <div className="mt-1 h-3 w-1/2 bg-muted/60 rounded-sm animate-pulse" />
            </div>
          </div>
        </aside>

        {/* ════════ RIGHT — match analysis skeleton ════════ */}
        <section className="md:overflow-y-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
          <div className="max-w-3xl">
            {/* Match summary block */}
            <div className="h-3 w-32 bg-muted/70 rounded-sm animate-pulse" />
            <div className="mt-4 mb-12 border-l-2 border-primary/40 pl-6 max-w-[64ch] space-y-3">
              <div className="h-5 w-full bg-muted rounded-sm animate-pulse" />
              <div className="h-5 w-11/12 bg-muted rounded-sm animate-pulse" />
              <div className="h-5 w-3/5 bg-muted rounded-sm animate-pulse" />
            </div>

            {/* Criterion breakdown */}
            <div className="h-3 w-40 bg-muted/70 rounded-sm animate-pulse" />
            <div className="mt-5 space-y-10">
              {[
                { rows: 4 },
                { rows: 3 },
                { rows: 2 },
              ].map((g, gi) => (
                <div key={gi}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <div className="h-3 w-16 bg-muted rounded-sm animate-pulse" />
                    <div className="h-3 w-5 bg-muted/70 rounded-sm animate-pulse" />
                    <div className="flex-1 border-b border-border/70" />
                  </div>
                  <ul>
                    {Array.from({ length: g.rows }).map((_, i) => (
                      <li key={i} className="border-b border-border/50 last:border-b-0 py-4">
                        <div className="flex items-baseline justify-between gap-6">
                          <div className="flex items-baseline gap-3 min-w-0 flex-1">
                            <div className="h-3 w-2 bg-muted/70 rounded-sm animate-pulse flex-shrink-0" />
                            <div className={`h-4 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} bg-muted rounded-sm animate-pulse`} />
                          </div>
                          <div className="h-3 w-10 bg-muted/70 rounded-sm animate-pulse flex-shrink-0" />
                        </div>
                        <div className="ml-6 mt-2.5 h-[3px] w-full max-w-md bg-border/60 rounded-full animate-pulse" />
                        <div className="ml-6 mt-2.5 h-3 w-4/5 bg-muted/60 rounded-sm animate-pulse" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Hiring is a human act.
        </span>
        <span>2026</span>
      </footer>
    </div>
  );
}
