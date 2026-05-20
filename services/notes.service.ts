import { getSupabasePeopleClient } from "@/integrations/supabase-people";
import type { ApplicationNote, NoteRow } from "@/types/notes";

export type { ApplicationNote };

function mapRowToNote(row: NoteRow): ApplicationNote {
  return {
    id: row.id,
    applicationId: row.application_id,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Fetch all notes for an application, ordered newest first
export async function listNotes(applicationId: string): Promise<ApplicationNote[]> {
  const client = getSupabasePeopleClient();
  const { data, error } = await client
    .from("application_notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listNotes failed: ${error.message}`);
  return (data as NoteRow[]).map(mapRowToNote);
}

// Create a new note for an application
export async function createNote(
  applicationId: string,
  authorEmail: string,
  body: string
): Promise<ApplicationNote> {
  const client = getSupabasePeopleClient();
  const { data, error } = await client
    .from("application_notes")
    .insert({ id: crypto.randomUUID(), application_id: applicationId, author_email: authorEmail, body })
    .select()
    .single();
  if (error) throw new Error(`createNote failed: ${error.message}`);
  return mapRowToNote(data as NoteRow);
}

// Update the body of an existing note
export async function updateNote(noteId: string, body: string): Promise<ApplicationNote> {
  const client = getSupabasePeopleClient();
  const { data, error } = await client
    .from("application_notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select()
    .single();
  if (error) throw new Error(`updateNote failed: ${error.message}`);
  return mapRowToNote(data as NoteRow);
}

// Delete a note by ID
export async function deleteNote(noteId: string): Promise<void> {
  const client = getSupabasePeopleClient();
  const { error } = await client
    .from("application_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw new Error(`deleteNote failed: ${error.message}`);
}
