import Link from "next/link";
import NavTabClient from "../jobs/_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";

/* —————————————————————————— atoms —————————————————————————— */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-muted-foreground">{children}</span>;
}

/* —————————————————————————— page —————————————————————————— */

/**
 * Shortlist is in the nav but hasn't been built yet. Rather than 404, this
 * route renders the full chrome with an editorial "coming soon" empty state.
 * The shape matches /jobs/page.tsx → EmptyState so the surface feels intentional,
 * not broken.
 */
export default function ShortlistPage() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      {/* —————— Sticky header — brand + tabs —————— */}
      <header className="flex-shrink-0 border-b border-border bg-background z-10">
        <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link
              href="/"
              className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity"
            >
              Yuvabe
            </Link>
            <span className="text-muted-foreground">/</span>
            <Eyebrow>ATS</Eyebrow>
          </div>
          <Eyebrow>In progress</Eyebrow>
        </div>
        <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavTabClient href="/jobs" label="Jobs" prefix="/jobs" />
          {/* <NavTabClient href="/applications" label="Applicants" prefix="/applications" /> */}
          {/* <NavTabClient href="/shortlist" label="Shortlist" prefix="/shortlist" /> */}
          <SignOutButton className="ml-auto" />
        </nav>
      </header>

      {/* —————— Editorial "coming soon" empty state —————— */}
      <main className="md:flex-1 md:overflow-hidden flex items-center justify-center px-4 sm:px-6 md:px-10 py-16">
        <div className="max-w-md text-center">
          <span className="caps-action text-primary tabular">iii. Shortlist</span>

          <p className="mt-6 font-serif italic text-display md:text-display-lg text-foreground/85 leading-tight tracking-tight">
            The shortlist is
            <br />
            the conversation.
          </p>

          <p className="mt-6 text-body-lg text-muted-foreground leading-relaxed">
            A pinned, cross-job view of the candidates worth a longer look — with
            notes, side-by-side scores, and the recruiter&apos;s read on each one.
          </p>

          <p className="mt-8 caps-meta text-muted-foreground/85 tabular">
            Coming next
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/applications?status=shortlisted"
              className="caps-action text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Shortlisted applicants
            </Link>
            <span className="text-border">·</span>
            <Link
              href="/jobs"
              className="caps-action text-muted-foreground hover:text-foreground transition-colors"
            >
              Jobs
            </Link>
          </div>
        </div>
      </main>

      {/* —————— Footer —————— */}
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
