import { NextResponse } from "next/server";
import { z } from "zod";
import { archiveJob, unarchiveJob } from "@/lib/jobs-store";
import { updateJobStatus } from "@/services/jobs.service";

export const runtime = "nodejs";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("unarchive") }),
  z.object({
    action: z.literal("updateStatus"),
    status: z.enum(["active", "archived"]),
  }),
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  try {
    let job;
    if (parsed.data.action === "updateStatus") {
      job = await updateJobStatus(code, parsed.data.status);
    } else {
      job =
        parsed.data.action === "archive"
          ? await archiveJob(code)
          : await unarchiveJob(code);
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    console.error("[api/jobs/[code] PATCH]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
