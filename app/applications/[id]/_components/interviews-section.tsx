"use client"

import { useState } from "react"
import { CalendarPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InterviewCard } from "./interview-card"
import { ScheduleInterviewModal } from "./schedule-interview-modal"
import { useInterviewsByApplication } from "@/features/interviews/hooks/use-interviews"
import type { Application } from "@/types/applications"

type Props = {
  application: Application
  jobTitle?: string
}

export function InterviewsSection({ application, jobTitle }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: interviews, isLoading, error } = useInterviewsByApplication(application.id)

  const canSchedule =
    application.status === "shortlisted" ||
    application.status === "interview_scheduled" ||
    application.status === "interviewed"

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
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>

      <ScheduleInterviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        application={application}
        jobTitle={jobTitle}
      />
    </>
  )
}
