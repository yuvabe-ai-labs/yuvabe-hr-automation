"use client"

import { useState } from "react"
import { CalendarPlus, CalendarClock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InterviewCard } from "./interview-card"
import { ScheduleInterviewModal } from "./schedule-interview-modal"
import { useInterviewsByApplication } from "@/features/interviews/hooks/use-interviews"
import { useSession } from "@/app/providers"
import type { Application } from "@/types/applications"

type Props = {
  application: Application
  jobTitle?: string
  asColumn?: boolean
}

export function InterviewsSection({ application, jobTitle, asColumn }: Props) {
  const { role } = useSession()
  const [modalOpen, setModalOpen] = useState(false)
  const { data: interviews, isLoading, error } = useInterviewsByApplication(application.id)

  const hasActiveInterview = interviews?.some(
    (i) => i.status === "scheduled" || i.status === "rescheduled",
  )

  const canSchedule =
    role !== "viewer" &&
    !hasActiveInterview &&
    (
      application.status === "shortlisted" ||
      application.status === "interview_scheduled" ||
      application.status === "interviewed"
    )

  const modal = (
    <ScheduleInterviewModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      application={application}
      jobTitle={jobTitle}
    />
  )

  /* ——————— column mode: owns header + scrollable list ——————— */
  if (asColumn) {
    return (
      <>
        {/* Column header — fixed, not scrollable */}
        <div className="shrink-0 px-4 pt-5 pb-4 border-b border-border bg-background flex items-center justify-between gap-3">
          <span className="font-serif italic text-h2 leading-none text-foreground/85">Interviews</span>
          {canSchedule && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm caps-action gap-1.5 h-7 px-3 shrink-0"
              onClick={() => setModalOpen(true)}
            >
              <CalendarPlus className="h-3 w-3" strokeWidth={1.75} />
              Schedule
            </Button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            </div>
          )}

          {error && (
            <div className="mx-4 my-4 border-l-2 border-primary pl-3 py-2 bg-primary/[0.03]">
              <p className="text-body-sm text-foreground/80">Couldn&apos;t load interviews.</p>
            </div>
          )}

          {!isLoading && !error && (!interviews || interviews.length === 0) && (
            <div className="flex flex-col items-center justify-center text-center px-4 py-16">
              <CalendarClock className="h-6 w-6 text-muted-foreground/25 mb-4" strokeWidth={1} />
              <p className="font-serif italic text-body-lg text-foreground/40 leading-snug">
                No interviews scheduled.
              </p>
            </div>
          )}

          {!isLoading && !error && interviews && interviews.length > 0 && (
            <ul className="space-y-2 p-4">
              {[...interviews].reverse().map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  applicationId={application.id}
                  jobTitle={jobTitle}
                  asColumn
                />
              ))}
            </ul>
          )}
        </div>

        {modal}
      </>
    )
  }

  /* ——————— default mode: card list with section header ——————— */
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-muted-foreground">Interviews</span>
          {canSchedule && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm caps-action gap-1.5 h-7 px-3"
              onClick={() => setModalOpen(true)}
            >
              <CalendarPlus className="h-3 w-3" strokeWidth={1.75} />
              Schedule
            </Button>
          )}
        </div>

        <div className="h-px bg-border" />

        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-foreground/60">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
            <span className="font-serif italic text-body-sm">Loading interviews…</span>
          </div>
        )}

        {error && (
          <div className="border-l-2 border-primary pl-3 py-1 bg-primary/[0.03]">
            <p className="text-body-sm text-foreground/80">Couldn&apos;t load interviews.</p>
          </div>
        )}

        {!isLoading && !error && interviews && interviews.length === 0 && (
          <p className="font-serif italic text-body text-foreground/40 py-3">
            No interviews scheduled yet.
          </p>
        )}

        {!isLoading && !error && interviews && interviews.length > 0 && (
          <div className="space-y-2">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                applicationId={application.id}
                jobTitle={jobTitle}
              />
            ))}
          </div>
        )}
      </div>

      {modal}
    </>
  )
}
