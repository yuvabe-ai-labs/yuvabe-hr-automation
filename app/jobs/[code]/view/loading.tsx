import Image from "next/image";

/**
 * Instant Suspense fallback for /jobs/[code]/view.
 * Mirrors app/jobs/[code]/view/page.tsx — two-pane layout, JD on left,
 * extracted criteria on right.
 */
export default function JobViewLoading() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/assests/yuvabe_logo.png" alt="" width={24} height={24} className="object-contain" />
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
          {/* —————— Left pane: JD skeleton —————— */}
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
                <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
                  i.
                </span>
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

          {/* —————— Right pane: extracted criteria skeleton —————— */}
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

              {/* Two criterion-group skeletons */}
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

      <footer className="border-t border-border px-4 sm:px-6 md:px-10 py-3 flex-shrink-0 flex items-center justify-between gap-3 eyebrow text-muted-foreground">
        <span className="truncate">Yuvabe ATS &nbsp; · &nbsp; v0.1</span>
        <span className="italic font-serif normal-case tracking-normal text-muted-foreground/80 hidden md:inline">
          Read-only view
        </span>
      </footer>
    </div>
  );
}
