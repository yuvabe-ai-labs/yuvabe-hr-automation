"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { NotesThread } from "./notes-thread";
import type { ApplicationNote } from "@/lib/notes-store";

export function NotesButton({
  applicationId,
  initialNotes,
  currentUser,
}: {
  applicationId: string;
  initialNotes: ApplicationNote[];
  currentUser: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
      >
        <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span className="hidden sm:inline">Notes</span>
      </button>
      <NotesThread
        applicationId={applicationId}
        initialNotes={initialNotes}
        currentUser={currentUser}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
