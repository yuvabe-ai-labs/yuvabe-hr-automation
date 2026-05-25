"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/app/providers"

const ROLE_LABEL: Record<string, string> = {
  admin:   "Admin",
  manager: "Manager",
  viewer:  "Viewer",
}

export function UserBadge() {
  const { role } = useSession()
  const [name, setName] = useState("")

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.name) setName(d.name) })
      .catch(() => {})
  }, [])

  return (
    <div className="flex items-baseline gap-2 shrink-0">
      {name && (
        <>
          <span className="font-serif italic text-body text-foreground/70 leading-none">
            {name}
          </span>
          <span className="text-muted-foreground/50 select-none" aria-hidden>·</span>
        </>
      )}
      <span className="caps-meta text-muted-foreground leading-none">
        {ROLE_LABEL[role] ?? role}
      </span>
    </div>
  )
}
