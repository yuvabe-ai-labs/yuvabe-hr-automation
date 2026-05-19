import Link from "next/link";
import NavTab from "@/app/jobs/_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { Eyebrow } from "@/components/shared/eyebrow";

export function PageHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-background z-10">
      <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <Link
            href="/"
            className="font-serif italic text-h3 leading-none hover:opacity-70 transition-opacity"
          >
            Yuvabe
          </Link>
          <span className="text-muted-foreground">/</span>
          <Eyebrow>ATS</Eyebrow>
        </div>
      </div>
      <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <NavTab href="/jobs" label="Jobs" prefix="/jobs" />
        <SignOutButton className="ml-auto" />
      </nav>
    </header>
  );
}
