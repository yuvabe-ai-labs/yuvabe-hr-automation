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
import { MoreHorizontal } from "lucide-react";
import { useUpdateJobStatus } from "@/hooks/use-jobs";

export function JobActionsMenu({
  jobCode,
  jobTitle,
  status,
}: {
  jobCode: string;
  jobTitle: string;
  status: "active" | "archived";
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: updateStatus, isPending } = useUpdateJobStatus();

  const handleArchiveSelect = () => {
    setDropdownOpen(false);
    if (status === "archived") {
      updateStatus({ code: jobCode, status: "active" });
      return;
    }
    setConfirmOpen(true);
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
          <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
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
    </>
  );
}
