"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useScheduleInterview } from "@/features/interviews/hooks/use-interviews";
import { useManagers } from "@/features/users/hooks/use-managers";
import type { Application } from "@/types/applications";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  jobTitle?: string;
};

const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
];

function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function toUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function formatDate(isoUtc: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(isoUtc));
  } catch {
    return isoUtc;
  }
}

function formatTime(isoUtc: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoUtc));
  } catch {
    return isoUtc;
  }
}

type PreviewParams = {
  candidateName: string;
  jobTitle: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  interviewerName?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
};

function buildPreviewHtml(p: PreviewParams): string {
  const startDate = formatDate(p.scheduledAt, p.timezone);
  const startTime = formatTime(p.scheduledAt, p.timezone);
  const endIso = new Date(
    new Date(p.scheduledAt).getTime() + p.durationMinutes * 60_000,
  ).toISOString();
  const endTime = formatTime(endIso, p.timezone);

  const locationLine = p.location
    ? `<tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Venue</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${p.location}</td></tr>`
    : "";

  const meetingLinkLine = p.meetingLink
    ? `<tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Location link</td><td style="padding:6px 0;font-size:14px;"><a href="${p.meetingLink}" style="color:#B8553A;">${p.meetingLink}</a></td></tr>`
    : "";

  const interviewerLine = p.interviewerName
    ? `<tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Interviewer</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${p.interviewerName}</td></tr>`
    : "";

  const notesSection = p.notes
    ? `<div style="margin-top:28px;"><p style="font-size:15px;font-weight:600;color:#1A1815;margin:0 0 10px 0;">What to bring / prepare</p><p style="font-size:14px;color:#1A1815;margin:0;white-space:pre-line;line-height:1.7;">${p.notes}</p></div>`
    : "";

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#e8e4dc;">
    <div style="font-family:sans-serif;max-width:580px;margin:24px auto;color:#1A1815;background:#FAF8F4;padding:40px 32px;border-radius:4px;">
      <p style="font-size:16px;margin:0 0 6px 0;">Hi ${p.candidateName},</p>
      <p style="font-size:15px;color:#1A1815;margin:0 0 28px 0;">Congratulations, you have been shortlisted for the next round of interviews.</p>
      <hr style="border:none;border-top:1px solid #E5E0D5;margin:0 0 24px 0;" />
      <p style="font-size:15px;font-weight:600;color:#1A1815;margin:0 0 14px 0;">${p.title}</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Date</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${startDate}</td></tr>
        <tr><td style="padding:6px 0;color:#8A857B;font-size:13px;">Time</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${startTime} to ${endTime}</td></tr>
        ${interviewerLine}${locationLine}${meetingLinkLine}
      </table>
      ${notesSection}
      <hr style="border:none;border-top:1px solid #E5E0D5;margin:32px 0 20px 0;" />
      <p style="color:#8A857B;font-size:12px;margin:0;">This is an automated message from Yuvabe People regarding your application for <strong>${p.jobTitle}</strong>. If you have questions, reply to this email.</p>
    </div>
  </body></html>`;
}

export function ScheduleInterviewModal({
  open,
  onOpenChange,
  application,
  jobTitle,
}: Props) {
  const timezone = browserTimezone();
  const today = new Date().toISOString().split("T")[0];

  const [step, setStep] = useState<"form" | "preview">("form");
  const [title, setTitle] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: managers = [], isLoading: loadingManagers } = useManagers();
  const scheduleMutation = useScheduleInterview(application.id);

  const selectedManager = managers.find((m) => m.id === interviewerId);

  function reset() {
    setStep("form");
    setTitle("");
    setInterviewerId("");
    setDate("");
    setTime("10:00");
    setDuration("60");
    setLocation("");
    setMeetingLink("");
    setNotes("");
    setError(null);
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please enter an interview title.");
      return;
    }
    if (!interviewerId) {
      setError("Please select an interviewer.");
      return;
    }
    if (!date) {
      setError("Please pick a date.");
      return;
    }
    if (!time) {
      setError("Please enter a time.");
      return;
    }
    setStep("preview");
  }

  function handleConfirm() {
    setError(null);
    const scheduledAt = toUtcIso(date, time);

    scheduleMutation.mutate(
      {
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        candidateEmail: application.candidateEmail,
        jobId: application.jobId,
        jobCode: application.jobCode,
        jobTitle: jobTitle ?? application.jobCode,
        title: title.trim(),
        scheduledAt,
        durationMinutes: Number(duration),
        timezone,
        notes: notes || undefined,
        location: location || undefined,
        meetingLink: meetingLink || undefined,
        interviewerId,
        interviewerName: selectedManager?.name,
        hmEmail: selectedManager?.email,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : "Failed to schedule interview",
          );
          setStep("form");
        },
      },
    );
  }

  const previewHtml =
    step === "preview"
      ? buildPreviewHtml({
          candidateName: application.candidateName,
          jobTitle: jobTitle ?? application.jobCode,
          title: title.trim(),
          scheduledAt: toUtcIso(date, time),
          durationMinutes: Number(duration),
          timezone,
          interviewerName: selectedManager?.name,
          location: location || undefined,
          meetingLink: meetingLink || undefined,
          notes: notes || undefined,
        })
      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className={
          step === "preview"
            ? "max-w-3xl w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
            : "max-w-lg"
        }
      >
        {step === "form" && (
          <DialogHeader>
            <DialogTitle className="font-serif italic text-h3 font-normal">
              Schedule Interview
            </DialogTitle>
            <p className="caps-meta text-muted-foreground">
              {application.candidateName} · {application.jobCode}
            </p>
          </DialogHeader>
        )}

        {/* ——— FORM STEP ——— */}
        {step === "form" && (
          <form onSubmit={handlePreview} className="space-y-4 pt-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Interview Title
              </Label>
              <Input
                type="text"
                placeholder="e.g. In-person Interview — Round 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-sm"
              />
            </div>

            {/* Interviewer */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Interviewer
              </Label>
              <Select
                value={interviewerId}
                onValueChange={setInterviewerId}
                disabled={loadingManagers}
              >
                <SelectTrigger className="rounded-sm">
                  <SelectValue
                    placeholder={
                      loadingManagers ? "Loading…" : "Select interviewer"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                  {!loadingManagers && managers.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No managers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="caps-meta text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="caps-meta text-muted-foreground">Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-sm"
                />
              </div>
            </div>

            <p className="caps-meta text-muted-foreground -mt-1">
              Timezone: {timezone}
            </p>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Location{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                type="text"
                placeholder="e.g. Yuvabe Office, Floor 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-sm"
              />
            </div>

            {/* Meeting link */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Meeting link{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                type="url"
                placeholder="https://meet.google.com/…"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="rounded-sm"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Notes{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                placeholder="e.g. Please carry a laptop. Keep your submission link ready."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-sm resize-none"
              />
            </div>

            {error && (
              <div className="border-l-2 border-primary pl-3 py-1 bg-primary/[0.03]">
                <p className="caps-action text-primary mb-0.5">Check fields</p>
                <p className="text-body-sm text-foreground/80">{error}</p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-sm caps-action"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-sm caps-action">
                Schedule
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ——— PREVIEW STEP — Gmail-style shell ——— */}
        {step === "preview" && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Gmail chrome — top bar */}
            <div className="shrink-0 bg-[#404040] px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-white text-[13px] font-medium truncate">
                Interview Invitation: {title} —{" "}
                {jobTitle ?? application.jobCode}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
            </div>

            {/* Gmail chrome — meta row */}
            <div className="shrink-0 bg-white border-b border-[#e0e0e0] px-5 py-3 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">
                  From
                </span>
                <span className="text-[13px] text-[#202124]">
                  Yuvabe HR &lt;hr@yuvabe.com&gt;
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">
                  To
                </span>
                <span className="text-[13px] text-[#202124]">
                  {application.candidateEmail}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">
                  CC
                </span>
                <span className="text-[13px] text-[#9e9e9e] italic">
                  {selectedManager?.email ?? "—"} + HR_EMAIL
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">
                  Subject
                </span>
                <span className="text-[13px] text-[#202124] font-medium truncate">
                  Interview Invitation: {title} —{" "}
                  {jobTitle ?? application.jobCode}
                </span>
              </div>
            </div>

            {/* Email body — scrollable */}
            <div className="flex-1 overflow-hidden bg-[#f1f3f4]">
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                title="Email preview"
              />
            </div>

            {/* Action bar */}
            <div className="shrink-0 bg-white border-t border-[#e0e0e0] px-5 py-3 flex items-center justify-between gap-3">
              {error ? (
                <div className="border-l-2 border-primary pl-3 py-0.5">
                  <p className="text-[13px] text-primary">{error}</p>
                </div>
              ) : (
                <p className="text-[12px] text-[#9e9e9e]">
                  This is a preview. The email will be sent exactly as shown
                  above.
                </p>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-sm caps-action"
                  onClick={() => setStep("form")}
                  disabled={scheduleMutation.isPending}
                >
                  ← Edit
                </Button>
                <Button
                  type="button"
                  className="rounded-sm caps-action gap-2"
                  onClick={handleConfirm}
                  disabled={scheduleMutation.isPending}
                  aria-busy={scheduleMutation.isPending}
                >
                  {scheduleMutation.isPending ? (
                    <>
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden
                      />
                      Scheduling…
                    </>
                  ) : (
                    "Send "
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
