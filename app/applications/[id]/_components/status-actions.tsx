"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eye, Check, X } from "lucide-react";
import { useUpdateApplicationStatus } from "@/hooks/use-applications";
import type { ApplicationStatus } from "@/types/applications";

type ToggleStatus = "reviewing" | "shortlisted" | "rejected";

function toToggleStatus(status: ApplicationStatus): ToggleStatus | null {
  if (status === "new") return null;
  if (status === "shortlisted" || status === "offered") return "shortlisted";
  if (status === "rejected") return "rejected";
  return "reviewing";
}

export function StatusActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<ApplicationStatus>(currentStatus);
  const updateMutation = useUpdateApplicationStatus();

  const displayValue = toToggleStatus(optimisticStatus);

  const setStatus = (next: ToggleStatus) => {
    if (next === toToggleStatus(optimisticStatus)) return;
    setError(null);
    setOptimisticStatus(next);
    updateMutation.mutate(
      { id: applicationId, status: next },
      {
        onError: () => {
          setOptimisticStatus(currentStatus);
          setError("Couldn't update status");
        },
      }
    );
  };

  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        orientation="vertical"
        variant="outline"
        value={displayValue ?? ""}
        onValueChange={(v) => v && setStatus(v as ToggleStatus)}
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
