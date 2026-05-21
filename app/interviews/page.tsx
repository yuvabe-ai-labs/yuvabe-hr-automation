"use client"

import Link from "next/link"
import { CalendarClock, ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/app/_components/page-header"
import { PageFooter } from "@/app/_components/page-footer"
import { ColumnMarker } from "@/components/shared/column-marker"
import { useUpcomingInterviews } from "@/features/interviews/hooks/use-interviews"

function formatDate(isoUtc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoUtc))
  } catch {
    return isoUtc
  }
}

function tzAbbr(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? timezone
  } catch {
    return timezone
  }
}

function InterviewsContent() {
  const { data: interviews, isLoading, error } = useUpcomingInterviews()

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="px-4 md:px-10 py-4 animate-pulse">
              <div className="h-4 w-1/3 bg-muted rounded-sm mb-2" />
              <div className="h-3 w-1/4 bg-muted rounded-sm" />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 px-4 md:px-10 py-8">
        <div className="border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
          <p className="caps-action text-primary mb-1">Couldn&apos;t load interviews</p>
          <p className="text-body text-foreground/80">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
        </div>
      </div>
    )
  }

  if (!interviews || interviews.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <CalendarClock className="h-8 w-8 text-muted-foreground/30 mb-6" strokeWidth={1} />
        <p className="font-serif italic text-h2 md:text-h1 text-foreground/40 leading-snug max-w-xs">
          No upcoming interviews.
        </p>
        <p className="mt-4 eyebrow text-muted-foreground/60">
          Interviews scheduled from candidate profiles will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-border">
        {interviews.map((interview) => {
          const dateStr = formatDate(interview.scheduledAt, interview.timezone)
          const tz = tzAbbr(interview.timezone)
          return (
            <li
              key={interview.id}
              className="group relative px-4 md:px-10 py-4 transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--shadow-hover)] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
              <Link
                href={`/applications/${interview.applicationId}`}
                className="absolute inset-0 z-10"
                aria-label={`View application for ${interview.candidateName}`}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-serif italic text-h3 leading-snug text-foreground truncate">
                    {interview.candidateName}
                  </p>
                  <p className="caps-meta text-muted-foreground tabular">
                    {interview.jobTitle || interview.jobCode}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="text-body-sm text-foreground/70">
                      {dateStr}{" "}
                      <span className="caps-meta text-muted-foreground">{tz}</span>
                    </span>
                    <span className="caps-meta text-muted-foreground tabular">
                      {interview.durationMinutes} min
                    </span>
                    {interview.interviewerName && (
                      <span className="text-body-sm text-foreground/60">
                        with {interview.interviewerName}
                      </span>
                    )}
                    {interview.location && (
                      <span className="text-body-sm text-foreground/60">
                        {interview.location}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-150 ease-out group-hover:translate-x-px group-hover:text-foreground"
                  strokeWidth={1.5}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function InterviewsPage() {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden bg-background">
      <PageHeader />

      <main className="md:flex-1 md:overflow-hidden">
        <section className="md:h-full flex flex-col md:overflow-hidden">
          <div className="shrink-0 px-4 sm:px-6 md:px-10 pt-6 md:pt-10 pb-6 border-b border-border bg-background">
            <ColumnMarker numeral="i" title="Upcoming Interviews" />
          </div>
          <InterviewsContent />
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
