import type { Tables } from "@/integrations/database.types";

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview_scheduled"
  | "interviewed"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export type CriterionMatch = {
  criterionId?: string;
  criterionLabel: string;
  importance: "must" | "strong" | "nice";
  matched: "yes" | "partial" | "no";
  evidence: string;
  score: number;
};

export type Application = {
  id: string;
  jobId: string;
  jobCode: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateLocation: string;
  candidateYearsOfExperience: number;
  matchScore: number;
  matchSummary: string;
  matchBreakdown: CriterionMatch[];
  coverLetter: string;
  resumeUrl?: string;
  receivedAt: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  assignedInterviewerId?: string;
};

export type ApplicationRow = Tables<"applications">;
