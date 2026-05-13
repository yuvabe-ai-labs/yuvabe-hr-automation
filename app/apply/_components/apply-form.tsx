"use client";

import { useRef, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, ArrowUpRight } from "lucide-react";

const ACCEPTED = ".pdf,.docx,.txt,.md";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function compressPdf(file: File): Promise<File> {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const compressed = await doc.save({ useObjectStreams: true });
  return new File([Buffer.from(compressed)], file.name, {
    type: "application/pdf",
  });
}

export function ApplyForm({ jobCode }: { jobCode: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setResume(f);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resume) {
      setError("Please attach a resume.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let fileToUpload = resume;

      // Compress PDF if applicable
      if (resume.type === "application/pdf" || resume.name.endsWith(".pdf")) {
        fileToUpload = await compressPdf(resume);
        if (fileToUpload.size > MAX_FILE_SIZE) {
          setError(
            "Resume exceeds 2 MB even after compression. Please export a smaller PDF."
          );
          setSubmitting(false);
          return;
        }
      } else if (fileToUpload.size > MAX_FILE_SIZE) {
        // Non-PDF files must be under 2 MB
        setError("Resume file must be under 2 MB.");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();
      fd.append("jobCode", jobCode);
      fd.append("name", name);
      fd.append("email", email);
      fd.append("resume", fileToUpload);
      const res = await fetch("/api/applications", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || `Request failed (${res.status})`);
      router.push(`/applications/${data.applicationId}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" aria-busy={submitting}>
      <div className="space-y-2">
        <Label htmlFor="apply-name" className="caps-action text-foreground/70">
          Full name
        </Label>
        <Input
          id="apply-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          disabled={submitting}
          className="rounded-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apply-email" className="caps-action text-foreground/70">
          Email
        </Label>
        <Input
          id="apply-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={submitting}
          className="rounded-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="caps-action text-foreground/70">Resume</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFileChange}
          className="hidden"
        />
        {resume ? (
          <div className="border border-border rounded-sm bg-card px-4 py-3 flex items-center gap-3">
            <FileText
              className="h-4 w-4 text-foreground/50 shrink-0"
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-foreground truncate">
                {resume.name}
              </p>
              <p className="font-mono text-eyebrow text-muted-foreground tabular mt-0.5">
                {formatSize(resume.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={pickFile}
              disabled={submitting}
              className="caps-action text-muted-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickFile}
            className="w-full border border-dashed border-border rounded-sm bg-card px-4 py-6 text-left flex items-center gap-3 hover:bg-secondary/40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <FileText
              className="h-4 w-4 text-foreground/50 shrink-0"
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-foreground">
                Choose a file
              </p>
              <p className="font-mono text-eyebrow text-muted-foreground tabular mt-0.5">
                PDF · DOCX · TXT · MD
              </p>
              <p className="font-mono text-eyebrow text-muted-foreground/70 mt-1">
                Max 2 MB (PDF files compressed automatically)
              </p>
            </div>
          </button>
        )}
      </div>

      {error && (
        <div className="border-l-2 border-primary pl-4 py-2 bg-primary/[0.03]">
          <p className="caps-action text-primary mb-1">
            Couldn't submit your application
          </p>
          <p className="text-body text-foreground/80">{error}</p>
        </div>
      )}

      <div className="h-px bg-border w-full" />

      <div className="flex items-center justify-between gap-4">
        {submitting ? (
          <div className="flex items-center gap-3 text-body text-foreground/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="font-serif italic">Reviewing your resume…</span>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground max-w-[16rem] leading-relaxed">
            We&apos;ll match your resume against the role and respond within
            a few days.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitting || !name || !email || !resume}
          className="gap-2 rounded-sm font-medium tracking-tight"
        >
          Submit application
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </form>
  );
}
