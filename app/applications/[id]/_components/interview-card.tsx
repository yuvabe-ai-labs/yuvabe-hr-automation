"use client"

import { useState } from "react"
import { MapPin, Video, Clock, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RescheduleInterviewModal } from "./reschedule-interview-modal"
import { useCancelInterview } from "@/features/interviews/hooks/use-interviews"
import { useSession } from "@/app/providers"
import type { Interview } from "@/features/interviews/hooks/use-interviews"

function formatInterviewDate(isoUtc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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

type Props = {
  interview: Interview
  applicationId: string
  jobTitle?: string
  asColumn?: boolean
}

export function InterviewCard({ interview, applicationId, jobTitle, asColumn }: Props) {
  const { role } = useSession()
  const dateStr = formatInterviewDate(interview.scheduledAt, interview.timezone)
  const tz = tzAbbr(interview.timezone)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)

  const cancelMutation = useCancelInterview(applicationId)

  const canAct = role !== "viewer" && (interview.status === "scheduled" || interview.status === "rescheduled")

  const statusAccent =
    interview.status === "cancelled"
      ? "bg-muted-foreground/25"
      : interview.status === "completed"
      ? "bg-[#3F6B3F]/50"
      : "bg-[#2F5E7A]/60"

  const statusColor =
    interview.status === "cancelled"
      ? "text-muted-foreground"
      : interview.status === "completed"
      ? "text-[#3F6B3F]"
      : "text-[#2F5E7A]"

  const dialogs = (
    <>
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif italic text-h3 font-normal">
              Cancel this interview?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-sm">
              A cancellation email will be sent to {interview.candidateName}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm caps-action">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm caps-action"
              onClick={() => {
                cancelMutation.mutate(interview.id, {
                  onSuccess: () => setCancelOpen(false),
                })
              }}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleInterviewModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        interview={interview}
        applicationId={applicationId}
        jobTitle={jobTitle}
      />
    </>
  )

  /* ——————— column mode: full-bleed card tile with left accent ——————— */
  if (asColumn) {
    return (
      <>
        <li className="flex bg-card border border-border">
          <div className={`w-[3px] shrink-0 ${statusAccent}`} />
          <div className="flex-1 min-w-0 px-4 py-4">
            {/* Status badge */}
            <span className={`caps-meta ${statusColor}`}>
              {interview.status.replace(/_/g, " ")}
            </span>

            {/* Title */}
            <p className="font-serif italic text-h3 leading-snug text-foreground mt-1 mb-2">
              {interview.title}
            </p>

            {/* Date/time */}
            <p className="text-body-sm text-foreground/75">
              {dateStr}{" "}
              <span className="caps-meta text-muted-foreground">{tz}</span>
            </p>

            {/* Meta row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 caps-meta text-muted-foreground">
              <span className="tabular">{interview.durationMinutes} min</span>
              {interview.interviewerName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                  {interview.interviewerName}
                </span>
              )}
              {interview.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                  {interview.location}
                </span>
              )}
            </div>

            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 caps-meta text-[#2F5E7A] underline underline-offset-2 hover:text-foreground transition-colors"
              >
                <Video className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                Join meeting
              </a>
            )}

            {interview.notes && (
              <p className="mt-2 font-serif italic text-body-sm text-foreground/60 leading-relaxed">
                {interview.notes}
              </p>
            )}

            {/* Actions */}
            {canAct && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-sm caps-action h-7 px-3 flex-1"
                  onClick={() => setRescheduleOpen(true)}
                  disabled={cancelMutation.isPending}
                >
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-sm caps-action h-7 px-3 flex-1 hover:border-primary/50 hover:text-primary"
                  onClick={() => setCancelOpen(true)}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : (
                    "Cancel"
                  )}
                </Button>
              </div>
            )}
          </div>
        </li>
        {dialogs}
      </>
    )
  }

  /* ——————— default mode: card ——————— */
  return (
    <>
      <div className="border border-border rounded-sm bg-card px-5 py-4 space-y-3">
        {interview.title && (
          <p className="text-body-lg font-medium text-foreground">{interview.title}</p>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-body font-medium text-foreground">
              {dateStr} <span className="text-muted-foreground font-normal caps-meta">{tz}</span>
            </p>
            <p className="caps-meta text-muted-foreground mt-0.5 tabular">
              {interview.durationMinutes} min
            </p>
          </div>
          <span className="caps-meta text-[#2F5E7A] shrink-0">
            {interview.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="space-y-1.5 text-body-sm text-muted-foreground">
          {interview.interviewerName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>{interview.interviewerName}</span>
            </div>
          )}
          {interview.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>{interview.location}</span>
            </div>
          )}
          {interview.meetingLink && (
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors duration-100"
              >
                Join meeting
              </a>
            </div>
          )}
          {interview.notes && (
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 mt-px" strokeWidth={1.5} />
              <span className="text-foreground/70 italic">{interview.notes}</span>
            </div>
          )}
        </div>

        {canAct && (
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm caps-action h-7 px-3"
              onClick={() => setRescheduleOpen(true)}
              disabled={cancelMutation.isPending}
            >
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-sm caps-action h-7 px-3 hover:border-primary/50 hover:text-primary"
              onClick={() => setCancelOpen(true)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : (
                "Cancel"
              )}
            </Button>
          </div>
        )}
      </div>

      {dialogs}
    </>
  )
}
