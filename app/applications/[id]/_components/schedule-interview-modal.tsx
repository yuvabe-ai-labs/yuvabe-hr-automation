"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      month: "long",
      day: "numeric",
    }).format(new Date(isoUtc));
  } catch {
    return isoUtc;
  }
}

function tzAbbr(isoUtc: string, tz: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "short" })
        .formatToParts(new Date(isoUtc))
        .find((p) => p.type === "timeZoneName")?.value ?? tz
    );
  } catch {
    return tz;
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

const ROW = (label: string, value: string) =>
  `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;color:#8A857B;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:14px;color:#1A1815;font-weight:500;">${value}</td>
  </tr>`;

function buildPreviewHtml(p: PreviewParams): string {
  const startDate = formatDate(p.scheduledAt, p.timezone);
  const startTime = formatTime(p.scheduledAt, p.timezone);
  const endIso = new Date(new Date(p.scheduledAt).getTime() + p.durationMinutes * 60_000).toISOString();
  const endTime = formatTime(endIso, p.timezone);
  const tz = tzAbbr(p.scheduledAt, p.timezone);

  const interviewerRow = p.interviewerName ? ROW("Interviewer", p.interviewerName) : "";
  const modeRows = p.meetingLink
    ? ROW("Format", "Video Call") + ROW("Meeting Link", `<a href="${p.meetingLink}" style="color:#B8553A;word-break:break-all;">${p.meetingLink}</a>`)
    : p.location
    ? ROW("Format", "In-Person") + ROW("Venue", p.location)
    : "";
  const notesSection = p.notes
    ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #F0EDE8;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8A857B;margin:0 0 8px 0;font-weight:600;">Preparation Notes</p>
        <p style="font-size:14px;color:#1A1815;margin:0;white-space:pre-line;line-height:1.7;">${p.notes}</p>
      </div>`
    : "";

  return `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;background:#f0ece5;">
    <div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;max-width:600px;margin:32px auto;">
      <div style="background:#1A1815;padding:24px 32px;border-radius:4px 4px 0 0;">
        <p style="font-size:20px;color:#FAF8F4;margin:0;font-weight:700;">Yuvabe</p>
        <p style="font-size:11px;color:#8A857B;margin:4px 0 0 0;letter-spacing:1.5px;text-transform:uppercase;">People &amp; Talent</p>
      </div>
      <div style="padding:40px 32px;background:#FAF8F4;">
        <p style="font-size:16px;color:#1A1815;margin:0 0 6px 0;">Dear ${p.candidateName},</p>
        <p style="font-size:15px;color:#1A1815;line-height:1.7;margin:0 0 32px 0;">
          Thank you for your interest in the <strong>${p.jobTitle}</strong> role at Yuvabe. We are pleased to invite you for the next stage of our selection process. Please find the interview details below.
        </p>
        <div style="background:#ffffff;border:1px solid #E5E0D5;border-radius:4px;padding:24px;">
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8A857B;margin:0 0 16px 0;font-weight:600;">${p.title}</p>
          <table style="border-collapse:collapse;width:100%;">
            ${ROW("Date", startDate)}
            ${ROW("Time", `${startTime} – ${endTime} <span style="color:#8A857B;font-size:12px;">(${p.durationMinutes} min · ${tz})</span>`)}
            ${interviewerRow}
            ${modeRows}
          </table>
          ${notesSection}
        </div>
        
        <p style="font-size:14px;color:#1A1815;margin:24px 0 0 0;">We look forward to speaking with you.</p>
        <p style="font-size:14px;color:#1A1815;margin:16px 0 0 0;">Thank you for your time and interest in joining Yuvabe.</p>
        <p style="font-size:14px;color:#1A1815;margin:20px 0 0 0;line-height:1.6;">Warm regards,<br/><strong>Yuvabe People &amp; Talent</strong></p>
      </div>
      <div style="background:#1A1815;padding:20px 32px;border-radius:0 0 4px 4px;">
        <p style="font-size:12px;color:#5C5752;margin:0;line-height:1.7;">
          This is an automated message from Yuvabe People &amp; Talent.<br/>If you have questions, please reply to this email.
        </p>
      </div>
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
  const [mode, setMode] = useState<"in-person" | "remote">("in-person");
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
    setMode("in-person");
    setLocation("");
    setMeetingLink("");
    setNotes("");
    setError(null);
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim())   { setError("Please enter an interview title."); return; }
    if (!interviewerId)  { setError("Please select an interviewer."); return; }
    if (!date)           { setError("Please pick a date."); return; }
    if (!time)           { setError("Please enter a time."); return; }
    if (mode === "in-person" && !location.trim()) { setError("Please enter a location."); return; }
    if (mode === "remote" && !meetingLink.trim())  { setError("Please enter a meeting link."); return; }
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={loadingManagers}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-sm bg-background text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
                  >
                    <span className={interviewerId ? "text-foreground" : "text-muted-foreground"}>
                      {loadingManagers ? "Loading…" : (selectedManager?.name ?? "Select interviewer")}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {managers.map((m) => (
                    <DropdownMenuItem key={m.id} onSelect={() => setInterviewerId(m.id)}>
                      {m.name}
                    </DropdownMenuItem>
                  ))}
                  {!loadingManagers && managers.length === 0 && (
                    <DropdownMenuItem disabled>No managers found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date + Time + Duration */}
            <div className="grid grid-cols-3 gap-3">
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
              <div className="space-y-1.5">
                <Label className="caps-meta text-muted-foreground">Duration</Label>
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
            </div>

            <p className="caps-meta text-muted-foreground -mt-1">
              Timezone: {timezone}
            </p>

            {/* Mode */}
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">Mode</Label>
              <div className="flex gap-2">
                {(["in-person", "remote"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      if (m === "in-person") setMeetingLink("");
                      else setLocation("");
                    }}
                    className={`caps-meta px-3 py-1.5 rounded-sm border transition-colors ${
                      mode === m
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {m === "in-person" ? "In-person" : "Remote"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "in-person" ? (
              <div className="space-y-1.5">
                <Label className="caps-meta text-muted-foreground">Location</Label>
                <Input
                  type="text"
                  placeholder="e.g. Yuvabe Office, Floor 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-sm"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="caps-meta text-muted-foreground">Meeting link</Label>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/…"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="rounded-sm"
                />
              </div>
            )}

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
                rows={2}
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
