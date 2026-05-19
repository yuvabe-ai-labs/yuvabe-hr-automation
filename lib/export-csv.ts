import type { Application } from "@/types/applications.types";
import type { CandidateEnrichment } from "@/services/candidates.service";

const HEADERS = [
  "Candidate Name", "Email", "Phone", "Location",
  "Years of Experience", "Match Score", "Job Applied For",
  "Resume URL", "LinkedIn", "GitHub", "Portfolio",
  "Review Notes", "Date Applied",
];

function escapeCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsvContent(
  applications: Application[],
  enrichments: Map<string, CandidateEnrichment>,
  jobTitles: Map<string, string>,
  notesByAppId: Map<string, string>
): string {
  const rows = applications.map((app) => {
    const enr = enrichments.get(app.candidateId);
    return [
      app.candidateName,
      app.candidateEmail,
      enr?.phone ?? "",
      app.candidateLocation,
      String(app.candidateYearsOfExperience),
      String(app.matchScore),
      jobTitles.get(app.jobCode) ?? app.jobCode,
      app.resumeUrl ?? "",
      enr?.links?.linkedin ?? "",
      enr?.links?.github ?? "",
      enr?.links?.portfolio ?? "",
      notesByAppId.get(app.id) ?? "",
      new Date(app.receivedAt).toLocaleDateString("en-US"),
    ]
      .map(escapeCell)
      .join(",");
  });
  return [HEADERS.map(escapeCell).join(","), ...rows].join("\n");
}

export function downloadCsv(csvContent: string, filename = "candidates.csv"): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
