import { NextResponse } from "next/server";
import { z } from "zod";
import { listNotes, createNote } from "@/lib/notes-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const notes = await listNotes(id);
    return NextResponse.json({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notes";
    console.error("[api/applications/[id]/notes GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const createSchema = z.object({
  body: z.string().min(1, "Note cannot be empty").max(4000, "Note is too long"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authorEmail = process.env.AUTH_USER ?? "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  try {
    const note = await createNote(id, authorEmail, parsed.data.body);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note";
    console.error("[api/applications/[id]/notes POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
