import type { ApplicationStatus } from "@/types/applications";
import type { FilterStatus } from "@/services/applications.service";

export type ExtendedFilter = FilterStatus | "all" | "new";

export const ALL_FILTER_TABS: ExtendedFilter[] = ["all", "new", "reviewing", "shortlisted", "rejected"];

export const FILTER_LABEL: Record<ExtendedFilter, string> = {
  all: "All",
  new: "New",
  reviewing: "Review",
  shortlisted: "Shortlist",
  rejected: "Reject",
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
};

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "text-foreground/70",
  reviewing: "text-foreground",
  shortlisted: "text-[#2F5E7A]",
  rejected: "text-muted-foreground line-through",
  offered: "text-[#3F6B3F]",
};

export const IMPORTANCE_LABEL = {
  must: "Must",
  strong: "Preferred",
  nice: "Nice",
} as const;

export const IMPORTANCE_COLOR: Record<"must" | "strong" | "nice", string> = {
  must: "text-primary",
  strong: "text-foreground",
  nice: "text-muted-foreground",
};
