"use client"

import { MapPin, Video, Clock, User } from "lucide-react"
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

export function InterviewCard({ interview }: { interview: Interview }) {
  const dateStr = formatInterviewDate(interview.scheduledAt, interview.timezone)
  const tz = tzAbbr(interview.timezone)

  return (
    <div className="border border-border rounded-sm bg-card px-5 py-4 space-y-3">
      {/* Title */}
      {interview.title && (
        <p className="text-body-lg font-medium text-foreground">{interview.title}</p>
      )}

      {/* Date/time line */}
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

      {/* Meta */}
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
    </div>
  )
}
