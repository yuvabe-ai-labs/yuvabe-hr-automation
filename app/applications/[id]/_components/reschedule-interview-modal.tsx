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
import { useRescheduleInterview } from "@/features/interviews/hooks/use-interviews";
import { useManagers } from "@/features/users/hooks/use-managers";
import type { Interview } from "@/features/interviews/hooks/use-interviews";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview;
  applicationId: string;
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

function isoToLocalDate(isoUtc: string, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(isoUtc));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return "";
  }
}

function isoToLocalTime(isoUtc: string, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(isoUtc));
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h === "24" ? "00" : h}:${m}`;
  } catch {
    return "10:00";
  }
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

  const modeLine = p.meetingLink
    ? `<tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Mode</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">Remote</td></tr><tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Meeting link</td><td style="padding:6px 0;font-size:14px;"><a href="${p.meetingLink}" style="color:#B8553A;">${p.meetingLink}</a></td></tr>`
    : p.location
    ? `<tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Mode</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">In-person</td></tr><tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Venue</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${p.location}</td></tr>`
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
      <p style="font-size:15px;color:#1A1815;margin:0 0 28px 0;">Your interview at Yuvabe has been rescheduled. Please find the updated details below.</p>
      <hr style="border:none;border-top:1px solid #E5E0D5;margin:0 0 24px 0;" />
      <p style="font-size:15px;font-weight:600;color:#1A1815;margin:0 0 14px 0;">${p.title}</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 0;color:#8A857B;font-size:13px;width:120px;">Date</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${startDate}</td></tr>
        <tr><td style="padding:6px 0;color:#8A857B;font-size:13px;">Time</td><td style="padding:6px 0;font-size:14px;color:#1A1815;">${startTime} to ${endTime}</td></tr>
        ${interviewerLine}${modeLine}
      </table>
      ${notesSection}
      <hr style="border:none;border-top:1px solid #E5E0D5;margin:32px 0 20px 0;" />
      <p style="color:#8A857B;font-size:12px;margin:0;">This is an automated message from Yuvabe People regarding your application for <strong>${p.jobTitle}</strong>. If you have questions, reply to this email.</p>
    </div>
  </body></html>`;
}

export function RescheduleInterviewModal({
  open,
  onOpenChange,
  interview,
  applicationId,
  jobTitle,
}: Props) {
  const timezone = browserTimezone();
  const today = new Date().toISOString().split("T")[0];

  const [step, setStep] = useState<"form" | "preview">("form");
  const [title, setTitle] = useState(interview.title);
  const [interviewerId, setInterviewerId] = useState(interview.interviewerId ?? "");
  const [date, setDate] = useState(() => isoToLocalDate(interview.scheduledAt, interview.timezone));
  const [time, setTime] = useState(() => isoToLocalTime(interview.scheduledAt, interview.timezone));
  const [duration, setDuration] = useState(String(interview.durationMinutes));
  const [mode, setMode] = useState<"in-person" | "remote">(interview.meetingLink ? "remote" : "in-person");
  const [location, setLocation] = useState(interview.location ?? "");
  const [meetingLink, setMeetingLink] = useState(interview.meetingLink ?? "");
  const [notes, setNotes] = useState(interview.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: managers = [], isLoading: loadingManagers } = useManagers();
  const rescheduleMutation = useRescheduleInterview(applicationId);

  const selectedManager = managers.find((m) => m.id === interviewerId);

  function reset() {
    setStep("form");
    setTitle(interview.title);
    setInterviewerId(interview.interviewerId ?? "");
    setDate(isoToLocalDate(interview.scheduledAt, interview.timezone));
    setTime(isoToLocalTime(interview.scheduledAt, interview.timezone));
    setDuration(String(interview.durationMinutes));
    setMode(interview.meetingLink ? "remote" : "in-person");
    setLocation(interview.location ?? "");
    setMeetingLink(interview.meetingLink ?? "");
    setNotes(interview.notes ?? "");
    setError(null);
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Please enter an interview title."); return; }
    if (!date)         { setError("Please pick a date."); return; }
    if (!time)         { setError("Please enter a time."); return; }
    if (mode === "in-person" && !location.trim()) { setError("Please enter a location."); return; }
    if (mode === "remote" && !meetingLink.trim())  { setError("Please enter a meeting link."); return; }
    setStep("preview");
  }

  function handleConfirm() {
    setError(null);
    const scheduledAt = toUtcIso(date, time);

    rescheduleMutation.mutate(
      {
        interviewId: interview.id,
        input: {
          title:           title.trim(),
          scheduledAt,
          durationMinutes: Number(duration),
          timezone,
          notes:           notes || undefined,
          location:        location || undefined,
          meetingLink:     meetingLink || undefined,
          interviewerId:   interviewerId || undefined,
          interviewerName: selectedManager?.name,
          hmEmail:         selectedManager?.email,
        },
      },
      {
        onSuccess: () => { reset(); onOpenChange(false); },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to reschedule interview");
          setStep("form");
        },
      },
    );
  }

  const previewHtml =
    step === "preview"
      ? buildPreviewHtml({
          candidateName:   interview.candidateName,
          jobTitle:        jobTitle ?? interview.jobCode,
          title:           title.trim(),
          scheduledAt:     toUtcIso(date, time),
          durationMinutes: Number(duration),
          timezone,
          interviewerName: selectedManager?.name,
          location:        location || undefined,
          meetingLink:     meetingLink || undefined,
          notes:           notes || undefined,
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
              Reschedule Interview
            </DialogTitle>
            <p className="caps-meta text-muted-foreground">
              {interview.candidateName} · {interview.jobCode}
            </p>
          </DialogHeader>
        )}

        {/* ——— FORM STEP ——— */}
        {step === "form" && (
          <form onSubmit={handlePreview} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">Interview Title</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Interviewer <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={loadingManagers}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-sm bg-background text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
                  >
                    <span className={selectedManager ? "text-foreground" : "text-muted-foreground"}>
                      {loadingManagers ? "Loading…" : (selectedManager?.name ?? "Unassigned")}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setInterviewerId("__none__")}>
                    Unassigned
                  </DropdownMenuItem>
                  {managers.map((m) => (
                    <DropdownMenuItem key={m.id} onSelect={() => setInterviewerId(m.id)}>
                      {m.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="caps-meta text-muted-foreground -mt-1">Timezone: {timezone}</p>

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

            <div className="space-y-1.5">
              <Label className="caps-meta text-muted-foreground">
                Notes <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
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
                onClick={() => { reset(); onOpenChange(false); }}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-sm caps-action">
                Reschedule
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ——— PREVIEW STEP — Gmail-style shell ——— */}
        {step === "preview" && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 bg-[#404040] px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-white text-[13px] font-medium truncate">
                Interview Rescheduled: {title} — {jobTitle ?? interview.jobCode}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
            </div>

            <div className="shrink-0 bg-white border-b border-[#e0e0e0] px-5 py-3 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">From</span>
                <span className="text-[13px] text-[#202124]">Yuvabe HR &lt;hr@yuvabe.com&gt;</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">To</span>
                <span className="text-[13px] text-[#202124]">{interview.candidateEmail}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">CC</span>
                <span className="text-[13px] text-[#9e9e9e] italic">
                  {selectedManager?.email ?? "—"} + HR_EMAIL
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-medium text-[#202124] w-12 shrink-0">Subject</span>
                <span className="text-[13px] text-[#202124] font-medium truncate">
                  Interview Rescheduled: {title} — {jobTitle ?? interview.jobCode}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[#f1f3f4]">
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                title="Email preview"
              />
            </div>

            <div className="shrink-0 bg-white border-t border-[#e0e0e0] px-5 py-3 flex items-center justify-between gap-3">
              {error ? (
                <div className="border-l-2 border-primary pl-3 py-0.5">
                  <p className="text-[13px] text-primary">{error}</p>
                </div>
              ) : (
                <p className="text-[12px] text-[#9e9e9e]">
                  This is a preview. The email will be sent exactly as shown above.
                </p>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-sm caps-action"
                  onClick={() => setStep("form")}
                  disabled={rescheduleMutation.isPending}
                >
                  ← Edit
                </Button>
                <Button
                  type="button"
                  className="rounded-sm caps-action gap-2"
                  onClick={handleConfirm}
                  disabled={rescheduleMutation.isPending}
                  aria-busy={rescheduleMutation.isPending}
                >
                  {rescheduleMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Rescheduling…
                    </>
                  ) : (
                    "reschedule"
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
