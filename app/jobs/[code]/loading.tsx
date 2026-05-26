import Image from "next/image";

/**
 * Instant Suspense fallback for /jobs/[code].
 * Mirrors app/jobs/[code]/page.tsx — header + breadcrumb + ColumnMarker
 * + meta row + filter chips + applicant rows.
 */
export default function JobDetailLoading() {
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
        <section className="md:h-full flex flex-col md:overflow-hidden">
          {/* Static top — breadcrumb + ColumnMarker + meta + chips */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-5 border-b border-border bg-background">
            <div className="max-w-5xl">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="h-3 w-10 bg-muted/70 rounded-sm animate-pulse" />
                <span className="text-muted-foreground/65">›</span>
                <div className="h-3 w-32 bg-muted rounded-sm animate-pulse" />
              </div>
              <div className="flex items-baseline gap-3 md:gap-4">
                <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
                  i.
                </span>
                <div className="h-7 md:h-9 w-2/3 max-w-md bg-muted rounded-sm animate-pulse" />
              </div>
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <div className="h-5 w-16 bg-muted rounded-sm animate-pulse" />
                <span className="text-border">·</span>
                <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
                <span className="text-border">·</span>
                <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse" />
                <span className="text-border">·</span>
                <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
              </div>
              {/* Filter chips */}
              <div className="mt-6 flex items-center gap-1 flex-wrap -ml-2.5">
                {["w-[58px]", "w-[100px]", "w-[88px]", "w-[68px]"].map((w, i) => (
                  <div key={i} className={`h-7 ${w} bg-muted/70 rounded-sm animate-pulse`} />
                ))}
              </div>
              {/* Controls row skeleton: Top N chips + sort toggle */}
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 -ml-2.5">
                  {["w-[36px]", "w-[56px]", "w-[56px]", "w-[56px]"].map((w, i) => (
                    <div key={i} className={`h-7 ${w} bg-muted/70 rounded-sm animate-pulse`} />
                  ))}
                </div>
                <div className="h-5 w-16 bg-muted/70 rounded-sm animate-pulse" />
              </div>
            </div>
          </div>

          {/* Scrolling list — 8 applicant skeleton rows */}
          <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
            <ul className="max-w-5xl">
              {Array.from({ length: 8 }).map((_, i) => (
                <li
                  key={i}
                  className={`border-b border-border/60 ${i === 0 ? "border-t border-border/60" : ""}`}
                >
                  <div className="py-5 px-4 flex items-center justify-between gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                      {/* Score chip placeholder */}
                      <div className="h-8 md:h-9 min-w-[44px] md:min-w-[58px] bg-muted/80 rounded-sm animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <div className={`h-6 ${i % 2 === 0 ? "w-1/2" : "w-2/5"} bg-muted rounded-sm animate-pulse mb-2`} />
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse" />
                          <span className="text-border hidden sm:inline">·</span>
                          <div className="h-3 w-32 bg-muted/70 rounded-sm animate-pulse hidden sm:inline-block" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
                      <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
                      <div className="h-3 w-12 bg-muted/70 rounded-sm animate-pulse hidden md:inline-block" />
                      <div className="h-4 w-4 bg-muted/70 rounded-sm animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
