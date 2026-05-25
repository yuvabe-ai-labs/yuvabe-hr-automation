"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Hardcoded-credentials login. POSTs to /api/auth/login; the cookie is set
 * by the route handler. On success, redirect to the `next` query param
 * (preserved by middleware on initial redirect) or default to /jobs.
 *
 * Editorial styling: Newsreader italic display, mono-caps eyebrow, hairline
 * input borders, single terracotta primary button. No card, no shadow.
 *
 * The Suspense boundary is required by Next.js 16 because LoginForm calls
 * useSearchParams(), which can't be resolved during static prerender.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

/** Static skeleton shown during the brief Suspense fallback. */
function LoginShell() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <span className="eyebrow text-muted-foreground">ATS</span>
          <Image
            src="/assests/yuvabe.png"
            alt="Yuvabe"
            width={160}
            height={48}
            className="mt-3 mx-auto -translate-x-3"
            priority
          />
        </div>
      </div>
    </main>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/jobs";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't sign in.");
        setSubmitting(false);
        return;
      }
      // Hard navigation so middleware reads the new cookie on the next request.
      window.location.href = next;
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <span className="eyebrow text-muted-foreground">ATS</span>
          <Image
            src="/assests/yuvabe.png"
            alt="Yuvabe"
            width={160}
            height={48}
            className="mt-3 mx-auto -translate-x-3"
            priority
          />
          <p className="mt-4 font-serif italic text-body-lg text-foreground/70">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="eyebrow text-muted-foreground"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="pass"
              className="eyebrow text-muted-foreground"
            >
              Password
            </Label>
            <Input
              id="pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full caps-action h-10"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          {error && (
            <p className="text-center caps-meta text-primary">{error}</p>
          )}
        </form>

        <p className="mt-12 text-center font-serif italic text-body-sm text-muted-foreground/70">
          Hiring is a human act.
        </p>
      </div>
    </main>
  );
}
