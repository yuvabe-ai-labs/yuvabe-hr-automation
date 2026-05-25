"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Copy, MoreHorizontal } from "lucide-react";
import { useUpdateJobStatus } from "@/hooks/use-jobs";
import { JdPreviewDialog, jobToPreviewData } from "@/app/jobs/_components/jd-preview-dialog";
import { useSession } from "@/app/providers";
import type { Job } from "@/types/jobs";

export function JobActionsMenu({
  jobCode,
  jobTitle,
  status,
  job,
}: {
  jobCode: string;
  jobTitle: string;
  status: "active" | "archived" | "draft";
  job?: Job;
}) {
  const { role } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishPreviewOpen, setPublishPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mutate: updateStatus, isPending } = useUpdateJobStatus();

  const studiosBase = (process.env.NEXT_PUBLIC_YB_STUDIOS ?? "").replace(/\/$/, "");
  const publishedUrl = `${studiosBase}/${jobCode}`;

  function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (role === "viewer") return null;

  const handleArchiveSelect = () => {
    setDropdownOpen(false);
    if (status === "archived") {
      updateStatus({ code: jobCode, status: "active" });
      return;
    }
    setConfirmOpen(true);
  };

  const handlePublish = () => {
    setDropdownOpen(false);
    if (job) {
      setPublishPreviewOpen(true);
    } else {
      updateStatus({ code: jobCode, status: "active" });
    }
  };

  const handleConfirmArchive = () => {
    updateStatus({ code: jobCode, status: "archived" });
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            className="relative z-10 h-8 w-8 text-muted-foreground/70 group-hover:text-muted-foreground hover:text-foreground! hover:bg-secondary transition-colors"
            aria-label={`More actions for ${jobTitle}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/jobs/${jobCode}/view`}>View criteria</Link>
          </DropdownMenuItem>
          {status === "active" && (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm"
                onClick={() => setDropdownOpen(false)}
              >
                Published link
              </a>
              <button
                className="shrink-0 px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={handleCopyLink}
                aria-label="Copy published link"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "draft" ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handlePublish();
              }}
              className="text-foreground focus:text-foreground"
            >
              Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleArchiveSelect();
              }}
              className={
                status === "archived"
                  ? "text-foreground focus:text-foreground"
                  : "text-primary focus:text-primary"
              }
            >
              {status === "archived" ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif italic text-h3 text-foreground">
              Archive &ldquo;{jobTitle}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body text-foreground/70">
              Archiving this job will remove it from the Yuvabe Studios Careers listings.
              You can restore the job later by unarchiving it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmArchive}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {job && (
        <JdPreviewDialog
          open={publishPreviewOpen}
          onOpenChange={setPublishPreviewOpen}
          data={jobToPreviewData(job)}
          onPublish={() => {
            setPublishPreviewOpen(false);
            updateStatus({ code: jobCode, status: "active" });
          }}
          isPublishing={isPending}
        />
      )}
    </>
  );
}
