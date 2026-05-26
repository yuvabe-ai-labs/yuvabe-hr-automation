"use client"

import { useQuery } from "@tanstack/react-query"
import type { User } from "@/types/users"

async function fetchManagers(): Promise<User[]> {
  const res = await fetch("/api/users/managers")
  if (!res.ok) throw new Error("Failed to fetch managers")
  const json = await res.json()
  return json.managers
}

export function useManagers() {
  return useQuery({
    queryKey: ["users", "managers"],
    queryFn: fetchManagers,
    staleTime: 5 * 60 * 1000,
  })
}
