import { NextResponse } from "next/server";
import { z } from "zod";
import { getNoteById, updateNote, deleteNote } from "@/lib/notes-store";

export const runtime = "nodejs";

const updateSchema = z.object({
  body: z.string().min(1, "Note cannot be empty").max(4000, "Note is too long"),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { noteId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  try {
    const existing = await getNoteById(noteId);
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    const note = await updateNote(noteId, parsed.data.body);
    return NextResponse.json({ note });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update note";
    console.error("[api/applications/[id]/notes/[noteId] PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { noteId } = await params;

  try {
    const existing = await getNoteById(noteId);
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    await deleteNote(noteId);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete note";
    console.error("[api/applications/[id]/notes/[noteId] DELETE]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
