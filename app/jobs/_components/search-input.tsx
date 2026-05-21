"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

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
    <div className="relative min-w-0 max-w-sm">
      <input
        type="text"
        placeholder="Search jobs…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full px-3 py-1.5 pr-8 border border-border rounded-sm bg-background text-foreground text-body-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {searchInput && (
        <button
          onClick={() => setSearchInput("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
