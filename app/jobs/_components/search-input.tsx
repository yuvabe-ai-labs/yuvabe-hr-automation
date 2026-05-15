"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({ initialSearch = "" }: { initialSearch?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const search = searchParams.get("search") ?? "";
  const [prevSearch, setPrevSearch] = useState(search);
  const [searchInput, setSearchInput] = useState(initialSearch);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-64 md:w-96">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
        strokeWidth={1.75}
      />
      <Input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search jobs…"
        className="pl-9 rounded-sm border-border bg-background text-body placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary h-9"
      />
    </div>
  );
}
