"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotes, createNote, updateNote, deleteNote } from "@/services/notes.service";
import type { ApplicationNote } from "@/types/notes";

export type { ApplicationNote };

// Fetch all notes for an application
export function useNotes(applicationId: string) {
  return useQuery({
    queryKey: ["notes", applicationId],
    queryFn: () => listNotes(applicationId),
    enabled: !!applicationId,
  });
}

// Create a new note; re-fetches the notes list on success
export function useCreateNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ authorEmail, body }: { authorEmail: string; body: string }) =>
      createNote(applicationId, authorEmail, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", applicationId] });
    },
  });
}

// Update the body of an existing note
export function useUpdateNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      updateNote(noteId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", applicationId] });
    },
  });
}

// Delete a note by ID
export function useDeleteNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", applicationId] });
    },
  });
}
