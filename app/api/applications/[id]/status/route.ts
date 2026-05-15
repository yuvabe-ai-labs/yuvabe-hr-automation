import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateApplicationStatus } from "@/lib/applications-store";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["new", "reviewing", "shortlisted", "rejected", "offered"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status" },
      { status: 400 }
    );
  }

  try {
    const application = await updateApplicationStatus(id, parsed.data.status);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    try {
      revalidatePath(`/jobs/${application.jobCode}`);
      revalidatePath(`/applications/${id}`);
    } catch {
      // revalidatePath may not be available in all runtime contexts (e.g. dev without incremental cache)
    }
    return NextResponse.json({ application });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    console.error("[api/applications/[id]/status PATCH]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
