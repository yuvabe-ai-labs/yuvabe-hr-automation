"use client";

import { useState } from "react";
import { Loader2, Eye, Check, X, CalendarCheck, UserCheck } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useUpdateApplicationStatus,
  useUpdateApplicationStatusWithReason,
} from "@/hooks/use-applications";
import type { ApplicationStatus } from "@/types/applications";

// — Pre-interview toggle (new / reviewing / shortlisted / rejected) —

type PreInterviewToggle = "reviewing" | "shortlisted" | "rejected";

function toPreInterviewToggle(
  status: ApplicationStatus,
): PreInterviewToggle | null {
  if (status === "new") return null;
  if (status === "shortlisted" || status === "offered") return "shortlisted";
  if (status === "rejected") return "rejected";
  if (
    ["interview_scheduled", "interviewed", "hired", "withdrawn"].includes(
      status,
    )
  )
    return null;
  return "reviewing";
}

function PreInterviewActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] =
    useState<ApplicationStatus>(currentStatus);
  const updateMutation = useUpdateApplicationStatus();

  const displayValue = toPreInterviewToggle(optimisticStatus);

  const setStatus = (next: PreInterviewToggle) => {
    if (next === toPreInterviewToggle(optimisticStatus)) return;
    setError(null);
    setOptimisticStatus(next);
    updateMutation.mutate(
      { id: applicationId, status: next },
      {
        onError: () => {
          setOptimisticStatus(currentStatus);
          setError("Couldn't update status");
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        value={displayValue ?? ""}
        onValueChange={(v) => v && setStatus(v as PreInterviewToggle)}
        disabled={updateMutation.isPending}
        className="w-full"
      >
        <ToggleGroupItem
          value="reviewing"
          className="caps-action justify-start gap-2 data-[state=on]:bg-[#B8893A]/10 data-[state=on]:text-[#B8893A]"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
          Review
        </ToggleGroupItem>
        <ToggleGroupItem
          value="shortlisted"
          className="caps-action justify-start gap-2 data-[state=on]:bg-[#3F6B3F]/10 data-[state=on]:text-[#3F6B3F]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
          Shortlist
        </ToggleGroupItem>
        <ToggleGroupItem
          value="rejected"
          className="caps-action justify-start gap-2 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          Reject
        </ToggleGroupItem>
      </ToggleGroup>
      {error && <p className="caps-meta text-primary">{error}</p>}
    </div>
  );
}

// — Rejection reason dialog —

function RejectWithReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-h3 font-normal">
            Reject candidate?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="caps-meta text-muted-foreground">
              Reason{" "}
              <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. Skill gap in key area, found stronger candidate…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-sm resize-none"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-sm caps-action"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="rounded-sm caps-action gap-2"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Rejecting…
              </>
            ) : (
              "Yes, reject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// — Post-interview actions (interview_scheduled / interviewed) —

function PostInterviewActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusMutation = useUpdateApplicationStatus();
  const statusWithReasonMutation = useUpdateApplicationStatusWithReason();

  function markInterviewed() {
    setError(null);
    statusMutation.mutate(
      { id: applicationId, status: "interviewed" },
      { onError: () => setError("Couldn't update status") },
    );
  }

  function selectCandidate() {
    setError(null);
    statusWithReasonMutation.mutate(
      { id: applicationId, status: "hired" },
      { onError: () => setError("Couldn't update status") },
    );
  }

  function handleRejectConfirm(reason: string) {
    setError(null);
    statusWithReasonMutation.mutate(
      {
        id: applicationId,
        status: "rejected",
        rejectionReason: reason || undefined,
      },
      {
        onSuccess: () => setRejectOpen(false),
        onError: () => setError("Couldn't update status"),
      },
    );
  }

  const isPending =
    statusMutation.isPending || statusWithReasonMutation.isPending;

  return (
    <>
      <div className="space-y-2">
        <div className="space-y-1.5">
          {currentStatus === "interview_scheduled" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start rounded-sm caps-action gap-2"
              onClick={markInterviewed}
              disabled={isPending}
            >
              <CalendarCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
              Mark Interviewed
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start rounded-sm caps-action gap-2 data-active:bg-[#3F6B3F]/10 data-active:text-[#3F6B3F]"
            onClick={selectCandidate}
            disabled={isPending || currentStatus === "hired"}
            aria-busy={statusWithReasonMutation.isPending}
          >
            {statusWithReasonMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            {currentStatus === "hired" ? "Hired ✓" : "Hire Candidate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start rounded-sm caps-action gap-2 hover:border-primary/50 hover:text-primary"
            onClick={() => setRejectOpen(true)}
            disabled={isPending || currentStatus === "rejected"}
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            {currentStatus === "rejected" ? "Rejected" : "Reject"}
          </Button>
        </div>
        {error && <p className="caps-meta text-primary">{error}</p>}
      </div>

      <RejectWithReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleRejectConfirm}
        isPending={statusWithReasonMutation.isPending}
      />
    </>
  );
}

// — Main export — renders the right phase based on status —

export function StatusActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const isPostInterview =
    currentStatus === "interview_scheduled" ||
    currentStatus === "interviewed" ||
    currentStatus === "hired" ||
    currentStatus === "rejected";

  if (isPostInterview) {
    return (
      <PostInterviewActions
        applicationId={applicationId}
        currentStatus={currentStatus}
      />
    );
  }

  return (
    <PreInterviewActions
      applicationId={applicationId}
      currentStatus={currentStatus}
    />
  );
}
