"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowUpRight, Loader2 } from "lucide-react";
import type { ExtractCriteriaResult } from "@/lib/prompts/extractCriteria.v1";
import type { Job } from "@/types/jobs";

export type JdPreviewData = {
  title: string;
  fileName?: string;
  department?: string;
  location?: string;
  type?: string;
  level?: string;
  compensation?: string;
  summary?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  portfolioRequirement?: string;
  benefitsRemote?: string[];
  benefitsInPerson?: string[];
  workCulture?: string[];
};

export type JdExtractionResult = ExtractCriteriaResult & {
  jd_text: string;
  file: { name: string; size: number };
};

export function jobToPreviewData(job: Job): JdPreviewData {
  return {
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    level: job.level,
    compensation: job.compensation,
    summary: job.summary,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    niceToHave: job.niceToHave,
    portfolioRequirement: job.portfolioRequirement,
    benefitsRemote: job.benefitsRemote,
    benefitsInPerson: job.benefitsInPerson,
    workCulture: job.workCulture,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: JdPreviewData | null;
  onPublish?: () => void;
  isPublishing?: boolean;
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="text-body text-foreground/80 flex gap-2 leading-relaxed">
          <span className="text-muted-foreground/65 mt-0.5 shrink-0">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function JdPreviewDialog({ open, onOpenChange, data, onPublish, isPublishing }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 flex flex-col gap-0 overflow-hidden max-h-[72vh]">

        {/* X close button */}
        <DialogClose className="absolute top-4 right-4 z-10 rounded-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <X className="h-4 w-4" strokeWidth={1.75} />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Sticky header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border pr-12">
          <DialogTitle className="font-serif italic text-h2 text-foreground/85 leading-tight">
            {data?.title || "Job Preview"}
          </DialogTitle>
          {data?.fileName && (
            <p className="caps-meta text-muted-foreground mt-2 truncate">
              {data.fileName}
            </p>
          )}
        </div>

        {/* Scrollable body */}
        {data && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

            {/* i. Basic Info */}
            <div className="space-y-5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif italic text-h2 leading-none text-primary">i.</span>
                <span className="font-serif italic text-h3 leading-none text-foreground/70">Basic Info</span>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="caps-meta text-muted-foreground mb-1.5">Title</p>
                  <p className="text-body text-foreground">{data.title}</p>
                </div>
                {data.department?.trim() && (
                  <div>
                    <p className="caps-meta text-muted-foreground mb-1.5">Department</p>
                    <p className="text-body text-foreground">{data.department}</p>
                  </div>
                )}
                {data.location?.trim() && (
                  <div>
                    <p className="caps-meta text-muted-foreground mb-1.5">Location</p>
                    <p className="text-body text-foreground">{data.location}</p>
                  </div>
                )}
                {data.type?.trim() && (
                  <div>
                    <p className="caps-meta text-muted-foreground mb-1.5">Type</p>
                    <p className="text-body text-foreground">{data.type}</p>
                  </div>
                )}
                {data.level?.trim() && (
                  <div>
                    <p className="caps-meta text-muted-foreground mb-1.5">Level</p>
                    <p className="text-body text-foreground">{data.level}</p>
                  </div>
                )}
                {data.compensation?.trim() && (
                  <div>
                    <p className="caps-meta text-muted-foreground mb-1.5">Compensation</p>
                    <p className="text-body text-foreground">{data.compensation}</p>
                  </div>
                )}
              </div>

              {data.summary?.trim() && (
                <div className="pt-1">
                  <p className="caps-meta text-muted-foreground mb-1.5">Summary</p>
                  <p className="text-body text-foreground/85 leading-relaxed">{data.summary}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* ii. Role Details */}
            <div className="space-y-5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif italic text-h2 leading-none text-primary">ii.</span>
                <span className="font-serif italic text-h3 leading-none text-foreground/70">Role Details</span>
              </div>

              {data.responsibilities && data.responsibilities.length > 0 && (
                <div>
                  <p className="caps-meta text-muted-foreground mb-2">Responsibilities</p>
                  <BulletList items={data.responsibilities} />
                </div>
              )}
              {data.requirements && data.requirements.length > 0 && (
                <div>
                  <p className="caps-meta text-muted-foreground mb-2">Requirements</p>
                  <BulletList items={data.requirements} />
                </div>
              )}
              {data.niceToHave && data.niceToHave.length > 0 && (
                <div>
                  <p className="caps-meta text-muted-foreground mb-2">Nice to Have</p>
                  <BulletList items={data.niceToHave} />
                </div>
              )}
              {data.portfolioRequirement && (
                <div>
                  <p className="caps-meta text-muted-foreground mb-1.5">Portfolio Requirement</p>
                  <p className="text-body text-foreground/85 leading-relaxed">{data.portfolioRequirement}</p>
                </div>
              )}
            </div>

            {/* iii. Benefits & Culture — only if any field is present */}
            {((data.benefitsRemote && data.benefitsRemote.length > 0) ||
              (data.benefitsInPerson && data.benefitsInPerson.length > 0) ||
              (data.workCulture && data.workCulture.length > 0)) && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-serif italic text-h2 leading-none text-primary">iii.</span>
                    <span className="font-serif italic text-h3 leading-none text-foreground/70">Benefits & Culture</span>
                  </div>
                  {data.benefitsRemote && data.benefitsRemote.length > 0 && (
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">Remote</p>
                      <BulletList items={data.benefitsRemote} />
                    </div>
                  )}
                  {data.benefitsInPerson && data.benefitsInPerson.length > 0 && (
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">In-Person</p>
                      <BulletList items={data.benefitsInPerson} />
                    </div>
                  )}
                  {data.workCulture && data.workCulture.length > 0 && (
                    <div>
                      <p className="caps-meta text-muted-foreground mb-2">Work Culture</p>
                      <BulletList items={data.workCulture} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Sticky footer — only when onPublish is provided */}
        {onPublish && (
          <div className="shrink-0 px-6 py-4 border-t border-border flex justify-end gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPublishing}
              className="rounded-sm caps-action"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onPublish}
              disabled={isPublishing}
              className="rounded-sm caps-action gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Publishing
                </>
              ) : (
                <>
                  Confirm
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </>
              )}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
