"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotesThread } from "./notes-thread";

export function NotesButton({
  applicationId,
  currentUser,
}: {
  applicationId: string;
  currentUser: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-sm caps-action gap-1.5 h-7 px-3 text-foreground/80 hover:text-foreground"
      >
        <MessageSquare className="h-3 w-3" strokeWidth={1.75} />
        Review Notes
      </Button>
      <NotesThread
        applicationId={applicationId}
        currentUser={currentUser}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
