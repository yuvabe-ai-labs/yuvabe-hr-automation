import Image from "next/image";

/**
 * Instant Suspense fallback for /jobs.
 * Mirrors the live layout in app/jobs/page.tsx so the skeleton-to-content
 * swap shifts only inside the list area, not the chrome.
 *
 * Skeleton conventions (see yuvabe-design-system §Motion VERB 3: REVEAL):
 *   - hairline-bordered rows, never solid blobs
 *   - animate-pulse only — no shimmer gradients
 *   - same bg-muted token used elsewhere (warm #F4F1EA)
 */
export default function JobsLoading() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Header skeleton (matches the real header silhouette) —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
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
          {/* Static top — ColumnMarker + CTA placeholder */}
          <div className="flex-shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-6 border-b border-border bg-background">
            <div className="flex items-end justify-between gap-6">
              <div className="flex items-baseline gap-3 md:gap-4">
                <span className="font-serif italic text-display md:text-display-xl leading-none text-primary tabular">
                  i.
                </span>
                <span className="font-serif italic text-h2 md:text-h1 leading-none text-foreground/85">
                  Jobs
                </span>
              </div>
              <div className="h-9 w-28 bg-muted rounded-sm animate-pulse" />
            </div>
            <div className="mt-3 h-3 w-44 bg-muted/60 rounded-sm animate-pulse" />
          </div>

          {/* Scrolling list — 5 skeleton rows */}
          <div className="md:flex-1 md:overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-12">
            <ul className="max-w-4xl">
              {[
                "w-2/3",
                "w-1/2",
                "w-3/5",
                "w-1/2",
                "w-2/5",
              ].map((titleW, i) => (
                <li
                  key={i}
                  className={`border-b border-border/60 ${i === 0 ? "border-t border-border/60" : ""}`}
                >
                  <div className="py-5 md:py-6 px-4 grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className={`h-7 md:h-8 ${titleW} bg-muted rounded-sm animate-pulse mb-3`} />
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-16 bg-muted/70 rounded-sm animate-pulse" />
                        <span className="text-border">·</span>
                        <div className="h-3 w-20 bg-muted/70 rounded-sm animate-pulse" />
                        <span className="text-border hidden sm:inline">·</span>
                        <div className="h-3 w-24 bg-muted/70 rounded-sm animate-pulse hidden sm:inline-block" />
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-muted/70 rounded-sm animate-pulse" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* —————— Footer (real, not skeleton — chrome is stable) —————— */}
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
