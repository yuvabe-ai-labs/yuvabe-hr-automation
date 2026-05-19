import type { Tables } from "@/integrations/database.types";

export type Criterion = {
  id: string;
  category?: "skill" | "experience" | "education" | "domain" | "other";
  label: string;
  importance: "must" | "strong" | "nice";
};

export type Job = {
  id: string;
  code: string;
  title: string;
  description: string;
  criteria: Criterion[];
  department?: string;
  location?: string;
  compensation?: string;
  type?: string;
  level?: string;
  summary?: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  portfolioRequirement?: string;
  benefitsRemote: string[];
  benefitsInPerson: string[];
  workCulture: string[];
  createdAt: string;
  archivedAt?: string;
  status: "active" | "archived";
};

export type JobRow = Tables<"jobs">;
