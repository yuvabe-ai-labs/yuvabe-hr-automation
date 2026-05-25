import Link from "next/link";
import Image from "next/image";
import NavTab from "@/app/jobs/_components/nav-tab";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { Eyebrow } from "@/components/shared/eyebrow";
import { UserBadge } from "@/app/_components/user-badge";

export function PageHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-background z-10">
      <div className="px-4 md:px-10 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0">
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
        <UserBadge />
      </div>
      <nav className="px-4 md:px-10 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        <NavTab href="/jobs" label="Jobs" prefix="/jobs" />
        <NavTab href="/interviews" label="Interviews" prefix="/interviews" />
        <div className="ml-auto flex items-center gap-5">
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
