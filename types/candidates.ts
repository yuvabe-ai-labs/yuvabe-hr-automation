import type { Tables } from "@/integrations/database.types";

export type ExperienceEntry = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  year: number;
};

export type CandidateLinks = {
  linkedin?: string;
  portfolio?: string;
  github?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  yearsOfExperience: number;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  links?: CandidateLinks;
  resumeText: string;
};

export type CandidateRow = Tables<"candidates">;
