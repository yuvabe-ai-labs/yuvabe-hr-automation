import * as XLSX from "xlsx";
import type { Application } from "@/types/applications";
import type { CandidateEnrichment } from "@/services/candidates.service";

export function downloadExcel(
  applications: Application[],
  enrichments: Map<string, CandidateEnrichment>,
  jobTitles: Map<string, string>,
  notesByAppId: Map<string, string>,
  filename = "candidates.xlsx"
): void {
  const rows = applications.map((app) => {
    const enr = enrichments.get(app.candidateId);
    return {
      "Candidate Name": app.candidateName,
      "Email": app.candidateEmail,
      "Phone": enr?.phone ?? "",
      "Location": app.candidateLocation,
      "Years of Experience": app.candidateYearsOfExperience,
      "Match Score": app.matchScore,
      "Job Applied For": jobTitles.get(app.jobCode) ?? app.jobCode,
      "Resume URL": app.resumeUrl ?? "",
      "LinkedIn": enr?.links?.linkedin ?? "",
      "GitHub": enr?.links?.github ?? "",
      "Portfolio": enr?.links?.portfolio ?? "",
      "Review Notes": notesByAppId.get(app.id) ?? "",
      "Date Applied": new Date(app.receivedAt).toLocaleDateString("en-US"),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size each column to fit its widest cell
  const headers = Object.keys(rows[0] ?? {});
  ws["!cols"] = headers.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 60) }; // cap at 60 chars for readability
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, filename);
}
