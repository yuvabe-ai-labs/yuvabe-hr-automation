"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, MoreHorizontal } from "lucide-react";
import type { ApplicationNote } from "@/lib/notes-store";

/* —— helpers —— */

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* —— main component —— */

export function NotesThread({
  applicationId,
  initialNotes,
  currentUser,
  open,
  onOpenChange,
}: {
  applicationId: string;
  initialNotes: ApplicationNote[];
  currentUser: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [isAdding, setIsAdding] = useState(false);
  const [addBody, setAddBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayed = sort === "newest" ? notes : [...notes].reverse();

  /* — add — */
  function handleAdd() {
    const body = addBody.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't add note");
        return;
      }
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setAddBody("");
      setIsAdding(false);
    });
  }

  /* — edit — */
  function startEdit(note: ApplicationNote) {
    setEditingId(note.id);
    setEditBody(note.body);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(noteId: string) {
    const body = editBody.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/applications/${applicationId}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save changes");
        return;
      }
      const { note } = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? note : n)));
      setEditingId(null);
    });
  }

  /* — delete (optimistic) — */
  function handleDelete(noteId: string) {
    const snapshot = notes.find((n) => n.id === noteId);
    if (!snapshot) return;
    setError(null);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    startTransition(async () => {
      const res = await fetch(`/api/applications/${applicationId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setNotes((prev) =>
          [...prev, snapshot].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't delete note");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 w-full sm:w-[400px]">

        {/* Sheet header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <SheetTitle>Reviewer Notes</SheetTitle>
              <div className="flex items-center gap-2">
                {/* Sort filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1.5 caps-meta text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
                      aria-label="Sort notes"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">{sort === "newest" ? "Newest" : "Oldest"}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem
                      onClick={() => setSort("newest")}
                      className={sort === "newest" ? "text-primary font-medium" : ""}
                    >
                      Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSort("oldest")}
                      className={sort === "oldest" ? "text-primary font-medium" : ""}
                    >
                      Oldest first
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Add note button */}
                {!isAdding && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsAdding(true); setError(null); }}
                    className="caps-action rounded-sm"
                  >
                    Add note
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Add form */}
          {isAdding && (
            <div className="mb-4 space-y-2">
              <Textarea
                value={addBody}
                onChange={(e) => setAddBody(e.target.value)}
                placeholder="Add a reviewer note…"
                className="min-h-[88px] text-body resize-none rounded-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
                  if (e.key === "Escape") { setIsAdding(false); setAddBody(""); setError(null); }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!addBody.trim() || isPending}
                  className="caps-action rounded-sm"
                >
                  {isPending ? "Saving…" : "Save note"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setAddBody(""); setError(null); }}
                  className="caps-action rounded-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 border-l-2 border-primary pl-4 py-1.5 bg-primary/[0.03]">
              <p className="caps-action text-primary mb-0.5">Couldn&apos;t complete action</p>
              <p className="text-body-sm text-foreground/80">{error}</p>
            </div>
          )}

          {/* Notes list */}
          {notes.length === 0 && !isAdding ? (
            <p className="mt-8 font-serif italic text-body-lg text-foreground/55 leading-tight text-center">
              No reviewer notes yet.
            </p>
          ) : (
            <ul>
              {displayed.map((note) => (
                <li key={note.id} className="border-b border-border/50 last:border-b-0 py-4">

                  {/* Meta row */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="caps-meta text-foreground/80 truncate">
                        {note.authorEmail}
                      </span>
                      <span className="caps-meta text-muted-foreground tabular flex-shrink-0">
                        {relativeTime(note.createdAt)}
                        {note.updatedAt !== note.createdAt && (
                          <span className="text-muted-foreground/65"> · edited</span>
                        )}
                      </span>
                    </div>

                    {editingId !== note.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex-shrink-0 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Note actions"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[100px]">
                          <DropdownMenuItem onClick={() => startEdit(note)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(note.id)}
                            disabled={isPending}
                            className="text-primary focus:text-primary"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Body / edit form */}
                  {editingId === note.id ? (
                    <div className="mt-2.5 space-y-2">
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="min-h-[88px] text-body resize-none rounded-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveEdit(note.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editBody.trim() || isPending}
                          className="caps-action rounded-sm"
                        >
                          {isPending ? "Saving…" : "Save"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="caps-action rounded-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-body text-foreground/85 whitespace-pre-wrap leading-relaxed">
                      {note.body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
