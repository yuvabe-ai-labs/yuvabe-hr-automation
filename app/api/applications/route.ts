import { NextResponse } from "next/server";
import { z } from "zod";
import { extractTextFromFile } from "@/lib/parseUpload";
import { getJobByCode } from "@/lib/jobs-store";
import { createCandidate } from "@/lib/candidates-store";
import { createApplication, type CriterionMatch } from "@/lib/applications-store";
import { parseResume, scoreResume } from "@/lib/llm";
import { IMPORTANCE_WEIGHT } from "@/lib/prompts/extractCriteria.v1";

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
export const maxDuration = 60;

const FormSchema = z.object({
  jobCode: z.string().min(1, "Missing jobCode."),
  name: z.string().min(1, "Missing name."),
  email: z.string().email("Invalid email."),
});

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

  let parsedFile;
  try {
    parsedFile = await extractTextFromFile(resume);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const resumeText = parsedFile.text.trim();
  if (resumeText.length < 50) {
    return NextResponse.json(
      { error: "Couldn't read enough text from this resume (might be an image-only PDF)." },
      { status: 400 }
    );
  }

  try {
    // Two LLM calls in parallel: structured candidate parse + criteria scoring.
    // Both depend only on resumeText (and the job's criteria for scoring), so
    // running them concurrently halves the user-perceived latency.
    const [profile, scoring] = await Promise.all([
      parseResume(resumeText),
      scoreResume(resumeText, "", job.criteria),
    ]);

    // Drop empty link strings so the UI's `links?.linkedin` checks behave like
    // the seeded examples (where a missing URL means the key is absent).
    const links: { linkedin?: string; portfolio?: string; github?: string } = {};
    if (profile.links.linkedin) links.linkedin = profile.links.linkedin;
    if (profile.links.portfolio) links.portfolio = profile.links.portfolio;
    if (profile.links.github) links.github = profile.links.github;

    const candidate = await createCandidate({
      name,
      email,
      phone: profile.phone,
      location: profile.location,
      summary: profile.summary,
      yearsOfExperience: profile.yearsOfExperience,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
      ...(Object.keys(links).length > 0 ? { links } : {}),
      resumeText,
    });

    // Stamp each breakdown row with the parent Job's stable Criterion.id when
    // we can resolve it by label. If the LLM ever drifts the label slightly,
    // the row falls through with `criterionId` undefined and we still have the
    // denormalized label/importance for display.
    const criteriaByLabel = new Map(job.criteria.map((c) => [c.label, c]));
    const matchBreakdown: CriterionMatch[] = scoring.matchBreakdown.map((row) => {
      const parent = criteriaByLabel.get(row.criterionLabel);
      return parent ? { ...row, criterionId: parent.id } : row;
    });
    const matchScore = computeMatchScore(matchBreakdown);

    const application = await createApplication({
      jobId: job.id,
      jobCode: job.code,
      candidateId: candidate.id,
      // Snapshots — read-side denormalization for listing pages.
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateLocation: candidate.location,
      candidateYearsOfExperience: candidate.yearsOfExperience,
      matchScore,
      matchSummary: scoring.matchSummary,
      matchBreakdown,
      coverLetter: "",
      status: "new",
    });

    return NextResponse.json(
      { applicationId: application.id },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[applications]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
