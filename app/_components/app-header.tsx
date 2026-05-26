"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import NavTab from "@/app/jobs/_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { UserBadge } from "@/app/_components/user-badge";
import { Eyebrow } from "@/components/shared/eyebrow";

type Props = {
  /** Back arrow link shown on the right of the top row. */
  backLink?: {
    href: string;
    label: ReactNode;
    /** Truncate long labels (e.g. job titles). */
    truncate?: boolean;
  };
  /** Fully custom top-row right slot. Overrides backLink and UserBadge. */
  topRight?: ReactNode;
};

export function AppHeader({ backLink, topRight }: Props) {
  const right =
    topRight !== undefined ? (
      topRight
    ) : backLink ? (
      <Link
        href={backLink.href}
        className="inline-flex items-center gap-1.5 caps-action text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-0"
      >
        <ArrowLeft className="h-3 w-3 shrink-0" />
        <span className={backLink.truncate ? "truncate max-w-[40ch]" : "hidden sm:inline"}>
          {backLink.label}
        </span>
      </Link>
    ) : (
      <UserBadge />
    );

  return (
    <header className="shrink-0 border-b border-border bg-background z-10">
      <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0"
          >
            <Image
              src="/assests/yuvabe_logo.png"
              alt=""
              width={24}
              height={24}
              className="object-contain"
              priority
            />
            <span className="font-serif italic text-h3 leading-none">Yuvabe</span>
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <Eyebrow>ATS</Eyebrow>
        </div>
        {right}
      </div>
      <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <NavTab href="/jobs" label="Jobs" prefix="/jobs" />
        <NavTab href="/interviews" label="Interviews" prefix="/interviews" />
        <SignOutButton className="ml-auto" />
      </nav>
    </header>
  );
}
