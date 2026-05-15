import { NextResponse } from "next/server";
import { z } from "zod";
import { extractTextFromFile } from "@/lib/parseUpload";
import { getJobByCode } from "@/lib/jobs-store";
import { createCandidate } from "@/lib/candidates-store";
import { createApplication, type CriterionMatch } from "@/lib/applications-store";
import { parseResume, scoreResume } from "@/lib/llm";
import { IMPORTANCE_WEIGHT } from "@/lib/prompts/extractCriteria.v1";
import type { Job } from "@/lib/jobs-store";

/**
 * Deterministic 0-100 match score, computed in code (not asked of the LLM)
 * so the value is stable across re-runs and consistent with the breakdown
 * the user sees on the detail page.
 *   matchScore = round( 100 × Σ(weight_i × score_i / 10) / Σ(weight_i) )
 */
function computeMatchScore(breakdown: CriterionMatch[]): number {
  if (breakdown.length === 0) return 0;
  let weightedScore = 0;
  let totalWeight = 0;
  for (const row of breakdown) {
    const weight = IMPORTANCE_WEIGHT[row.importance];
    weightedScore += weight * (row.score / 10);
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((100 * weightedScore) / totalWeight);
}

export const runtime = "nodejs";

const FormSchema = z.object({
  jobCode: z.string().min(1, "Missing jobCode."),
  name: z.string().min(1, "Missing name."),
  email: z.string().email("Invalid email."),
});

// Runs after response is flushed — does the heavy LLM work and updates the records.
async function processInBackground(
  resumeFile: File,
  candidateId: string,
  applicationId: string,
  job: Job,
) {
  try {
    let parsedFile;
    try {
      parsedFile = await extractTextFromFile(resumeFile);
    } catch (err) {
      console.error("[applications/bg] file extraction failed:", err);
      return;
    }

    const resumeText = parsedFile.text.trim();
    if (resumeText.length < 50) {
      console.error("[applications/bg] resume too short to score — possible image-only PDF");
      return;
    }

    const [profile, scoring] = await Promise.all([
      parseResume(resumeText),
      scoreResume(resumeText, "", job.criteria),
    ]);

    const links: { linkedin?: string; portfolio?: string; github?: string } = {};
    if (profile.links.linkedin)  links.linkedin  = profile.links.linkedin;
    if (profile.links.portfolio) links.portfolio = profile.links.portfolio;
    if (profile.links.github)    links.github    = profile.links.github;

    const criteriaByLabel = new Map(job.criteria.map((c) => [c.label, c]));
    const matchBreakdown: CriterionMatch[] = scoring.matchBreakdown.map((row: CriterionMatch) => {
      // Strip the [MUST] / [STRONG] / [NICE] prefix the LLM echoes back from the prompt format
      const cleanLabel = row.criterionLabel.replace(/^\[(MUST|STRONG|NICE)\]\s*/i, "").trim();
      const parent = criteriaByLabel.get(cleanLabel);
      return parent
        ? { ...row, criterionLabel: cleanLabel, criterionId: parent.id }
        : { ...row, criterionLabel: cleanLabel };
    });
    const matchScore = computeMatchScore(matchBreakdown);

    const { supabase } = await import("@/lib/supabase");

    await supabase.from("candidates").update({
      phone:                profile.phone,
      location:             profile.location,
      summary:              profile.summary,
      years_of_experience:  profile.yearsOfExperience,
      skills:               profile.skills,
      experience:           profile.experience,
      education:            profile.education,
      links:                Object.keys(links).length > 0 ? links : null,
      resume_text:          resumeText,
    }).eq("id", candidateId);

    await supabase.from("applications").update({
      match_score:                   matchScore,
      match_summary:                 scoring.matchSummary,
      match_breakdown:               matchBreakdown,
      candidate_location:            profile.location,
      candidate_years_of_experience: profile.yearsOfExperience,
    }).eq("id", applicationId);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[applications/bg]", message);
  }
}

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 }
    );
  }

  const parsed = FormSchema.safeParse({
    jobCode: formData.get("jobCode"),
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid form." },
      { status: 400 }
    );
  }
  const { jobCode, name, email } = parsed.data;

  const resume = formData.get("resume");
  if (!resume || !(resume instanceof File)) {
    return NextResponse.json({ error: "No resume uploaded." }, { status: 400 });
  }

  const job = await getJobByCode(jobCode);
  if (!job) {
    return NextResponse.json(
      { error: `Job ${jobCode} not found.` },
      { status: 404 }
    );
  }

  // Read the file buffer now — arrayBuffer() can only be consumed once.
  // The buffer is passed to the background task so it can reconstruct the File.
  const fileBuffer = Buffer.from(await resume.arrayBuffer());

  const { supabase } = await import("@/lib/supabase");

  // Upload raw resume to storage immediately so the download link is available
  // from the moment the application record exists.
  const ext = resume.name.split(".").pop()?.toLowerCase() ?? "bin";
  const candidate = await createCandidate({
    name,
    email,
    phone: "",
    location: "",
    summary: "",
    yearsOfExperience: 0,
    skills: [],
    experience: [],
    education: [],
  });

  const storagePath = `${jobCode}/${candidate.id}.${ext}`;
  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, fileBuffer, {
      contentType: resume.type || "application/octet-stream",
      upsert: false,
    });

  const safeName = name.replace(/[^\w\s-]/g, "").trim();
  const resumeUrl = storageError
    ? undefined
    : supabase.storage.from("resumes").getPublicUrl(storagePath, {
        download: `${safeName} Resume.${ext}`,
      }).data.publicUrl;

  const application = await createApplication({
    jobId: job.id,
    jobCode: job.code,
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    candidateLocation: "",
    candidateYearsOfExperience: 0,
    matchScore: 0,
    matchSummary: "",
    matchBreakdown: [],
    coverLetter: "",
    resumeUrl,
    status: "new",
  });

  // Schedule background processing — runs after response is sent.
  const resumeForBg = new File([fileBuffer], resume.name, { type: resume.type });
  processInBackground(resumeForBg, candidate.id, application.id, job).catch(
    (err) => console.error("[applications/bg]", err)
  );

  return NextResponse.json(
    { applicationId: application.id },
    { status: 201 }
  );
}
