import { supabase } from "@/lib/supabase";

export type ApplicationNote = {
  id: string;
  applicationId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  application_id: string;
  author_email: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function rowToNote(row: NoteRow): ApplicationNote {
  return {
    id: row.id,
    applicationId: row.application_id,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotes(applicationId: string): Promise<ApplicationNote[]> {
  const { data, error } = await supabase
    .from("application_notes")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listNotes failed: ${error.message}`);
  return (data as NoteRow[]).map(rowToNote);
}

export async function getNoteById(noteId: string): Promise<ApplicationNote | null> {
  const { data, error } = await supabase
    .from("application_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();
  if (error) throw new Error(`getNoteById failed: ${error.message}`);
  return data ? rowToNote(data as NoteRow) : null;
}

export async function createNote(
  applicationId: string,
  authorEmail: string,
  body: string
): Promise<ApplicationNote> {
  const { data, error } = await supabase
    .from("application_notes")
    .insert({ id: crypto.randomUUID(), application_id: applicationId, author_email: authorEmail, body })
    .select()
    .single();
  if (error) throw new Error(`createNote failed: ${error.message}`);
  return rowToNote(data as NoteRow);
}

export async function updateNote(
  noteId: string,
  body: string
): Promise<ApplicationNote | null> {
  const { data, error } = await supabase
    .from("application_notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateNote failed: ${error.message}`);
  return data ? rowToNote(data as NoteRow) : null;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from("application_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw new Error(`deleteNote failed: ${error.message}`);
}
