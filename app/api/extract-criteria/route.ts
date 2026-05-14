import { NextResponse } from "next/server";
import { extractCriteria } from "@/lib/llm";
import { extractTextFromFile } from "@/lib/parseUpload";
import { generateCriterionId, type Criterion } from "@/lib/prompts/extractCriteria.v1";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data with a `file` field." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await extractTextFromFile(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const trimmed = parsed.text.trim();
  if (trimmed.length < 50) {
    return NextResponse.json(
      { error: "Couldn't read enough text from this file (might be an image-only PDF)." },
      { status: 400 }
    );
  }

  try {
    const result = await extractCriteria(trimmed);
    // Assign a stable id to each criterion now, before they flow into the
    // recruiter's editor and downstream into createJob. The LLM intentionally
    // does not generate ids (LLMs are unreliable at random/unique strings).
    const criteria: Criterion[] = result.criteria.map((c) => ({
      ...c,
      id: generateCriterionId(),
    }));
    return NextResponse.json({
      title_suggestion: result.title_suggestion,
      department: result.department ?? null,
      level: result.level ?? null,
      job_type: result.job_type ?? null,
      location: result.location ?? null,
      compensation: result.compensation ?? null,
      summary: result.summary ?? null,
      responsibilities: result.responsibilities ?? null,
      requirements: result.requirements ?? null,
      nice_to_have: result.nice_to_have ?? null,
      portfolio_requirement: result.portfolio_requirement ?? null,
      benefits_remote: result.benefits_remote ?? null,
      benefits_inperson: result.benefits_inperson ?? null,
      work_culture: result.work_culture ?? null,
      criteria,
      jd_text: trimmed,
      file: { name: parsed.filename, size: parsed.size },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[extract-criteria]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
